import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { View, StyleSheet, Animated, Platform } from 'react-native';

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: 'grid', default: 'grid-outline' },
  resources: { focused: 'library', default: 'library-outline' },
  placement: { focused: 'trending-up', default: 'trending-up-outline' },
  community: { focused: 'chatbubbles', default: 'chatbubbles-outline' },
  profile: { focused: 'person', default: 'person-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons = TAB_ICONS[name] || { focused: 'ellipse', default: 'ellipse-outline' };
  return (
    <Ionicons
      name={focused ? icons.focused : icons.default}
      size={22}
      color={color}
    />
  );
}

function AnimatedTabIcon({ name, focused, theme }: { name: string; focused: boolean; theme: any }) {
  const glowAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(glowAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 12,
      stiffness: 160,
    }).start();
  }, [focused]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const scale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <Animated.View
          style={[
            styles.tabGlow,
            {
              backgroundColor: theme.accent,
              opacity: glowOpacity,
              transform: [{ scale }],
            },
          ]}
        />
      )}
      <TabIcon
        name={name}
        focused={focused}
        color={focused ? theme.accent : theme.textMuted}
      />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.glass,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 90 : 75,
            paddingBottom: Platform.OS === 'ios' ? 30 : 12,
            paddingTop: 8,
            elevation: 12,
            boxShadow: '0 -4 12 rgba(0,0,0,0.2)',
          },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          animation: 'shift',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="index" focused={focused} theme={theme} />
            ),
          }}
        />
        <Tabs.Screen
          name="resources"
          options={{
            title: 'Resources',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="resources" focused={focused} theme={theme} />
            ),
          }}
        />
        <Tabs.Screen
          name="placement"
          options={{
            title: 'Placement',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="placement" focused={focused} theme={theme} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="community" focused={focused} theme={theme} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon name="profile" focused={focused} theme={theme} />
            ),
          }}
        />
      </Tabs>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  tabGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    top: -5,
  },
});
