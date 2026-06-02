import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

let cachedRole: Profile['role'] | null = null;

export async function getCurrentRole(): Promise<Profile['role'] | null> {
  if (cachedRole) return cachedRole;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  cachedRole = data?.role || null;
  return cachedRole;
}

export function useRoleAccess() {
  return { getRole: getCurrentRole };
}
