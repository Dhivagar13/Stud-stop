import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/themeStore';

type DecorationShape = 'circle' | 'diamond' | 'line' | 'cornerAccent';
type DecorationSize = 'sm' | 'md' | 'lg';

interface AccentDecorationProps {
  style?: StyleProp<ViewStyle>;
  shape?: DecorationShape;
  size?: DecorationSize;
  color?: string;
  colors?: readonly [string, string];
  position?: { top?: number; left?: number; right?: number; bottom?: number };
  floating?: boolean;
  delay?: number;
  rotation?: number;
}

const SIZE_MAP: Record<DecorationSize, number> = {
  sm: 8,
  md: 16,
  lg: 32,
};

function Diamond({ size, color }: { size: number; color: string }) {
  return (
    <View
      style={[
        styles.diamond,
        {
          width: size,
          height: size,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        },
      ]}
    />
  );
}

function CornerAccent({ size, color }: { size: number; color: string }) {
  return (
    <View style={{ width: size * 2, height: size * 2 }}>
      <View style={[styles.cornerLine, { width: size * 2, height: 2, backgroundColor: color, position: 'absolute', top: 0, left: 0 }]} />
      <View style={[styles.cornerLine, { width: 2, height: size * 2, backgroundColor: color, position: 'absolute', top: 0, left: 0 }]} />
    </View>
  );
}

function GradientLine({ size, colors }: { size: number; colors: readonly [string, string] }) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ width: size * 3, height: 3, borderRadius: 1.5 }}
    />
  );
}

function AccentDecoration({
  style,
  shape = 'circle',
  size = 'md',
  color: explicitColor,
  colors: explicitColors,
  position,
  floating = false,
  delay = 0,
  rotation = 0,
}: AccentDecorationProps) {
  const theme = useThemeStore((s) => s.theme);
  const color = explicitColor || theme.accent + '60';
  const gradientColors = explicitColors || [theme.accent + '80', theme.accentSecondary + '60'] as const;
  const s = SIZE_MAP[size];

  const floatAnim = useSharedValue(0);
  const rotateAnim = useSharedValue(rotation);

  useEffect(() => {
    if (floating) {
      floatAnim.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        ),
      );
    }
  }, [floating, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = floating ? interpolate(floatAnim.value, [0, 1], [0, -8]) : 0;
    return {
      transform: [
        { translateY },
        { rotate: `${rotateAnim.value}deg` },
      ],
    };
  });

  const renderShape = () => {
    switch (shape) {
      case 'circle':
        return <View style={[styles.circle, { width: s, height: s, borderRadius: s / 2, backgroundColor: color }]} />;
      case 'diamond':
        return <Diamond size={s} color={color} />;
      case 'line':
        return <GradientLine size={s} colors={gradientColors} />;
      case 'cornerAccent':
        return <CornerAccent size={s} color={color} />;
      default:
        return null;
    }
  };

  const positionStyle: ViewStyle = position ? {
    position: 'absolute',
    ...position,
  } : {};

  return (
    <Animated.View
      style={[positionStyle, animatedStyle, style]}
      pointerEvents="none"
    >
      {renderShape()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: { opacity: 0.6 },
  diamond: { opacity: 0.5 },
  cornerLine: { borderRadius: 1 },
});

export default AccentDecoration;
