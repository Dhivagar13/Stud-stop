import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../../stores/themeStore';
import { useAuthStore } from '../../../../stores/authStore';
import { supabase } from '../../../../lib/supabase';
import GlassCard from '../../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../../lib/theme';
import type { Doubt, DoubtReply } from '../../../../types';

export default function DoubtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [doubt, setDoubt] = useState<Doubt | null>(null);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!id) return;
    loadDoubt();
    const sub = supabase
      .channel(`doubt-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'doubt_replies',
        filter: `doubt_id=eq.${id}`,
      }, (payload: any) => {
        setReplies((prev) => [...prev, payload.new as DoubtReply]);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id]);

  async function loadDoubt() {
    setError(null);
    const { data: doubtData, error: doubtErr } = await supabase
      .from('doubts')
      .select('*')
      .eq('id', id)
      .single();
    if (doubtErr) { setError(doubtErr.message); setLoading(false); return; }
    setDoubt(doubtData as Doubt);
    const { data: replyData } = await supabase
      .from('doubt_replies')
      .select('*')
      .eq('doubt_id', id)
      .order('created_at', { ascending: true });
    setReplies(replyData as DoubtReply[] || []);
    setLoading(false);
  }

  async function handleReply() {
    if (!replyText.trim() || !id) return;
    setSending(true);
    try {
      const { error: err } = await supabase.from('doubt_replies').insert({
        doubt_id: id,
        author_id: profile?.id,
        body: replyText.trim(),
      });
      if (err) throw err;
      setReplyText('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post reply');
    } finally {
      setSending(false);
    }
  }

  async function handleUpvote() {
    if (!doubt) return;
    await supabase.from('doubts').update({ upvotes: (doubt.upvotes || 0) + 1 }).eq('id', doubt.id);
    setDoubt({ ...doubt, upvotes: (doubt.upvotes || 0) + 1 });
  }

  async function handleResolve() {
    if (!doubt) return;
    await supabase.from('doubts').update({ is_resolved: true }).eq('id', doubt.id);
    setDoubt({ ...doubt, is_resolved: true });
    Alert.alert('Resolved', 'This doubt has been marked as resolved.');
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: theme.text }]}>Doubt</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error || !doubt) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: theme.text }]}>Doubt</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.danger} />
          <Text style={[typography.body, { color: theme.textMuted, marginTop: 12 }]}>{error || 'Not found'}</Text>
        </View>
      </View>
    );
  }

  const isAuthor = profile?.id === doubt.student_id;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: theme.text }]}>Doubt</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={replies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={replies.length === 0 && !doubt ? styles.emptyContainer : { padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.springify()}>
              <GlassCard style={styles.doubtCard}>
                <View style={styles.doubtHeader}>
                  <View style={[styles.subjectStripe, { backgroundColor: stringToColor(doubt.subject) }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.body, { color: theme.text, fontSize: 16, lineHeight: 24 }]}>
                      {doubt.body}
                    </Text>
                    <View style={styles.tagRow}>
                      <Text style={[styles.subjectTag, { backgroundColor: theme.accent + '20', color: theme.accent }]}>
                        {doubt.subject}
                      </Text>
                      {(doubt.tags || []).slice(0, 4).map((tag: string) => (
                        <Text key={tag} style={[styles.tag, { backgroundColor: theme.glass, color: theme.textMuted }]}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  </View>
                  {doubt.is_resolved && (
                    <View style={[styles.solvedBadge, { backgroundColor: theme.success + '20' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                      <Text style={[typography.caption, { color: theme.success }]}>Solved</Text>
                    </View>
                  )}
                </View>
                <View style={styles.doubtActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleUpvote}>
                    <Ionicons name="arrow-up-outline" size={20} color={theme.textMuted} />
                    <Text style={[typography.body, { color: theme.textMuted, marginLeft: 4 }]}>{doubt.upvotes || 0}</Text>
                  </TouchableOpacity>
                  <View style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color={theme.textMuted} />
                    <Text style={[typography.body, { color: theme.textMuted, marginLeft: 4 }]}>{replies.length} replies</Text>
                  </View>
                  {isAuthor && !doubt.is_resolved && (
                    <TouchableOpacity style={[styles.resolveBtn, { backgroundColor: theme.success + '20' }]} onPress={handleResolve}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={theme.success} />
                      <Text style={[typography.caption, { color: theme.success }]}>Mark Resolved</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          }
          ListEmptyComponent={
            <View style={styles.emptyReplies}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.textMuted} />
              <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>No replies yet. Be the first to answer!</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <GlassCard style={styles.replyCard}>
                <Text style={[typography.body, { color: theme.text }]}>{item.body}</Text>
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 8 }]}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </GlassCard>
            </Animated.View>
          )}
        />

        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.glassBorder }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.text, backgroundColor: theme.glass, borderColor: theme.glassBorder }]}
            placeholder="Write a reply..."
            placeholderTextColor={theme.textMuted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: replyText.trim() ? theme.accent : theme.glass }]}
            onPress={handleReply}
            disabled={!replyText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color={replyText.trim() ? '#fff' : theme.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  doubtCard: { marginBottom: 12 },
  doubtHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  subjectStripe: { width: 4, height: 48, borderRadius: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  subjectTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, fontSize: 11, fontWeight: '600' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 11 },
  solvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  doubtActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 'auto' },
  replyCard: { marginBottom: 8 },
  emptyReplies: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyContainer: { flex: 1 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12,
    borderTopWidth: 1, paddingBottom: 24,
  },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 80, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
