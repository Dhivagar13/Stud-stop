import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Dimensions, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { uploadAvatar } from '../../lib/upload';
import { typography, borderRadius } from '../../lib/theme';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const steps = [
  { key: 'account', title: 'Account Details' },
  { key: 'profile', title: 'Profile Info' },
  { key: 'avatar', title: 'Upload Avatar' },
  { key: 'skills', title: 'Add Skills' },
];

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
  const flatRef = useRef<FlatList>(null);

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

  const renderStep = ({ item }: { item: typeof steps[0] }) => {
    switch (item.key) {
      case 'account':
        return (
          <View style={s.step}>
            <Text style={[typography.h2, { color: theme.text }]}>Create Account</Text>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>Enter email and password</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Email" placeholderTextColor={theme.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Password (min 6 chars)" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
          </View>
        );
      case 'profile':
        return (
          <View style={s.step}>
            <Text style={[typography.h2, { color: theme.text }]}>About You</Text>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>Fill in your details</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Full Name" placeholderTextColor={theme.textMuted} value={name} onChangeText={setName} />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Department" placeholderTextColor={theme.textMuted} value={dept} onChangeText={setDept} />
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="Roll Number" placeholderTextColor={theme.textMuted} value={rollNo} onChangeText={setRollNo} autoCapitalize="none" />
            <Text style={[typography.label, { color: theme.textMuted, marginTop: 16, marginBottom: 8 }]}>Semester</Text>
            <View style={s.pillRow}>
              {[1,2,3,4,5,6,7,8].map((s) => (
                <TouchableOpacity key={s} style={[s.pill, { backgroundColor: semester === s ? theme.accent : theme.glass }]} onPress={() => setSemester(s)}>
                  <Text style={{ color: semester === s ? '#fff' : theme.text }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'avatar':
        return (
          <View style={s.step}>
            <Text style={[typography.h2, { color: theme.text }]}>Avatar</Text>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>Add a profile picture</Text>
            <TouchableOpacity style={[s.avatarBox, { borderColor: theme.accent }]} onPress={pickAvatar}>
              {avatar ? <Text style={[typography.body, { color: theme.accent }]}>Change photo</Text> : <Text style={[typography.body, { color: theme.accent }]}>Tap to select</Text>}
            </TouchableOpacity>
          </View>
        );
      case 'skills':
        return (
          <View style={s.step}>
            <Text style={[typography.h2, { color: theme.text }]}>Skills</Text>
            <Text style={[typography.body, { color: theme.textMuted, marginTop: 8 }]}>What are you good at?</Text>
            <View style={s.skillRow}>
              <TextInput style={[s.input, { flex: 1, color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]} placeholder="e.g. React Native" placeholderTextColor={theme.textMuted} value={skillInput} onChangeText={setSkillInput} onSubmitEditing={addSkill} />
              <TouchableOpacity style={[s.addBtn, { backgroundColor: theme.accent }]} onPress={addSkill}><Text style={{color:'#fff',fontSize:20}}>+</Text></TouchableOpacity>
            </View>
            <View style={s.badgeRow}>
              {skills.map((sk) => (
                <View key={sk} style={[s.badge, { backgroundColor: theme.accent + '30' }]}><Text style={{color:theme.accent}}>{sk}</Text></View>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={[theme.accent, theme.bg]} style={s.container}>
      <BlurView intensity={30} tint="dark" style={s.card}>
        <FlatList ref={flatRef} data={steps} renderItem={renderStep} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={false} keyExtractor={(item) => item.key} />
        <View style={s.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[s.dot, { backgroundColor: i <= step ? theme.accent : theme.glassBorder }]} />
          ))}
        </View>
        <View style={s.btns}>
          {step > 0 && <TouchableOpacity onPress={() => { setStep(step - 1); flatRef.current?.scrollToIndex({ index: step - 1 }); }}><Text style={[typography.body, { color: theme.textMuted }]}>Back</Text></TouchableOpacity>}
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: theme.accent }]} disabled={loading} onPress={() => {
            if (step < 3) { setStep(step + 1); flatRef.current?.scrollToIndex({ index: step + 1 }); }
            else completeOnboarding();
          }}>
            <Text style={s.nextText}>{step === 3 ? (loading ? 'Creating...' : 'Create Account') : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: borderRadius.xl, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  step: { width: width - 72, paddingVertical: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, marginTop: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 40, alignItems: 'center' },
  avatarBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 60, width: 120, height: 120, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 },
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
