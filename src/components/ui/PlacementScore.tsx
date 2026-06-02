import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/themeStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const radius = 50;
const circumference = 2 * Math.PI * radius;

interface PlacementScoreProps {
  score: number;
  size?: number;
}

export function PlacementScore({ score, size = 120 }: PlacementScoreProps) {
  const theme = useThemeStore((s) => s.theme);
  const strokeOffset = useSharedValue(circumference);

  const strokeColor = score <= 40 ? theme.danger : score <= 70 ? theme.warning : theme.success;

  useEffect(() => {
    strokeOffset.value = withTiming(circumference - (score / 100) * circumference, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeOffset.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle
          cx="60"
          cy="60"
          r={radius}
          stroke={theme.glassBorder}
          strokeWidth="8"
          fill="none"
        />
        <AnimatedCircle
          cx="60"
          cy="60"
          r={radius}
          stroke={strokeColor}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.score, { color: theme.text }]}>{score}</Text>
        <Text style={[styles.label, { color: theme.textMuted }]}>Readiness</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  labelContainer: { position: 'absolute', alignItems: 'center' },
  score: { fontSize: 28, fontWeight: '600' },
  label: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
});
