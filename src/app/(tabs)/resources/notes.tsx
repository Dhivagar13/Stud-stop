import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { supabase } from '../../../lib/supabase';
import { downloadFile, incrementDownloadCount } from '../../../lib/download';
import GlassCard from '../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../lib/theme';
import type { Note } from '../../../types';

const SUBJECTS = ['All', 'Mathematics', 'Physics', 'Computer Science', 'Electronics', 'Mechanical'];

export default function NotesScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  React.useEffect(() => {
    loadNotes();
  }, [activeSubject]);

  async function loadNotes() {
    setError(null);
    let query = supabase
      .from('notes')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (activeSubject !== 'All') query = query.eq('subject', activeSubject);
    const { data, error: err } = await query;
    if (err) { setError(err.message); } else { setNotes(data as Note[] || []); }
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    setError(null);
    let query = supabase.from('notes').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(20);
    if (activeSubject !== 'All') query = query.eq('subject', activeSubject);
    const { data } = await query;
    setNotes(data as Note[] || []);
    setRefreshing(false);
  }

  async function handleDownload(note: Note) {
    if (!note.file_url) {
      Alert.alert('Error', 'No file URL available');
      return;
    }
    setDownloadingId(note.id);
    try {
      const filename = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await downloadFile(note.file_url, filename, (progress) => {
        if (progress >= 1) setDownloadingId(null);
      });
      await incrementDownloadCount('notes', note.id);
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, downloads: (n.downloads || 0) + 1 } : n));
      Alert.alert('Downloaded', `${note.title} has been saved.`);
    } catch (e: any) {
      Alert.alert('Download Failed', e.message || 'Could not download the file');
    } finally {
      setDownloadingId(null);
    }
  }

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  const renderNote = useCallback(({ item, index }: { item: Note; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <GlassCard style={styles.noteCard}>
        <View style={styles.noteRow}>
          <View style={[styles.subjectStripe, { backgroundColor: stringToColor(item.subject) }]} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.h3, { color: theme.text }]}>{item.title}</Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
              {item.subject} • {(item.file_size / 1024 / 1024).toFixed(1)} MB
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              {item.downloads} downloads • v{item.version}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: theme.accent + '20' }]}
            onPress={() => handleDownload(item)}
            disabled={downloadingId === item.id}
          >
            {downloadingId === item.id ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Ionicons name="download-outline" size={22} color={theme.accent} />
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  ), [theme, downloadingId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <Text style={[typography.h1, { color: theme.text, paddingHorizontal: 16, marginBottom: 16 }]}>Notes</Text>
        <View style={{ padding: 16 }}>{[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.cardBg, marginBottom: 10 }]}>
            <View style={[styles.skeletonLine, { width: `${70 + i * 5}%`, backgroundColor: theme.glassBorder }]} />
          </View>
        ))}</View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.danger} />
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accent }]} onPress={() => { setLoading(true); loadNotes(); }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Text style={[typography.h1, { color: theme.text, paddingHorizontal: 16, marginBottom: 12 }]}>Notes</Text>

      <BlurView intensity={40} tint="dark" style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search notes by title or subject..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </BlurView>

      <FlatList
        horizontal
        data={SUBJECTS}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: item === activeSubject ? theme.accent : theme.glass }]}
            onPress={() => setActiveSubject(item)}
          >
            <Text style={{ color: item === activeSubject ? '#fff' : theme.text, fontSize: 13, fontWeight: '500' }}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(i) => i}
      />

      <FlatList
        data={filteredNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredNotes.length === 0 ? styles.emptyContainer : { padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.h3, { color: theme.text, marginTop: 12 }]}>No notes found</Text>
            <Text style={[typography.body, { color: theme.textMuted }]}>
              {search ? 'Try a different search term' : `No notes in ${activeSubject}`}
            </Text>
          </View>
        }
        windowSize={5}
        initialNumToRender={8}
        removeClippedSubviews
      />
    </View>
  );
}

function stringToColor(str: string): string {
  const colors = ['#7F77DD', '#1D9E75', '#EF9F27', '#D85A30', '#5DCAA5', '#AFA9EC'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
    padding: 12, borderRadius: borderRadius.md, gap: 8, overflow: 'hidden',
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  noteCard: { marginBottom: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectStripe: { width: 4, height: 48, borderRadius: 2 },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  skeletonCard: { borderRadius: 20, padding: 20 },
  skeletonLine: { height: 14, borderRadius: 7 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
