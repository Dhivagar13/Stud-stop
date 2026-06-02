import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return 'pbkdf2:' + saltHex + ':' + hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const { email, password, name, dept, semester, identifier, role } = await req.json();
    if (!email || !password || !name || !dept || !identifier) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // Create auth user via admin API
    const createRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    if (!createRes.ok) {
      const err = await createRes.json();
      return new Response(JSON.stringify({ error: err.msg || 'Failed to create user' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    const authUser = await createRes.json();
    const userId = authUser.id;

    // Hash password and insert profile
    const passwordHash = await hashPassword(password);
    const profileData: Record<string, unknown> = { id: userId, name, dept, semester: semester || 1, role: role || 'student', password_hash: passwordHash, identifier, skills: {}, placement_score: 0 };
    if (role === 'student') profileData.roll_no = identifier;
    else profileData.staff_id = identifier;

    const insertRes = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
      method: 'POST',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(profileData),
    });
    if (!insertRes.ok) {
      // Rollback: delete auth user
      await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + userId, { method: 'DELETE', headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY } });
      const err = await insertRes.json();
      return new Response(JSON.stringify({ error: err.message || 'Failed to create profile' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // Sign in to get session
    const signInRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const sessionData = signInRes.ok ? await signInRes.json() : null;

    const safeProfile = { ...profileData };
    delete (safeProfile as any).password_hash;
    return new Response(JSON.stringify({ user: authUser, profile: safeProfile, session: sessionData }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
