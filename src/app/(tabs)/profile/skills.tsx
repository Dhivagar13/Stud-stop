import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { SkillBadge } from '../../../components/ui/SkillBadge';
import GlassCard from '../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../lib/theme';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export default function SkillsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useAuthStore();
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState<number>(1);

  async function addSkill() {
    if (!skillName.trim()) return;
    const level = LEVELS[skillLevel];
    await supabase.from('skills').insert({
      student_id: profile?.id,
      name: skillName.trim(),
      category: 'technical',
      level,
      verified: false,
    });
    setSkillName('');
    refreshProfile();
  }

  const existingSkills = profile?.skills ? Object.entries(profile.skills) : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>My Skills</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GlassCard style={styles.addCard}>
          <Text style={[typography.h3, { color: theme.text }]}>Add New Skill</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            placeholder="Skill name"
            placeholderTextColor={theme.textMuted}
            value={skillName}
            onChangeText={setSkillName}
          />
          <Text style={[typography.label, { color: theme.textMuted, marginTop: 12, marginBottom: 8 }]}>Proficiency Level</Text>
          <View style={styles.levelRow}>
            {LEVELS.map((level, i) => (
              <TouchableOpacity
                key={level}
                style={[styles.levelBtn, { backgroundColor: i === skillLevel ? theme.accent : theme.glass }]}
                onPress={() => setSkillLevel(i)}
              >
                <Text style={{ color: i === skillLevel ? '#fff' : theme.text, fontSize: 12 }}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={addSkill}>
            <Text style={styles.addBtnText}>Add Skill</Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 12 }]}>Current Skills</Text>
        <View style={styles.skillsGrid}>
          {existingSkills.map(([name, level]) => (
            <SkillBadge key={name} name={name} level={level as any} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  addCard: { padding: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, marginTop: 12 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  addBtn: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
});
