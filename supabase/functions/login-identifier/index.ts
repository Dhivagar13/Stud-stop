import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts[0] !== 'pbkdf2' || parts.length !== 3) return false;
  const salt = new Uint8Array(parts[1].match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('') === parts[2];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const { identifier, password } = await req.json();
    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: 'Identifier and password required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // Look up profile by identifier (use service key to bypass RLS)
    const profileRes = await fetch(SUPABASE_URL + '/rest/v1/profiles?or=(roll_no.eq.' + identifier + ',staff_id.eq.' + identifier + ',identifier.eq.' + identifier + ')&select=*', {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY },
    });
    if (!profileRes.ok) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    const profiles = await profileRes.json();
    const profile = profiles?.[0];
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    if (!profile.password_hash) {
      return new Response(JSON.stringify({ error: 'Password not set. Use email OTP to login first.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    const passwordValid = await verifyPassword(password, profile.password_hash);
    if (!passwordValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // Get user email via admin API
    const userRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + profile.id, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    const userData = await userRes.json();

    // Sign in with password to get session
    const signInRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userData.email, password }),
    });
    if (!signInRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    const sessionData = await signInRes.json();

    const safeProfile = { ...profile };
    delete safeProfile.password_hash;
    return new Response(JSON.stringify({ session: sessionData, profile: safeProfile }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
