import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../stores/themeStore';
import { glassLevels, borderRadius } from '../../lib/theme';

interface GlassTabBarProps {
  tabs: { key: string; label: string; icon: React.ReactNode }[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function GlassTabBar({ tabs, activeTab, onTabPress }: GlassTabBarProps) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <BlurView intensity={80} tint="dark" style={styles.container}>
      <View
        style={[
          styles.inner,
          {
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.20)',
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.key)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
            >
              {tab.icon}
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: isActive ? theme.accent : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderWidth: 1,
    paddingBottom: 20,
  },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 8 },
  activeTab: { opacity: 1 },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
