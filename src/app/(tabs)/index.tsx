import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import GlassCard from '../../components/ui/GlassCard';
import { GyroParallax } from '../../components/ui/GyroParallax';
import { PlacementScore } from '../../components/ui/PlacementScore';
import PatternBackground from '../../components/ui/PatternBackground';
import AccentDecoration from '../../components/ui/AccentDecoration';
import MorphingBorder from '../../components/ui/MorphingBorder';
import GradientIcon from '../../components/ui/GradientIcon';
import { typography } from '../../lib/theme';
import type { Note, Doubt, Announcement } from '../../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const theme = useThemeStore((s) => s.theme);
  const profile = useAuthStore((s) => s.profile);
  const scrollRef = useRef<ScrollView>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ classes: 4, doubts: 0, notices: 0 });

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setError(null);
    try {
      const [notesRes, doubtsRes, annsRes] = await Promise.all([
        supabase.from('notes').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('doubts').select('*').order('upvotes', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
      ]);
      setNotes(notesRes.data as Note[] || []);
      setDoubts(doubtsRes.data as Doubt[] || []);
      setAnnouncements(annsRes.data as Announcement[] || []);
      const pendingDoubts = (doubtsRes.data || []).filter(d => !d.is_resolved).length;
      const unreadNotices = (annsRes.data || []).filter((a) => !(a.read_by || []).includes(profile?.id || '')).length;
      setStats({ classes: 4, doubts: pendingDoubts, notices: unreadNotices });
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  const quickStats = [
    { icon: 'school-outline' as const, label: 'Classes', value: `${stats.classes} today`, tone: theme.accent },
    { icon: 'help-outline' as const, label: 'Doubts', value: `${stats.doubts} pending`, tone: theme.accentTertiary },
    { icon: 'notifications-outline' as const, label: 'Notices', value: `${stats.notices} unread`, tone: theme.danger },
    { icon: 'trending-up-outline' as const, label: 'Score', value: `${profile?.placement_score || 0}%`, tone: theme.accentSecondary },
  ];

  const quickActions = [
    {
      icon: 'cloud-upload-outline' as const, label: 'Upload notes',
      route: '/(tabs)/resources/notes' as const, color: theme.accent,
      grad: [theme.accent, theme.accentTertiary] as const,
    },
    {
      icon: 'sparkles-outline' as const, label: 'Ask AI',
      route: '/(tabs)/community/ai-chat' as const, color: theme.accentSecondary,
      grad: [theme.accentSecondary, theme.accentTertiary] as const,
    },
    {
      icon: 'trophy-outline' as const, label: 'Practice',
      route: '/(tabs)/placement' as const, color: theme.accentTertiary,
      grad: [theme.accentTertiary, theme.accent] as const,
    },
  ];

  const firstName = profile?.name?.split(' ')[0] || 'Student';
  const progressLabel = getReadinessLabel(profile?.placement_score || 0);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <PatternBackground pattern="dots" opacity={0.4} />
        <LinearGradient colors={[theme.accent + '24', theme.bg]} style={styles.gradient}>
          <View style={{ padding: 24, paddingTop: 60 }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.cardBg, marginBottom: 12 }]}>
                <View style={[styles.skeletonLine, { width: `${60 + i * 10}%`, backgroundColor: theme.glassBorder }]} />
                <View style={[styles.skeletonLine, { width: `${36 + i * 8}%`, backgroundColor: theme.glassBorder, marginTop: 10, opacity: 0.6 }]} />
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <PatternBackground pattern="crosshatch" opacity={0.3} />
        <Ionicons name="cloud-offline-outline" size={54} color={theme.danger} />
        <Text style={[typography.h2, { color: theme.text, marginTop: 14 }]}>Dashboard could not load</Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accent }]} onPress={() => { setLoading(true); loadDashboard(); }}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <PatternBackground pattern="dots" opacity={0.35} />
      <AccentDecoration
        shape="circle"
        size="lg"
        position={{ top: 100, right: 30 }}
        floating
        delay={0}
      />
      <AccentDecoration
        shape="diamond"
        size="sm"
        position={{ top: 200, left: 20 }}
        floating
        delay={500}
        color={theme.accentSecondary + '50'}
      />
      <AccentDecoration
        shape="line"
        size="md"
        position={{ top: 160, right: 80 }}
        floating
        delay={1000}
        colors={[theme.accent + '60', theme.accentSecondary + '40'] as const}
      />
      <LinearGradient colors={[theme.accent + '28', theme.bg, theme.bg]} locations={[0, 0.42, 1]} style={styles.gradient}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        >
          <View style={styles.topBar}>
            <View>
              <Text style={[typography.label, { color: theme.textMuted }]}>Stud Stop</Text>
              <Text style={[typography.h2, { color: theme.text }]}>Today at a glance</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRefresh}
              style={[styles.iconButton, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}
            >
              <Ionicons name="refresh-outline" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>

          <GyroParallax depth={14}>
            <MorphingBorder borderRadius={28} borderWidth={1.5} animated>
              <BlurView intensity={50} tint="dark" style={styles.heroCard}>
                <LinearGradient colors={[theme.accent + '40', 'transparent']} style={styles.heroGlow} />
                <View style={styles.heroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>Hello,</Text>
                    <Text style={[typography.hero, { color: theme.text }]} numberOfLines={1}>{firstName}</Text>
                    <Text style={[typography.body, { color: theme.textMuted, marginTop: 4 }]}>
                      {profile?.dept || 'Department'} • Sem {profile?.semester || '-'}
                    </Text>
                    <View style={[styles.readinessChip, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                      <Ionicons name="pulse-outline" size={14} color={theme.accentSecondary} />
                      <Text style={[typography.caption, { color: theme.text }]}>{progressLabel}</Text>
                    </View>
                  </View>
                  <PlacementScore score={profile?.placement_score || 0} size={100} />
                </View>
              </BlurView>
            </MorphingBorder>
          </GyroParallax>

          <View style={styles.statsRow}>
            {quickStats.map((stat, i) => (
              <BlurView key={i} intensity={40} tint="dark" style={styles.statPill}>
                <View style={[styles.statIcon, { backgroundColor: stat.tone + '22' }]}>
                  <Ionicons name={stat.icon} size={18} color={stat.tone} />
                </View>
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>{stat.label}</Text>
                <Text style={[typography.caption, { color: theme.text, fontWeight: '600' }]}>{stat.value}</Text>
              </BlurView>
            ))}
          </View>

          <View style={styles.actionRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.82}
                onPress={() => router.push(action.route)}
                style={[styles.actionCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
              >
                <GradientIcon
                  name={action.icon}
                  size={36}
                  colors={action.grad}
                  iconSize={18}
                />
                <Text style={[typography.caption, { color: theme.text, fontWeight: '600' }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: theme.text }]}>Recent Notes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/resources/notes')}>
              <Text style={[typography.caption, { color: theme.accent }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {notes.length === 0 ? (
            <EmptyState icon="documents-outline" title="No notes available" body="Approved notes will appear here." />
          ) : (
            <FlatList
              data={notes}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.72}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item, index }) => (
                <GlassCard
                  style={styles.noteCard}
                  onPress={() => router.push('/(tabs)/resources/notes')}
                  variant={index % 2 === 0 ? 'elevated' : 'outlined'}
                  showCorners
                  accentPosition="top"
                  cornerColor={stringToColor(item.subject)}
                >
                  <View style={[styles.noteIcon, { backgroundColor: stringToColor(item.subject) + '24' }]}>
                    <Ionicons name="document-text-outline" size={28} color={stringToColor(item.subject)} />
                  </View>
                  <Text style={[typography.h3, { color: theme.text, marginTop: 10 }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {item.subject} • {item.downloads} downloads
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[typography.caption, { color: theme.accent }]}>Open notes</Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.accent} />
                  </View>
                </GlassCard>
              )}
              keyExtractor={(item) => item.id}
            />
          )}

          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: theme.text }]}>Trending Doubts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/community/doubts')}>
              <Text style={[typography.caption, { color: theme.accent }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {doubts.length === 0 ? (
            <EmptyState icon="chatbubble-ellipses-outline" title="No doubts yet" body="Questions from your community will show up here." />
          ) : (
            doubts.slice(0, 3).map((doubt, i) => (
              <GlassCard
                key={doubt.id}
                style={styles.doubtCard}
                onPress={() => router.push('/(tabs)/community/doubts')}
                variant={i === 0 ? 'gradient' : 'elevated'}
                accentPosition="left"
                cornerColor={stringToColor(doubt.subject)}
              >
                <View style={styles.doubtRow}>
                  <View style={[styles.subjectStripe, { backgroundColor: stringToColor(doubt.subject) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: theme.text }]} numberOfLines={2}>{doubt.body}</Text>
                    <View style={styles.doubtMeta}>
                      <Text style={[typography.caption, { color: theme.accent }]}>{doubt.subject}</Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>• {doubt.upvotes || 0} upvotes</Text>
                      {doubt.is_resolved && <Text style={[typography.caption, { color: theme.success }]}>• Solved</Text>}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </View>
              </GlassCard>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: theme.text }]}>Latest Announcements</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/community/announcements')}>
              <Text style={[typography.caption, { color: theme.accent }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {announcements.length === 0 ? (
            <EmptyState icon="megaphone-outline" title="No announcements" body="Important notices will appear here." />
          ) : (
            announcements.map((ann) => (
              <GlassCard
                key={ann.id}
                style={styles.announceCard}
                onPress={() => router.push('/(tabs)/community/announcements')}
                variant="elevated"
                showCorners
                cornerColor={ann.priority === 'critical' ? theme.danger : ann.priority === 'high' ? theme.warning : theme.accent}
              >
                <View style={styles.announceRow}>
                  <Ionicons
                    name={ann.priority === 'high' || ann.priority === 'critical' ? 'alert-circle' : 'information-circle'}
                    size={20}
                    color={ann.priority === 'critical' ? theme.danger : ann.priority === 'high' ? theme.warning : theme.accent}
                  />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[typography.body, { color: theme.text, fontWeight: '600' }]}>{ann.title}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>{ann.body}</Text>
                  </View>
                  <View style={[styles.priorityPill, { backgroundColor: priorityColor(ann.priority, theme) + '20' }]}>
                    <Text style={[typography.caption, { color: priorityColor(ann.priority, theme), fontWeight: '600' }]}>{ann.priority}</Text>
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function stringToColor(str: string): string {
  const colors = ['#D4744A', '#E8C9A0', '#B88B6A', '#C94A3A', '#5B8A72', '#D4A030'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getReadinessLabel(score: number): string {
  if (score >= 75) return 'Placement ready';
  if (score >= 50) return 'Keep building momentum';
  return 'Focus plan recommended';
}

function priorityColor(priority: Announcement['priority'], theme: ReturnType<typeof useThemeStore.getState>['theme']): string {
  if (priority === 'critical') return theme.danger;
  if (priority === 'high') return theme.warning;
  return theme.accent;
}

function EmptyState({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <View style={[styles.emptyState, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}>
      <Ionicons name={icon} size={24} color={theme.accent} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: theme.text, fontWeight: '600' }]}>{title}</Text>
        <Text style={[typography.caption, { color: theme.textMuted }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 100 },
  skeletonCard: { borderRadius: 20, padding: 20 },
  skeletonLine: { height: 14, borderRadius: 7 },
  retryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  heroCard: { padding: 20, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  readinessChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 14 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  statPill: { flex: 1, minWidth: '45%', borderRadius: 18, padding: 12, alignItems: 'center', overflow: 'hidden' },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  actionCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 12, gap: 9, alignItems: 'center' },
  noteCard: { width: width * 0.64, marginRight: 12 },
  noteIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14 },
  doubtCard: { marginHorizontal: 16, marginBottom: 8 },
  doubtRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectStripe: { width: 4, borderRadius: 2 },
  doubtMeta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  announceCard: { marginHorizontal: 16, marginBottom: 8 },
  announceRow: { flexDirection: 'row', alignItems: 'center' },
  priorityPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  emptyState: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14, marginHorizontal: 16 },
});
