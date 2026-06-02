import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { uploadFile } from '../../../lib/upload';
import { supabase } from '../../../lib/supabase';
import GlassCard from '../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../lib/theme';

const SUBJECTS = ['Mathematics', 'Physics', 'Computer Science', 'Electronics', 'Mechanical', 'Civil'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function UploadNotesScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState(1);
  const [file, setFile] = useState<{ uri: string; name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setFile({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        size: result.assets[0].size || 0,
      });
    }
  }

  async function handleUpload() {
    if (!title.trim()) { Alert.alert('Validation', 'Title is required'); return; }
    if (!subject) { Alert.alert('Validation', 'Please select a subject'); return; }
    if (!file) { Alert.alert('Validation', 'Please pick a PDF file'); return; }

    setUploading(true);
    try {
      const filePath = `${profile?.id}/${Date.now()}_${file.name}`;
      const fileUrl = await uploadFile('notes-files', filePath, file.uri);
      if (!fileUrl) throw new Error('Upload failed');

      const { error: err } = await supabase.from('notes').insert({
        title: title.trim(),
        subject,
        semester,
        topic: subject,
        uploader_id: profile?.id,
        file_url: fileUrl,
        file_size: file.size,
        is_approved: false,
      });
      if (err) throw err;

      Alert.alert('Uploaded!', 'Your note has been submitted for approval.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Upload Notes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.springify()}>
          <GlassCard style={styles.formCard}>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 6 }]}>Title *</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
              placeholder="Note title"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 6 }]}>Subject *</Text>
            <View style={styles.subjectRow}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, { backgroundColor: subject === s ? theme.accent : theme.glass, borderColor: theme.glassBorder }]}
                  onPress={() => setSubject(s)}
                >
                  <Text style={{ color: subject === s ? '#fff' : theme.text, fontSize: 12 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 6 }]}>Semester</Text>
            <View style={styles.semesterRow}>
              {SEMESTERS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.semChip, { backgroundColor: semester === s ? theme.accent : theme.glass }]}
                  onPress={() => setSemester(s)}
                >
                  <Text style={{ color: semester === s ? '#fff' : theme.text, fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 6 }]}>File *</Text>
            <TouchableOpacity style={[styles.filePicker, { borderColor: file ? theme.accent : theme.glassBorder, backgroundColor: theme.glass }]} onPress={pickFile}>
              <Ionicons name="document-attach-outline" size={28} color={file ? theme.accent : theme.textMuted} />
              <Text style={[typography.body, { color: file ? theme.accent : theme.textMuted, marginTop: 8 }]}>
                {file ? file.name : 'Tap to select PDF'}
              </Text>
              {file && (
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.accent }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={[styles.submitText, { marginLeft: 8 }]}>Upload for Approval</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  formCard: { padding: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  semesterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  semChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 36, alignItems: 'center' },
  filePicker: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
