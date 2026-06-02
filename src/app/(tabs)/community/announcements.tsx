import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import GlassCard from '../../../components/ui/GlassCard';
import { typography } from '../../../lib/theme';
import type { Announcement, Priority } from '../../../types';

const PRIORITY_CONFIG: Record<Priority, { color: string; icon: string }> = {
  critical: { color: '#F0997B', icon: 'alert-circle' },
  high: { color: '#FAC775', icon: 'arrow-up-circle' },
  medium: { color: '#AFA9EC', icon: 'information-circle' },
  low: { color: '#6B6B8A', icon: 'ellipse-outline' },
};

const PAGE_SIZE = 10;

export default function AnnouncementsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadAnnouncements();
    const sub = supabase
      .channel('announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload: any) => {
        setAnnouncements((prev) => [payload.new as Announcement, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function loadAnnouncements() {
    setError(null);
    const { data, error: err } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);
    if (err) { setError(err.message); } else { setAnnouncements(data as Announcement[] || []); setHasMore((data?.length || 0) >= PAGE_SIZE); }
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    setPage(0);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);
    setAnnouncements(data as Announcement[] || []);
    setHasMore((data?.length || 0) >= PAGE_SIZE);
    setRefreshing(false);
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    if (data?.length) {
      setAnnouncements((prev) => [...prev, ...(data as Announcement[])]);
      setPage(nextPage);
      setHasMore(data.length >= PAGE_SIZE);
    } else { setHasMore(false); }
    setLoadingMore(false);
  }

  async function markAsRead(id: string) {
    const ann = announcements.find((a) => a.id === id);
    if (!ann || !session || ann.read_by.includes(session.user.id)) return;
    await supabase
      .from('announcements')
      .update({ read_by: [...ann.read_by, session.user.id] })
      .eq('id', id);
    setAnnouncements((prev) => prev.map((a) =>
      a.id === id ? { ...a, read_by: [...a.read_by, session.user.id] } : a
    ));
  }

  const renderAnnouncement = useCallback(({ item, index }: { item: Announcement; index: number }) => {
    const config = PRIORITY_CONFIG[item.priority];
    const isUnread = !item.read_by.includes(session?.user.id || '');
    const isHighPriority = item.priority === 'high' || item.priority === 'critical';

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <GlassCard
          style={[
            styles.card,
            isHighPriority && { borderLeftWidth: 4, borderLeftColor: config.color },
            isUnread && { borderColor: theme.accent, borderWidth: 1 },
          ]}
        >
          <TouchableOpacity onPress={() => markAsRead(item.id)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <Ionicons name={config.icon as any} size={22} color={config.color} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.titleRow}>
                  <Text style={[typography.h3, { color: theme.text }]}>{item.title}</Text>
                  {isHighPriority && <View style={[styles.pulseDot, { backgroundColor: config.color }]} />}
                </View>
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              {isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
            </View>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 12 }]}>{item.body}</Text>
            {item.category && (
              <View style={[styles.categoryTag, { backgroundColor: theme.accent + '15' }]}>
                <Text style={[typography.caption, { color: theme.accent, fontWeight: '600' }]}>{item.category}</Text>
              </View>
            )}
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  }, [theme, session]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <Text style={[typography.h1, { color: theme.text, paddingHorizontal: 16, marginBottom: 16 }]}>Announcements</Text>
        <View style={{ padding: 16 }}>{[1, 2, 3].map((i) => (
          <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.cardBg, marginBottom: 10 }]}>
            <View style={[styles.skeletonLine, { width: '70%', backgroundColor: theme.glassBorder }]} />
            <View style={[styles.skeletonLine, { width: '90%', marginTop: 8, backgroundColor: theme.glassBorder }]} />
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
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accent }]} onPress={() => { setLoading(true); loadAnnouncements(); }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Text style={[typography.h1, { color: theme.text, paddingHorizontal: 16, marginBottom: 16 }]}>Announcements</Text>
      <FlatList
        data={announcements}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={announcements.length === 0 ? styles.emptyContainer : { padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        onViewableItemsChanged={({ viewableItems }) => {
          viewableItems.forEach(({ item }) => markAsRead((item as Announcement).id));
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.h3, { color: theme.text, marginTop: 12 }]}>No announcements</Text>
            <Text style={[typography.body, { color: theme.textMuted }]}>Check back later</Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.accent} style={{ padding: 16 }} /> : null}
        windowSize={5}
        initialNumToRender={8}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8, marginTop: 4 },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  skeletonCard: { borderRadius: 20, padding: 20 },
  skeletonLine: { height: 14, borderRadius: 7 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
