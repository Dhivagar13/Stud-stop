import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { uploadAvatar } from '../../lib/upload';
import { typography, borderRadius } from '../../lib/theme';
import * as ImagePicker from 'expo-image-picker';

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const theme = useThemeStore((s) => s.theme);
  const signUpWithIdentifier = useAuthStore((s) => s.signUpWithIdentifier);

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState(1);
  const [dept, setDept] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  }

  function nextStep() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  async function completeOnboarding() {
    if (!email || !password || !name || !dept) {
      Alert.alert('Missing fields', 'Email, password, name, and department are required');
      return;
    }
    setLoading(true);
    try {
      await signUpWithIdentifier({ email, password, name, dept, semester, identifier: rollNo, role: 'student' });
      const session = useAuthStore.getState().session;
      if (avatar && session) {
        const url = await uploadAvatar(session.user.id, avatar);
        if (url) await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  function renderAccountStep() {
    return (
      <>
        <Text style={[typography.h2, { color: theme.text }]}>Create Account</Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>Enter email and password</Text>
        <TextInput style={[st.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Email" placeholderTextColor={theme.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={[st.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Password (min 6 chars)" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
      </>
    );
  }

  function renderProfileStep() {
    return (
      <>
        <Text style={[typography.h2, { color: theme.text }]}>About You</Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>Fill in your details</Text>
        <TextInput style={[st.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Full Name" placeholderTextColor={theme.textMuted} value={name} onChangeText={setName} />
        <TextInput style={[st.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Department" placeholderTextColor={theme.textMuted} value={dept} onChangeText={setDept} />
        <TextInput style={[st.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Roll Number" placeholderTextColor={theme.textMuted} value={rollNo} onChangeText={setRollNo} autoCapitalize="none" />
        <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 8 }]}>Semester</Text>
        <View style={st.pillRow}>
          {[1,2,3,4,5,6,7,8].map((s) => (
            <TouchableOpacity key={s} style={[st.pill, { backgroundColor: semester === s ? theme.accent : theme.glass }]} onPress={() => setSemester(s)}>
              <Text style={{ color: semester === s ? '#fff' : theme.text }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  }

  function renderAvatarStep() {
    return (
      <>
        <Text style={[typography.h2, { color: theme.text }]}>Avatar</Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>Add a profile picture</Text>
        <TouchableOpacity style={[st.avatarBox, { borderColor: theme.accent }]} onPress={pickAvatar}>
          {avatar ? (
            <View style={st.avatarInner}>
              <Text style={[typography.caption, { color: theme.accent }]}>Change photo</Text>
            </View>
          ) : (
            <Text style={[typography.body, { color: theme.accent }]}>Tap to select</Text>
          )}
        </TouchableOpacity>
      </>
    );
  }

  function renderSkillsStep() {
    return (
      <>
        <Text style={[typography.h2, { color: theme.text }]}>Skills</Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>What are you good at?</Text>
        <View style={st.skillRow}>
          <TextInput style={[st.input, { flex: 1, color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="e.g. React Native" placeholderTextColor={theme.textMuted} value={skillInput} onChangeText={setSkillInput} onSubmitEditing={addSkill} />
          <TouchableOpacity style={[st.addBtn, { backgroundColor: theme.accent }]} onPress={addSkill}><Text style={{color:'#fff',fontSize:20}}>+</Text></TouchableOpacity>
        </View>
        <View style={st.badgeRow}>
          {skills.map((sk) => (
            <View key={sk} style={[st.badge, { backgroundColor: theme.accent + '30' }]}><Text style={{color:theme.accent}}>{sk}</Text></View>
          ))}
        </View>
      </>
    );
  }

  const steps = [renderAccountStep, renderProfileStep, renderAvatarStep, renderSkillsStep];

  return (
    <LinearGradient colors={[theme.accent, theme.bg]} style={st.container}>
      <BlurView intensity={30} tint="dark" style={st.card}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {steps[step]()}
        </ScrollView>
        <View style={st.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[st.dot, { backgroundColor: i <= step ? theme.accent : theme.glassBorder }]} />
          ))}
        </View>
        <View style={st.btns}>
          {step > 0 ? (
            <TouchableOpacity onPress={prevStep}>
              <Text style={[typography.body, { color: theme.textMuted }]}>Back</Text>
            </TouchableOpacity>
          ) : <View />}
          <TouchableOpacity style={[st.nextBtn, { backgroundColor: theme.accent }]} disabled={loading} onPress={step < TOTAL_STEPS - 1 ? nextStep : completeOnboarding}>
            <Text style={st.nextText}>{step === TOTAL_STEPS - 1 ? (loading ? 'Creating...' : 'Create Account') : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: borderRadius.xl, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', maxHeight: '85%' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, marginTop: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 40, alignItems: 'center' },
  avatarBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 60, width: 120, height: 120, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 },
  avatarInner: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  skillRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 12 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  nextBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
