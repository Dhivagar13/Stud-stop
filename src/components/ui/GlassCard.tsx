import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/themeStore';
import { coloredShadow } from '../../lib/design-tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  level?: 1 | 2 | 3;
  specular?: boolean;
  variant?: 'elevated' | 'outlined' | 'gradient' | 'pressed';
  accentPosition?: 'top' | 'left' | 'none';
  showCorners?: boolean;
  cornerColor?: string;
}

function GlassCard({
  children, style, contentStyle, onPress, level = 2, specular = true,
  variant = 'elevated', accentPosition = 'none', showCorners = false, cornerColor,
}: GlassCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const pressed = useSharedValue(0);
  const accent = cornerColor || theme.accent;

  const radius = level === 1 ? 24 : level === 2 ? 20 : 16;

  const animatedCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  const containerStyle: ViewStyle = {
    borderRadius: radius,
    borderWidth: variant === 'outlined' ? 1.5 : 1,
    borderColor: variant === 'outlined' ? accent + '50' : variant === 'gradient' ? 'transparent' : theme.glassBorder,
    overflow: 'hidden',
    backgroundColor: variant === 'gradient' ? 'transparent' : variant === 'pressed' ? theme.surfaceElevated : theme.cardBg,
    ...coloredShadow(theme.shadowColor, 0.2),
  };

  const innerContent = (
    <>
      {accentPosition === 'top' && <View style={[styles.accentStrip, { backgroundColor: accent }]} />}
      {accentPosition === 'left' && <View style={[styles.accentStripLeft, { backgroundColor: accent }]} />}

      {specular && <View style={[styles.specular, { backgroundColor: theme.glass + '80' }]} />}

      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'transparent']}
        style={styles.innerShadow}
        pointerEvents="none"
      />

      {showCorners && (
        <>
          <View style={[styles.cornerTL, { backgroundColor: accent }]} />
          <View style={[styles.cornerTR, { backgroundColor: accent }]} />
          <View style={[styles.cornerBL, { backgroundColor: accent }]} />
          <View style={[styles.cornerBR, { backgroundColor: accent }]} />
        </>
      )}

      {variant === 'gradient' && (
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => { pressed.value = withSpring(1, { damping: 14, stiffness: 200, mass: 0.5 }); }}
        onPressOut={() => { pressed.value = withSpring(0, { damping: 14, stiffness: 200, mass: 0.5 }); }}
        style={style}
      >
        <Animated.View style={[containerStyle, animatedCardStyle]}>
          {innerContent}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={style}>
      <View style={containerStyle}>
        {innerContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  specular: {
    position: 'absolute',
    top: 4,
    left: '20%',
    width: '60%',
    height: 1,
    borderRadius: 1,
    zIndex: 1,
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 0,
  },
  accentStrip: {
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  accentStripLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 1,
    borderBottomLeftRadius: 1,
    zIndex: 2,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 1,
    zIndex: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 1,
    zIndex: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 1,
    zIndex: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 1,
    zIndex: 2,
  },
});

export default GlassCard;
