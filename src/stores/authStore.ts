import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../types';

const EDGE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') + '/functions/v1';

interface AuthState {
  session: any | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signInWithOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  signInWithIdentifier: (identifier: string, password: string, role: string) => Promise<void>;
  signUpWithIdentifier: (data: {
    email: string;
    password: string;
    name: string;
    dept: string;
    semester: number;
    identifier: string;
    role: 'student' | 'faculty';
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, isAuthenticated: !!session });
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ profile: profile as Profile | null });
    }
    set({ isLoading: false });
  },

  signInWithOTP: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },

  verifyOTP: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    set({ session: data.session, isAuthenticated: true });
  },

  signInWithIdentifier: async (identifier: string, password: string, role: string) => {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    const res = await fetch(`${EDGE_FUNCTION_URL}/login-identifier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ identifier, password }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');

    if (result.session) {
      await supabase.auth.setSession(result.session);
    }

    set({ session: result.session, profile: result.profile, isAuthenticated: !!result.session });
  },

  signUpWithIdentifier: async (data) => {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    const res = await fetch(`${EDGE_FUNCTION_URL}/register-identifier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');

    if (result.session) {
      await supabase.auth.setSession(result.session);
    }

    set({ session: result.session, profile: result.profile, isAuthenticated: !!result.session });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const session = get().session;
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    set({ profile: data as Profile | null });
  },

  createProfile: async (data: Partial<Profile>) => {
    const session = get().session;
    if (!session) throw new Error('Not authenticated');
    const profile = { id: session.user.id, ...data } as Profile;
    const { error } = await supabase.from('profiles').insert(profile);
    if (error) throw error;
    set({ profile });
  },
}));
