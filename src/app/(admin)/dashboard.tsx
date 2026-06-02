import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/ui/GlassCard';
import { typography, borderRadius } from '../../lib/theme';

export default function AdminDashboard() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthStore();
  const [stats, setStats] = useState({ students: 0, faculty: 0, notes: 0, doubts: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: faculty } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty');
    const { count: notes } = await supabase.from('notes').select('*', { count: 'exact', head: true });
    const { count: doubts } = await supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('is_resolved', false);
    setStats({ students: students || 0, faculty: faculty || 0, notes: notes || 0, doubts: doubts || 0 });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text }]}>Admin</Text>
        <TouchableOpacity onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <BlurView intensity={50} tint="dark" style={styles.statsGrid}>
          <View style={styles.statRow}>
            <GlassCard style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
              <Ionicons name="people-outline" size={28} color={theme.accent} />
              <Text style={[typography.h1, { color: theme.text }]}>{stats.students}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Students</Text>
            </GlassCard>
            <GlassCard style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
              <Ionicons name="school-outline" size={28} color={theme.accentSecondary} />
              <Text style={[typography.h1, { color: theme.text }]}>{stats.faculty}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Faculty</Text>
            </GlassCard>
          </View>
          <View style={styles.statRow}>
            <GlassCard style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
              <Ionicons name="document-text-outline" size={28} color={theme.warning} />
              <Text style={[typography.h1, { color: theme.text }]}>{stats.notes}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Notes</Text>
            </GlassCard>
            <GlassCard style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
              <Ionicons name="help-outline" size={28} color={theme.danger} />
              <Text style={[typography.h1, { color: theme.text }]}>{stats.doubts}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Open Doubts</Text>
            </GlassCard>
          </View>
        </BlurView>

        <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 12 }]}>Quick Actions</Text>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
          onPress={() => (router as any).push('/(admin)/users')}
        >
          <Ionicons name="people-outline" size={22} color={theme.accent} />
          <Text style={[typography.body, { color: theme.text, flex: 1, marginLeft: 12 }]}>Manage Users</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
          onPress={() => (router as any).push('/(admin)/approve-notes')}
        >
          <Ionicons name="document-text-outline" size={22} color={theme.warning} />
          <Text style={[typography.body, { color: theme.text, flex: 1, marginLeft: 12 }]}>Approve Notes</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
          onPress={() => (router as any).push('/(admin)/post-announcement')}
        >
          <Ionicons name="megaphone-outline" size={22} color={theme.accentSecondary} />
          <Text style={[typography.body, { color: theme.text, flex: 1, marginLeft: 12 }]}>Post Announcement</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  statsGrid: { borderRadius: borderRadius.xl, padding: 8, overflow: 'hidden' },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: 8 },
});
