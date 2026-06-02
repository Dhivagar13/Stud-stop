import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { useOfflineStore } from '../../../stores/offlineStore';
import { supabase } from '../../../lib/supabase';
import { uploadAvatar } from '../../../lib/upload';
import { GyroParallax } from '../../../components/ui/GyroParallax';
import { PlacementScore } from '../../../components/ui/PlacementScore';
import { SkillBadge } from '../../../components/ui/SkillBadge';
import GlassCard from '../../../components/ui/GlassCard';
import { typography, borderRadius } from '../../../lib/theme';

export default function ProfileScreen() {
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { profile, signOut, refreshProfile } = useAuthStore();
  const lastSynced = useOfflineStore((s) => s.lastSynced);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleChangePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setUploadingAvatar(true);
      try {
        const url = await uploadAvatar(profile!.id, result.assets[0].uri);
        if (url) {
          await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile!.id);
          await refreshProfile();
          Alert.alert('Success', 'Profile photo updated');
        }
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to upload photo');
      } finally {
        setUploadingAvatar(false);
      }
    }
  }

  const menuItems = [
    { icon: 'star-outline', label: 'My Skills', route: '/(tabs)/profile/skills' },
    { icon: 'bar-chart-outline', label: 'Grades', route: '/(tabs)/profile/grades' },
    { icon: 'download-outline', label: 'Downloads', route: '' },
    { icon: 'settings-outline', label: 'Settings', route: '' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <GyroParallax depth={8}>
          <BlurView intensity={50} tint="dark" style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingAvatar}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={[styles.avatar, { borderColor: theme.accent }]} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.accent, shadowColor: theme.accent }]}>
                    <Text style={[typography.h1, { color: '#fff' }]}>
                      {profile?.name?.charAt(0) || 'S'}
                    </Text>
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[typography.h2, { color: theme.text }]}>{profile?.name || 'Student'}</Text>
                <Text style={[typography.body, { color: theme.textMuted }]}>
                  {profile?.dept} • Sem {profile?.semester}
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  {profile?.roll_no}
                </Text>
              </View>
              <PlacementScore score={profile?.placement_score || 0} size={80} />
            </View>
          </BlurView>
        </GyroParallax>

        <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 12, paddingHorizontal: 16 }]}>
          Skills
        </Text>
        <View style={styles.skillsRow}>
          {profile?.skills && Object.entries(profile.skills).slice(0, 6).map(([name, level]) => (
            <SkillBadge key={name} name={name} level={level as any} />
          ))}
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile/skills')}>
            <View style={[styles.addSkillBtn, { borderColor: theme.accent }]}>
              <Text style={[typography.caption, { color: theme.accent }]}>+ Add</Text>
            </View>
          </TouchableOpacity>
        </View>

        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder }]}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <Ionicons name={item.icon as any} size={22} color={theme.accent} />
            <Text style={[typography.body, { color: theme.text, flex: 1, marginLeft: 12 }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ))}

        <GlassCard style={styles.syncCard}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            Last synced: {lastSynced ? `${Math.floor((Date.now() - lastSynced.getTime()) / 60000)} min ago` : 'Never'}
          </Text>
        </GlassCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={[typography.body, { color: theme.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { margin: 16, padding: 20, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', boxShadow: '0 4 8 rgba(0,0,0,0.3)', elevation: 8, borderWidth: 2 },
  avatarOverlay: { position: 'absolute', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  addSkillBtn: { borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: borderRadius.md, borderWidth: 1 },
  syncCard: { margin: 16, padding: 12, alignItems: 'center' },
  logoutBtn: { alignItems: 'center', padding: 16, marginTop: 8 },
});
