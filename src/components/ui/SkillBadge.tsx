import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

interface SkillBadgeProps {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const levelColors = {
  beginner: { bg: '#6B6B8A', text: '#FFFFFF' },
  intermediate: { bg: '#5DCAA5', text: '#0E0C1A' },
  advanced: { bg: '#AFA9EC', text: '#0E0C1A' },
  expert: { bg: '#FAC775', text: '#0E0C1A' },
};

export function SkillBadge({ name, level }: SkillBadgeProps) {
  const colors = levelColors[level];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  text: { fontSize: 12, fontWeight: '500' },
});
