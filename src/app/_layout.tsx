import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '../stores/themeStore';
import { RoleGuard } from '../components/layout/RoleGuard';
import { useNetworkListener } from '../stores/offlineStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications, handleNotificationResponse } from '../lib/notifications';
import { View, Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});

function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const themeMode = useThemeStore((s) => s.mode);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useNetworkListener();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!session?.user.id) return;
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await supabase.from('push_tokens').upsert({
            user_id: session.user.id,
            token,
            platform: Platform.OS,
          }, { onConflict: 'user_id' });
        }
      } catch {}
    })();
  }, [session?.user.id]);

  useEffect(() => {
    const cleanup = handleNotificationResponse((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'announcement') {
        (router as any).push('/(tabs)/community/announcements');
      }
    });
    return cleanup;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RoleGuard>
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(staff)" />
            </Stack>
          </View>
        </RoleGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
