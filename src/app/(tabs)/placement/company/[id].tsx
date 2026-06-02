import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../../../stores/themeStore';
import { supabase } from '../../../../lib/supabase';
import { GyroParallax } from '../../../../components/ui/GyroParallax';
import GlassCard from '../../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../../lib/theme';

const MOCK_COMPANIES: Record<string, any> = {
  '1': {
    name: 'Google',
    roles: ['SDE', 'Data Engineer', 'PM'],
    salary_range: '₹20-45 LPA',
    about: 'Google is a multinational technology company specializing in Internet-related services and products.',
    hiring_process: ['Online Assessment', 'Technical Phone Screen', 'On-site Interviews (4 rounds)', 'Hiring Committee'],
    past_questions: ['Design a distributed cache', 'Implement LRU cache', 'System design: Google Docs'],
    culture: 'Innovation-first, collaborative, 20% time policy',
  },
  '2': {
    name: 'Microsoft',
    roles: ['SDE', 'PM', 'Data Scientist'],
    salary_range: '₹18-40 LPA',
    about: 'Microsoft is a leading technology company that develops software, services, and hardware.',
    hiring_process: ['Online Coding Test', 'Technical Interviews', 'System Design', 'Hiring Manager Round'],
    past_questions: ['Design a URL shortener', 'Implement a thread-safe singleton', 'Design distributed file system'],
    culture: 'Growth mindset, collaborative, work-life balance',
  },
  '3': {
    name: 'Amazon',
    roles: ['SDE', 'Cloud Engineer', 'Data Analyst'],
    salary_range: '₹16-35 LPA',
    about: 'Amazon is a multinational technology company focused on e-commerce, cloud computing, and AI.',
    hiring_process: ['Online Assessment', 'Technical Phone Screen', '4-5 On-site Rounds', 'Bar Raiser Round'],
    past_questions: ['Design a scalable e-commerce cart', 'LRU cache implementation', 'Design a load balancer'],
    culture: 'Customer-obsessed, ownership, high standards',
  },
  '4': {
    name: 'Flipkart',
    roles: ['SDE', 'Data Analyst'],
    salary_range: '₹12-28 LPA',
    about: 'Flipkart is an Indian e-commerce company, headquartered in Bangalore.',
    hiring_process: ['Coding Test', 'Technical Round 1', 'Technical Round 2', 'HR Round'],
    past_questions: ['Design a recommendation system', 'Implement a search autocomplete', 'Design a shopping cart'],
    culture: 'Fast-paced, innovative, customer-first',
  },
};

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompany();
  }, [id]);

  async function loadCompany() {
    setError(null);
    const { data, error: err } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setCompany(data);
    } else {
      const mock = MOCK_COMPANIES[id || ''];
      if (mock) {
        setCompany(mock);
      } else {
        setError('Company not found');
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.accent} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error || !company) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="business-outline" size={48} color={theme.danger} />
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 12 }]}>{error || 'Not found'}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accent }]} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <GyroParallax depth={6}>
          <BlurView intensity={50} tint="dark" style={styles.heroCard}>
            <View style={styles.logoRow}>
              <View style={[styles.logo, { backgroundColor: theme.glass }]}>
                <Ionicons name="business" size={40} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h1, { color: theme.text }]}>{company.name}</Text>
                {company.salary_range && (
                  <View style={styles.salaryPill}>
                    <Text style={[typography.caption, { color: theme.success }]}>{company.salary_range}</Text>
                  </View>
                )}
              </View>
            </View>
            {(company.roles || []).length > 0 && (
              <View style={styles.roleRow}>
                {(company.roles || []).map((role: string) => (
                  <View key={role} style={[styles.roleTag, { backgroundColor: theme.accent + '20' }]}>
                    <Text style={[typography.caption, { color: theme.accent }]}>{role}</Text>
                  </View>
                ))}
              </View>
            )}
          </BlurView>
        </GyroParallax>

        {company.about && (
          <GlassCard style={styles.section}>
            <Text style={[typography.h3, { color: theme.text }]}>About</Text>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>{company.about}</Text>
          </GlassCard>
        )}

        {(company.hiring_process || []).length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={[typography.h3, { color: theme.text }]}>Hiring Process</Text>
            {(company.hiring_process || []).map((step: string, i: number) => (
              <View key={i} style={styles.processStep}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={[typography.caption, { color: theme.accent }]}>{i + 1}</Text>
                </View>
                <Text style={[typography.body, { color: theme.textMuted, flex: 1 }]}>{step}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {(company.past_questions || []).length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={[typography.h3, { color: theme.text }]}>Past Questions</Text>
            {(company.past_questions || []).map((q: string, i: number) => (
              <View key={i} style={styles.questionItem}>
                <Ionicons name="code-slash-outline" size={16} color={theme.accent} />
                <Text style={[typography.body, { color: theme.textMuted, marginLeft: 8, flex: 1 }]}>{q}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {company.culture && (
          <GlassCard style={styles.section}>
            <Text style={[typography.h3, { color: theme.text }]}>Culture</Text>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>{company.culture}</Text>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  heroCard: { margin: 16, padding: 20, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  logoRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  logo: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  salaryPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(29,158,117,0.2)', alignSelf: 'flex-start', marginTop: 6 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  roleTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  section: { marginHorizontal: 16, marginBottom: 10, padding: 16 },
  processStep: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  questionItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
});
