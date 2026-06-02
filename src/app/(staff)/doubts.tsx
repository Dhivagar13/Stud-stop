import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/ui/GlassCard';
import { typography } from '../../lib/theme';
import type { Doubt } from '../../types';

export default function StaffDoubts() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [replyText, setReplyText] = useState('');
  const [selectedDoubt, setSelectedDoubt] = useState<string | null>(null);

  useEffect(() => {
    loadDoubts();
  }, []);

  async function loadDoubts() {
    const { data } = await supabase
      .from('doubts')
      .select('*')
      .eq('is_resolved', false)
      .order('upvotes', { ascending: false });
    setDoubts(data as Doubt[] || []);
  }

  async function resolveDoubt(doubtId: string) {
    await supabase.from('doubts').update({ is_resolved: true }).eq('id', doubtId);
    setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
  }

  const renderDoubt = ({ item }: { item: Doubt }) => (
    <GlassCard style={styles.doubtCard}>
      <TouchableOpacity onPress={() => setSelectedDoubt(selectedDoubt === item.id ? null : item.id)}>
        <View style={styles.doubtHeader}>
          <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{item.body}</Text>
          <Ionicons name={selectedDoubt === item.id ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
        </View>
        <View style={styles.doubtMeta}>
          <View style={[styles.subjectBadge, { backgroundColor: theme.accent + '20' }]}>
            <Text style={{ color: theme.accent, fontSize: 11 }}>{item.subject}</Text>
          </View>
          <Text style={[typography.caption, { color: theme.textMuted }]}>{item.upvotes} upvotes</Text>
        </View>
      </TouchableOpacity>

      {selectedDoubt === item.id && (
        <View style={styles.replySection}>
          <TextInput
            style={[styles.replyInput, { backgroundColor: theme.glass, color: theme.text, borderColor: theme.glassBorder }]}
            placeholder="Write a reply..."
            placeholderTextColor={theme.textMuted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={[styles.resolveBtn, { backgroundColor: theme.accent }]}
              onPress={() => resolveDoubt(item.id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, marginLeft: 4 }}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Manage Doubts</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={doubts}
        renderItem={renderDoubt}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle" size={48} color={theme.textMuted} />
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>No open doubts</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  doubtCard: { marginBottom: 8, padding: 16 },
  doubtHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  doubtMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  subjectBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  replySection: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
  replyInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
});
