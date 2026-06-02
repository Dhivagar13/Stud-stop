import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { supabase } from '../../../lib/supabase';
import { downloadFile, incrementDownloadCount } from '../../../lib/download';
import GlassCard from '../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../lib/theme';
import type { QuestionPaper, Difficulty } from '../../../types';

const DIFFICULTY_COLORS: Record<Difficulty, string> = { easy: '#5DCAA5', medium: '#FAC775', hard: '#F0997B' };
const SUBJECTS = ['All', 'Mathematics', 'Physics', 'Computer Science', 'Electronics', 'Mechanical'];

export default function PapersScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      let query = supabase.from('question_papers').select('*').order('year', { ascending: false }).limit(20);
      if (activeSubject !== 'All') query = query.eq('subject', activeSubject);
      const { data } = await query;
      setPapers(data as QuestionPaper[] || []);
      setLoading(false);
    })();
  }, [activeSubject]);

  async function handleDownload(paper: QuestionPaper) {
    if (!paper.file_url) {
      Alert.alert('Error', 'No file URL available');
      return;
    }
    setDownloadingId(paper.id);
    try {
      const filename = `${paper.subject}_${paper.year}.pdf`;
      await downloadFile(paper.file_url, filename);
      await incrementDownloadCount('question_papers', paper.id);
      setPapers((prev) => prev.map((p) => p.id === paper.id ? { ...p, downloads: (p.downloads || 0) + 1 } : p));
      Alert.alert('Downloaded', `${paper.subject} ${paper.year} paper has been saved.`);
    } catch (e: any) {
      Alert.alert('Download Failed', e.message || 'Could not download the file');
    } finally {
      setDownloadingId(null);
    }
  }

  const filteredPapers = papers.filter((p) =>
    (search === '' || p.subject.toLowerCase().includes(search.toLowerCase()))
  );

  const renderPaper = useCallback(({ item, index }: { item: QuestionPaper; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <GlassCard style={styles.paperCard}>
        <View style={styles.paperRow}>
          <View style={[styles.yearBadge, { backgroundColor: theme.accent + '20' }]}>
            <Text style={[typography.h2, { color: theme.accent }]}>{item.year}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h3, { color: theme.text }]}>{item.subject}</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>{item.university}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.difficultyDot, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] }]} />
              <Text style={[typography.caption, { color: theme.textMuted }]}>{item.difficulty}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>• {item.downloads} downloads</Text>
            </View>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Text style={[typography.h1, { color: theme.text, paddingHorizontal: 16, marginBottom: 16 }]}>Question Papers</Text>

      <BlurView intensity={40} tint="dark" style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search papers by subject..."
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

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPapers}
          renderItem={renderPaper}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredPapers.length === 0 ? styles.emptyContainer : { padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
              <Text style={[typography.h3, { color: theme.text, marginTop: 12 }]}>No papers found</Text>
              <Text style={[typography.body, { color: theme.textMuted }]}>
                {search ? 'Try a different search term' : `No papers in ${activeSubject}`}
              </Text>
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
    padding: 12, borderRadius: borderRadius.md, gap: 8, overflow: 'hidden',
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  paperCard: { marginBottom: 10 },
  paperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yearBadge: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  difficultyDot: { width: 8, height: 8, borderRadius: 4 },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
