import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/themeStore';

interface MorphingBorderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  borderWidth?: number;
  colors?: string[];
  duration?: number;
  animated?: boolean;
}

const DEFAULT_COLORS_LIGHT = ['#8B2F3B', '#C9A84C', '#1A6B5A', '#8B2F3B'];
const DEFAULT_COLORS_DARK = ['#E8A637', '#C9952E', '#2D8A5E', '#E8A637'];

function MorphingBorder({
  children, style, borderRadius = 28, borderWidth = 2,
  colors: explicitColors, duration = 5000, animated = true,
}: MorphingBorderProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme.bg === '#1A1512';
  const colorSet = explicitColors || (isDark ? DEFAULT_COLORS_DARK : DEFAULT_COLORS_LIGHT);

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, [animated, duration]);

  const outerRadius = borderRadius + borderWidth + 4;

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[{ borderRadius: outerRadius, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: outerRadius },
          animatedGradientStyle,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={colorSet}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View
        style={{
          margin: borderWidth,
          borderRadius,
          backgroundColor: theme.cardBg,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default MorphingBorder;
