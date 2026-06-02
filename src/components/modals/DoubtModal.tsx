import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface DoubtModalProps {
  visible: boolean;
  onClose: () => void;
}

const SUBJECTS = ['Mathematics', 'Physics', 'Computer Science', 'Electronics', 'Mechanical', 'Civil'];

export function DoubtModal({ visible, onClose }: DoubtModalProps) {
  const theme = useThemeStore((s) => s.theme);
  const session = useAuthStore((s) => s.session);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const slideUp = useSharedValue(visible ? 0 : 400);

  React.useEffect(() => {
    slideUp.value = withSpring(visible ? 0 : 400, { damping: 20, stiffness: 150 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
  }));

  async function handleSubmit() {
    if (!body.trim() || !subject) return;
    await supabase.from('doubts').insert({
      student_id: session?.user.id,
      subject,
      body,
      tags,
    });
    setBody('');
    setSubject('');
    setTags([]);
    onClose();
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  }

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />
        <Animated.View style={[styles.modal, animatedStyle, { backgroundColor: theme.surface }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.text }]}>Ask a Doubt</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Subject</Text>
            <View style={styles.subjectRow}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: subject === s ? theme.accent : theme.glass,
                      borderColor: theme.glassBorder,
                    },
                  ]}
                  onPress={() => setSubject(s)}
                >
                  <Text style={{ color: subject === s ? '#fff' : theme.text, fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: theme.textMuted }]}>Your Question</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
              placeholder="Describe your doubt..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              value={body}
              onChangeText={setBody}
            />
            <Text style={[styles.label, { color: theme.textMuted }]}>Tags</Text>
            <View style={styles.tagRow}>
              <TextInput
                style={[styles.tagInput, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
                placeholder="Add tag"
                placeholderTextColor={theme.textMuted}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
            </View>
            <View style={styles.tagsContainer}>
              {tags.map((t) => (
                <View key={t} style={[styles.tag, { backgroundColor: theme.accent + '40' }]}>
                  <Text style={{ color: theme.accent }}>{t}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.accent }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>Post Doubt</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  tagRow: { flexDirection: 'row', gap: 8 },
  tagInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 14 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  submitBtn: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
