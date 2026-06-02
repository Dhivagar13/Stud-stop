import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import GlassCard from '../../../components/ui/GlassCard';
import { GradeChart } from '../../../components/ui/GradeChart';
import { typography, borderRadius } from '../../../lib/theme';
import type { CAMark } from '../../../types';

interface SubjectMarks {
  subject: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  exams: CAMark[];
}

interface SemesterData {
  semester: number;
  subjects: SubjectMarks[];
  sgpa: number;
}

export default function GradesScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [marks, setMarks] = useState<CAMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSem, setExpandedSem] = useState<number | null>(null);

  useEffect(() => {
    loadMarks();
  }, []);

  async function loadMarks() {
    setError(null);
    const { data, error: err } = await supabase
      .from('ca_marks')
      .select('*')
      .eq('student_id', profile?.id)
      .order('semester', { ascending: true })
      .order('subject', { ascending: true });
    if (err) { setError(err.message); } else { setMarks(data as CAMark[] || []); }
    setLoading(false);
  }

  const groupedBySemester: SemesterData[] = React.useMemo(() => {
    const semMap = new Map<number, Map<string, CAMark[]>>();
    marks.forEach((m) => {
      if (!semMap.has(m.semester)) semMap.set(m.semester, new Map());
      const subMap = semMap.get(m.semester)!;
      if (!subMap.has(m.subject)) subMap.set(m.subject, []);
      subMap.get(m.subject)!.push(m);
    });
    const result: SemesterData[] = [];
    semMap.forEach((subMap, semester) => {
      const subjects: SubjectMarks[] = [];
      let totalAll = 0;
      let maxAll = 0;
      subMap.forEach((exams, subject) => {
        const totalObtained = exams.reduce((s, e) => s + Number(e.marks_obtained), 0);
        const totalMax = exams.reduce((s, e) => s + Number(e.max_marks), 0);
        subjects.push({ subject, totalObtained, totalMax, percentage: (totalObtained / totalMax) * 100, exams });
        totalAll += totalObtained;
        maxAll += totalMax;
      });
      result.push({ semester, subjects, sgpa: maxAll > 0 ? (totalAll / maxAll) * 10 : 0 });
    });
    return result.sort((a, b) => a.semester - b.semester);
  }, [marks]);

  const chartData = groupedBySemester.map((s) => ({ semester: s.semester, gpa: Math.round(s.sgpa * 10) / 10 }));
  const cgpa = chartData.length > 0 ? chartData.reduce((s, d) => s + d.gpa, 0) / chartData.length : 0;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: theme.text }]}>Grades</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: theme.text }]}>Grades</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.danger} />
          <Text style={[typography.body, { color: theme.textMuted, marginTop: 12 }]}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Grades</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[typography.h1, { color: theme.accent }]}>{cgpa.toFixed(2)}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>CGPA</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[typography.h1, { color: theme.accentSecondary }]}>{marks.length}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Exams</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[typography.h1, { color: theme.warning }]}>{groupedBySemester.length}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Semesters</Text>
            </View>
          </View>
        </GlassCard>

        {chartData.length > 0 && (
          <GlassCard style={styles.chartCard}>
            <GradeChart data={chartData} />
          </GlassCard>
        )}

        {groupedBySemester.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.h3, { color: theme.text, marginTop: 12 }]}>No grades yet</Text>
            <Text style={[typography.body, { color: theme.textMuted }]}>CA marks will appear here once uploaded.</Text>
          </View>
        ) : (
          groupedBySemester.map((sem, si) => (
            <Animated.View key={sem.semester} entering={FadeInDown.delay(si * 100).springify()}>
              <TouchableOpacity
                style={[styles.semHeader, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
                onPress={() => setExpandedSem(expandedSem === sem.semester ? null : sem.semester)}
              >
                <View style={styles.semHeaderLeft}>
                  <View style={[styles.semBadge, { backgroundColor: theme.accent + '20' }]}>
                    <Text style={[typography.h3, { color: theme.accent }]}>{sem.semester}</Text>
                  </View>
                  <View>
                    <Text style={[typography.h3, { color: theme.text }]}>Semester {sem.semester}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>{sem.subjects.length} subjects</Text>
                  </View>
                </View>
                <View style={styles.semHeaderRight}>
                  <Text style={[typography.h3, { color: theme.accentSecondary }]}>{sem.sgpa.toFixed(2)}</Text>
                  <Ionicons name={expandedSem === sem.semester ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                </View>
              </TouchableOpacity>

              {expandedSem === sem.semester && sem.subjects.map((sub, i) => (
                <Animated.View key={sub.subject} entering={FadeInDown.delay(i * 50).springify()}>
                  <GlassCard style={styles.subjectCard}>
                    <View style={styles.subjectHeader}>
                      <Text style={[typography.body, { color: theme.text, fontWeight: '600' }]}>{sub.subject}</Text>
                      <Text style={[typography.body, { color: getGradeColor(sub.percentage, theme) }]}>
                        {sub.totalObtained}/{sub.totalMax}
                      </Text>
                    </View>
                    <View style={styles.progressBarOuter}>
                      <View style={[styles.progressBarInner, { width: `${Math.min(sub.percentage, 100)}%`, backgroundColor: getGradeColor(sub.percentage, theme) }]} />
                    </View>
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                      {sub.percentage.toFixed(1)}% • {sub.exams.length} exam{sub.exams.length > 1 ? 's' : ''}
                    </Text>
                    <View style={styles.examRow}>
                      {sub.exams.map((e) => (
                        <View key={e.id} style={[styles.examChip, { backgroundColor: theme.glass }]}>
                          <Text style={[typography.caption, { color: theme.text }]}>
                            CA{e.ca_number}: {Number(e.marks_obtained).toFixed(0)}/{Number(e.max_marks).toFixed(0)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </Animated.View>
              ))}
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getGradeColor(percentage: number, theme: any): string {
  if (percentage >= 85) return '#5DCAA5';
  if (percentage >= 70) return '#AFA9EC';
  if (percentage >= 50) return '#FAC775';
  return '#F0997B';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  summaryCard: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  chartCard: { marginBottom: 16 },
  semHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: 8,
  },
  semHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  semHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  semBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectCard: { marginBottom: 8 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBarOuter: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  progressBarInner: { height: 6, borderRadius: 3 },
  examRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  examChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
});
