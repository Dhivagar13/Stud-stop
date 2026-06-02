import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/ui/GlassCard';
import { typography, borderRadius } from '../../lib/theme';
import type { Note } from '../../types';

export default function ApproveNotesScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingNotes();
  }, []);

  async function loadPendingNotes() {
    setError(null);
    const { data, error: err } = await supabase
      .from('notes')
      .select('*, uploader:profiles!uploader_id(name)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); } else { setNotes(data as any[] || []); }
    setLoading(false);
  }

  async function handleApprove(noteId: string) {
    setProcessing(noteId);
    const { error: err } = await supabase.from('notes').update({ is_approved: true }).eq('id', noteId);
    if (err) { Alert.alert('Error', err.message); } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      Alert.alert('Approved', 'Note has been approved and is now visible to students.');
    }
    setProcessing(null);
  }

  async function handleReject(note: Note) {
    Alert.alert(
      'Reject Note',
      `Are you sure you want to reject "${note.title}"? This will permanently delete the note.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject', style: 'destructive',
          onPress: async () => {
            setProcessing(note.id);
            await supabase.from('notes').delete().eq('id', note.id);
            setNotes((prev) => prev.filter((n) => n.id !== note.id));
            setProcessing(null);
            Alert.alert('Rejected', 'The note has been deleted.');
          },
        },
      ]
    );
  }

  const renderNote = useCallback(({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <GlassCard style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <View style={[styles.iconBox, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="document-text-outline" size={24} color={theme.warning} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.h3, { color: theme.text }]}>{item.title}</Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
              {item.subject} • Sem {item.semester}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              Uploaded by {item.uploader?.name || 'Unknown'} • {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.approveBtn, { backgroundColor: theme.success + '20' }]}
            onPress={() => handleApprove(item.id)}
            disabled={processing === item.id}
          >
            {processing === item.id ? (
              <ActivityIndicator size="small" color={theme.success} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                <Text style={[typography.body, { color: theme.success, marginLeft: 6 }]}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectBtn, { backgroundColor: theme.danger + '20' }]}
            onPress={() => handleReject(item)}
            disabled={processing === item.id}
          >
            <Ionicons name="close-circle" size={18} color={theme.danger} />
            <Text style={[typography.body, { color: theme.danger, marginLeft: 6 }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  ), [theme, processing]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Approve Notes</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.danger} />
          <Text style={[typography.body, { color: theme.textMuted, marginTop: 12 }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notes.length === 0 ? styles.emptyContainer : { padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={48} color={theme.textMuted} />
              <Text style={[typography.h3, { color: theme.text, marginTop: 12 }]}>All caught up!</Text>
              <Text style={[typography.body, { color: theme.textMuted }]}>No pending notes to review.</Text>
            </View>
          }
          windowSize={5}
          initialNumToRender={8}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  noteCard: { marginBottom: 10 },
  noteHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12 },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
