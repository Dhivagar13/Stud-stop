import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { GyroParallax } from '../../components/ui/GyroParallax';
import { typography, borderRadius } from '../../lib/theme';

const { width } = Dimensions.get('window');

type LoginMode = 'otp' | 'idpassword';
type Role = 'student' | 'staff';

function Particle({ x, delay, size }: { x: number; delay: number; size: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] }),
        transform: [{ translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, Dimensions.get('window').height + 20],
        }) }],
      }}
    />
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    delay: Math.random() * 3000,
    size: 4 + Math.random() * 8,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} delay={p.delay} size={p.size} />
      ))}
    </View>
  );
}

function TabSelector({ mode, setMode }: { mode: LoginMode; setMode: (m: LoginMode) => void }) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <View style={[styles.tabRow, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
      <TouchableOpacity
        style={[styles.tab, mode === 'otp' && { backgroundColor: theme.accent }]}
        onPress={() => setMode('otp')}
      >
        <Text style={[styles.tabText, { color: mode === 'otp' ? '#fff' : theme.textMuted }]}>Email OTP</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, mode === 'idpassword' && { backgroundColor: theme.accent }]}
        onPress={() => setMode('idpassword')}
      >
        <Text style={[styles.tabText, { color: mode === 'idpassword' ? '#fff' : theme.textMuted }]}>ID Login</Text>
      </TouchableOpacity>
    </View>
  );
}

function OTPStep({ email, setEmail, otp, setOtp, step, setStep, loading, sendOTP, verifyOTP, theme }: any) {
  return (
    <>
      {step === 'email' ? (
        <>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            placeholder="college@email.com"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email input"
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accent }]}
            onPress={sendOTP}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center', marginBottom: 16 }]}>
            Enter the OTP sent to {email}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
            placeholder="000000"
            placeholderTextColor={theme.textMuted}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel="OTP input"
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accent }]}
            onPress={verifyOTP}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('email')}>
            <Text style={[typography.caption, { color: theme.accent, textAlign: 'center', marginTop: 12 }]}>
              Change email
            </Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );
}

function IDPasswordStep({ identifier, setIdentifier, password, setPassword, role, setRole, loading, handleIDLogin, theme }: any) {
  return (
    <>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.rolePill, { backgroundColor: role === 'student' ? theme.accent : theme.glass }]}
          onPress={() => setRole('student')}
        >
          <Text style={{ color: role === 'student' ? '#fff' : theme.text, fontWeight: '500' }}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rolePill, { backgroundColor: role === 'staff' ? theme.accent : theme.glass }]}
          onPress={() => setRole('staff')}
        >
          <Text style={{ color: role === 'staff' ? '#fff' : theme.text, fontWeight: '500' }}>Staff</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
        placeholder={role === 'student' ? 'Roll Number' : 'Staff ID'}
        placeholderTextColor={theme.textMuted}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        accessibilityLabel="Identifier input"
      />
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.glass }]}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password input"
      />
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme.accent }]}
        onPress={handleIDLogin}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>
    </>
  );
}

export default function LoginScreen() {
  const theme = useThemeStore((s) => s.theme);
  const signInWithIdentifier = useAuthStore((s) => s.signInWithIdentifier);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('otp');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');

  async function sendOTP() {
    if (!email.includes('@')) { Alert.alert('Error', 'Enter a valid college email'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    if (otp.length < 6) { Alert.alert('Error', 'Enter the OTP sent to your email'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', session?.user.id).single();
      if (profile) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleIDLogin() {
    if (!identifier) { Alert.alert('Error', 'Enter your roll number or staff ID'); return; }
    if (!password) { Alert.alert('Error', 'Enter your password'); return; }
    setLoading(true);
    try {
      await signInWithIdentifier(identifier, password, role);
      const profile = useAuthStore.getState().profile;
      if (profile?.role === 'faculty' || profile?.role === 'admin') {
        router.replace('/(staff)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[theme.accent, theme.bg]} style={styles.container} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      <FloatingParticles />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <GyroParallax depth={12}>
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <Text style={[typography.hero, { color: theme.text, textAlign: 'center' }]}>Stud-Stop</Text>
            <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center', marginTop: 8 }]}>
              Department College App
            </Text>

            <TabSelector mode={mode} setMode={setMode} />

            {mode === 'otp' ? (
              <OTPStep
                email={email} setEmail={setEmail}
                otp={otp} setOtp={setOtp}
                step={step} setStep={setStep}
                loading={loading}
                sendOTP={sendOTP}
                verifyOTP={verifyOTP}
                theme={theme}
              />
            ) : (
              <IDPasswordStep
                identifier={identifier} setIdentifier={setIdentifier}
                password={password} setPassword={setPassword}
                role={role} setRole={setRole}
                loading={loading}
                handleIDLogin={handleIDLogin}
                theme={theme}
              />
            )}

            {mode === 'idpassword' && (
              <TouchableOpacity onPress={() => router.replace('/(auth)/onboarding')}>
                <Text style={[typography.caption, { color: theme.accent, textAlign: 'center', marginTop: 12 }]}>
                  Don't have an account? Sign up
                </Text>
              </TouchableOpacity>
            )}
          </BlurView>
        </GyroParallax>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    borderRadius: borderRadius.xl,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginTop: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16, marginTop: 12 },
  btn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
