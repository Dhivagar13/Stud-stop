import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

serve(async (req) => {
  try {
    const { email, password, name, dept, semester, identifier, role } = await req.json();

    if (!email || !password || !name || !dept || !identifier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userId = authData.user.id;
    const passwordHash = await bcrypt.hash(password);

    const profileData: Record<string, unknown> = {
      id: userId,
      name,
      dept,
      semester: semester || 1,
      role: role || 'student',
      password_hash: passwordHash,
      identifier,
      skills: {},
      placement_score: 0,
    };

    if (role === 'student') {
      profileData.roll_no = identifier;
    } else {
      profileData.staff_id = identifier;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    const { password_hash: _, ...safeProfile } = profileData;

    return new Response(JSON.stringify({
      user: authData.user,
      profile: safeProfile,
      session: sessionData?.session ?? null,
      sessionError: sessionError?.message ?? null,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
