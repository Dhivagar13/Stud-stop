import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/ui/GlassCard';
import { typography, borderRadius } from '../../lib/theme';
import type { Priority } from '../../types';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#6B6B8A' },
  { value: 'medium', label: 'Medium', color: '#AFA9EC' },
  { value: 'high', label: 'High', color: '#FAC775' },
  { value: 'critical', label: 'Critical', color: '#F0997B' },
];

export default function PostAnnouncementScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Validation', 'Body is required');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from('announcements').insert({
        author_id: profile?.id,
        title: title.trim(),
        body: body.trim(),
        priority,
        category: category.trim() || null,
      });
      if (err) throw err;
      Alert.alert('Posted!', 'Announcement has been published.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Post Announcement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <GlassCard style={styles.formCard}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 6 }]}>Title *</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            placeholder="Announcement title"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 6 }]}>Body *</Text>
          <TextInput
            style={[styles.textArea, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            placeholder="Write your announcement..."
            placeholderTextColor={theme.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 6 }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: priority === p.value ? p.color + '30' : theme.glass,
                    borderColor: priority === p.value ? p.color : theme.glassBorder,
                  },
                ]}
                onPress={() => setPriority(p.value)}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[typography.caption, { color: priority === p.value ? p.color : theme.textMuted }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 6 }]}>Category (optional)</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            placeholder="e.g. Exam, Event, General"
            placeholderTextColor={theme.textMuted}
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.accent }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Text style={styles.submitText}>Posting...</Text>
            ) : (
              <>
                <Ionicons name="megaphone" size={18} color="#fff" />
                <Text style={[styles.submitText, { marginLeft: 8 }]}>Post Announcement</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  formCard: { padding: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 120 },
  priorityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
