import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { getAPIConfig } from '../../../lib/ai';
import GlassCard from '../../../components/ui/GlassCard';
import { DoubtModal } from '../../../components/modals/DoubtModal';
import { typography } from '../../../lib/theme';
import type { Doubt } from '../../../types';

const PAGE_SIZE = 10;

export default function DoubtsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const apiConfig = getAPIConfig();

  useEffect(() => {
    loadDoubts();
    const sub = supabase
      .channel('doubts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doubts' }, (payload: any) => {
        setDoubts((prev) => [payload.new as Doubt, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'doubts' }, (payload: any) => {
        setDoubts((prev) => prev.map((d) => (d.id === payload.new.id ? payload.new as Doubt : d)));
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function loadDoubts() {
    setError(null);
    const { data, error: err } = await supabase
      .from('doubts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);
    if (err) { setError(err.message); setLoading(false); return; }
    setDoubts(data as Doubt[] || []);
    setHasMore((data?.length || 0) >= PAGE_SIZE);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    setPage(0);
    const { data } = await supabase
      .from('doubts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);
    setDoubts(data as Doubt[] || []);
    setHasMore((data?.length || 0) >= PAGE_SIZE);
    setRefreshing(false);
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data } = await supabase
      .from('doubts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    if (data?.length) {
      setDoubts((prev) => [...prev, ...(data as Doubt[])]);
      setPage(nextPage);
      setHasMore(data.length >= PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  async function handleUpvote(id: string) {
    const doubt = doubts.find((d) => d.id === id);
    if (!doubt) return;
    await supabase.from('doubts').update({ upvotes: (doubt.upvotes || 0) + 1 }).eq('id', id);
    setDoubts((prev) => prev.map((d) => d.id === id ? { ...d, upvotes: (d.upvotes || 0) + 1 } : d));
  }

  const renderSkeleton = () => (
    <View style={{ padding: 16, paddingBottom: 100 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.skeletonLine, { width: '80%', backgroundColor: theme.glassBorder }]} />
          <View style={[styles.skeletonLine, { width: '50%', marginTop: 8, backgroundColor: theme.glassBorder }]} />
        </View>
      ))}
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="cloud-offline-outline" size={48} color={theme.danger} />
      <Text style={[typography.body, { color: theme.textMuted, marginTop: 12, textAlign: 'center' }]}>
        {error || 'Failed to load doubts'}
      </Text>
      <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accent }]} onPress={() => { setLoading(true); loadDoubts(); }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} />
      <Text style={[typography.h3, { color: theme.text, marginTop: 12 }]}>No doubts yet</Text>
      <Text style={[typography.body, { color: theme.textMuted, marginTop: 4, textAlign: 'center' }]}>
        Post your first doubt to get help from classmates and AI
      </Text>
    </View>
  );

  const renderDoubt = useCallback(({ item, index }: { item: Doubt; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity onPress={() => (router as any).push(`/(tabs)/community/doubt/${item.id}`)}>
        <GlassCard style={styles.doubtCard}>
          <View style={styles.doubtHeader}>
            <View style={[styles.subjectStripe, { backgroundColor: stringToColor(item.subject) }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.body, { color: theme.text }]} numberOfLines={2}>
                {item.body}
              </Text>
              <View style={styles.tagRow}>
                {(item.tags || []).slice(0, 3).map((tag: string) => (
                  <Text key={tag} style={[styles.tag, { backgroundColor: theme.accent + '20', color: theme.accent }]}>
                    {tag}
                  </Text>
                ))}
                <Text style={[typography.caption, { color: theme.textMuted }]}>{item.subject}</Text>
              </View>
            </View>
            {item.is_resolved && (
              <View style={[styles.solvedBadge, { backgroundColor: theme.success + '20' }]}>
                <Text style={[typography.caption, { color: theme.success }]}>Solved</Text>
              </View>
            )}
          </View>
          <View style={styles.doubtFooter}>
            <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(item.id)}>
              <Ionicons name="arrow-up-outline" size={18} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted }]}>{item.upvotes || 0}</Text>
            </TouchableOpacity>
            <View style={styles.replyInfo}>
              <Ionicons name="chatbubble-outline" size={16} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted, marginLeft: 4 }]}>Replies</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  ), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={[typography.h1, { color: theme.text }]}>Doubts</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.aiBtn, { backgroundColor: theme.accentSecondary + '20' }]}
            onPress={() => {
              if (!apiConfig.hasKey) {
                Alert.alert('AI Setup Required', 'Add EXPO_PUBLIC_OPENROUTER_API_KEY to .env to use AI assistant');
                return;
              }
              (router as any).push('/(tabs)/community/ai-chat');
            }}
          >
            <Ionicons name="sparkles" size={18} color={theme.accentSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.accent }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? renderSkeleton() : error ? renderError() : (
        <FlatList
          data={doubts}
          renderItem={renderDoubt}
          keyExtractor={(item) => item.id}
          contentContainerStyle={!doubts.length ? styles.emptyContainer : { padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.accent} style={{ padding: 16 }} /> : null}
          windowSize={5}
          initialNumToRender={8}
          removeClippedSubviews
        />
      )}

      <DoubtModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  aiBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  doubtCard: { marginBottom: 10 },
  doubtHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  subjectStripe: { width: 4, height: 44, borderRadius: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 11, fontWeight: '500' },
  solvedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  doubtFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyInfo: { flexDirection: 'row', alignItems: 'center' },
  skeletonCard: { marginBottom: 10, padding: 20, borderRadius: 20 },
  skeletonLine: { height: 14, borderRadius: 7 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyContainer: { flex: 1 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
});
