import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { GyroParallax } from '../../../components/ui/GyroParallax';
import { PlacementScore } from '../../../components/ui/PlacementScore';
import GlassCard from '../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../lib/theme';

const CATEGORIES = [
  { key: 'technical', icon: 'code-slash', label: 'Technical', color: '#7F77DD', progress: 0.7 },
  { key: 'aptitude', icon: 'calculator', label: 'Aptitude', color: '#1D9E75', progress: 0.5 },
  { key: 'companies', icon: 'business', label: 'Companies', color: '#EF9F27', progress: 0.3 },
  { key: 'mocktests', icon: 'document-text', label: 'Mock Tests', color: '#D85A30', progress: 0.6 },
];

const MOCK_COMPANIES = [
  { id: '1', name: 'Google', roles: ['SDE', 'Data Engineer'], salary_range: '₹20-45 LPA' },
  { id: '2', name: 'Microsoft', roles: ['SDE', 'PM'], salary_range: '₹18-40 LPA' },
  { id: '3', name: 'Amazon', roles: ['SDE', 'Cloud Engineer'], salary_range: '₹16-35 LPA' },
  { id: '4', name: 'Flipkart', roles: ['SDE', 'Data Analyst'], salary_range: '₹12-28 LPA' },
];

export default function PlacementLanding() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('*').limit(10);
    setCompanies((data as any[] || []).length > 0 ? data as any[] : MOCK_COMPANIES);
    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <GyroParallax depth={6}>
          <BlurView intensity={50} tint="dark" style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2, { color: theme.text }]}>Placement Readiness</Text>
                <Text style={[typography.body, { color: theme.textMuted, marginTop: 4 }]}>
                  {profile?.dept} • Sem {profile?.semester}
                </Text>
              </View>
              <PlacementScore score={profile?.placement_score || 0} size={100} />
            </View>
          </BlurView>
        </GyroParallax>

        <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 16, paddingHorizontal: 16 }]}>
          Practice Areas
        </Text>

        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
            onPress={() => {
              if (cat.key === 'companies') router.push('/(tabs)/placement/company/1');
              else if (cat.key === 'mocktests') router.push('/(tabs)/placement/quiz/1');
            }}
          >
            <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
              <Ionicons name={cat.icon as any} size={28} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: theme.text }]}>{cat.label}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${cat.progress * 100}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 16, paddingHorizontal: 16 }]}>
          {loading ? 'Companies' : `${companies.length} Companies`}
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ padding: 20 }} />
        ) : companies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={40} color={theme.textMuted} />
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>No companies listed yet</Text>
          </View>
        ) : (
          companies.map((company, i) => (
            <Animated.View key={company.id} entering={FadeInDown.delay(i * 60).springify()}>
              <TouchableOpacity
                style={[styles.companyCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
                onPress={() => router.push(`/(tabs)/placement/company/${company.id}` as any)}
              >
                <View style={[styles.companyIcon, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="business" size={24} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: theme.text, fontWeight: '600' }]}>{company.name}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {(company.roles || []).slice(0, 2).join(', ')} • {company.salary_range || ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

        <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 16, paddingHorizontal: 16 }]}>
          Recent Quizzes
        </Text>

        {[1, 2].map((i) => (
          <TouchableOpacity
            key={i}
            style={[styles.quizCard, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
            onPress={() => router.push('/(tabs)/placement/quiz/1')}
          >
            <View style={styles.quizInfo}>
              <Text style={[typography.body, { color: theme.text }]}>Data Structures & Algorithms</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>10 questions • 15 min</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.accent + '20' }]}>
              <Text style={[typography.caption, { color: theme.accent }]}>Medium</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: { margin: 16, padding: 20, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
    padding: 16, borderRadius: borderRadius.md, borderWidth: 1, gap: 12,
  },
  categoryIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  progressFill: { height: 4, borderRadius: 2 },
  companyCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    padding: 14, borderRadius: borderRadius.md, borderWidth: 1, gap: 12,
  },
  companyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quizCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: borderRadius.md, borderWidth: 1,
  },
  quizInfo: { flex: 1 },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
});
