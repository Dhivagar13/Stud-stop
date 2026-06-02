import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/ui/GlassCard';
import { typography } from '../../lib/theme';
import type { Profile } from '../../types';

export default function UsersScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'all' | 'student' | 'faculty'>('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    let query = supabase.from('profiles').select('*').limit(20);
    if (filter !== 'all') query = query.eq('role', filter);
    const { data } = await query;
    setUsers(data as Profile[] || []);
  }

  const renderUser = ({ item }: { item: Profile }) => (
    <GlassCard style={styles.userCard}>
      <View style={styles.userRow}>
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>{item.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: theme.text }]}>{item.name}</Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {item.role} • {item.dept} • Sem {item.semester}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'student' ? theme.accent + '20' : theme.accentSecondary + '20' }]}>
          <Text style={{ color: item.role === 'student' ? theme.accent : theme.accentSecondary, fontSize: 11 }}>
            {item.role}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'student', 'faculty'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter === f ? theme.accent : theme.glass }]}
            onPress={() => setFilter(f)}
          >
            <Text style={{ color: filter === f ? '#fff' : theme.text, fontSize: 13 }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        initialNumToRender={8}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  userCard: { marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});
