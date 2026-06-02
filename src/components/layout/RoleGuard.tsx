import React, { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useRouter, useSegments } from 'expo-router';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inStaffGroup = segments[0] === '(staff)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      if (!profile) {
        router.replace('/(auth)/onboarding');
      } else if (profile.role === 'admin' && !inAdminGroup) {
        router.replace('/(admin)/dashboard');
      } else if (profile.role === 'faculty' && !inStaffGroup) {
        router.replace('/(staff)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, isLoading]);

  return <>{children}</>;
}
