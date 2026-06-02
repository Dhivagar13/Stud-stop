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

const DEFAULT_COLORS_LIGHT = ['#D4744A', '#E8C9A0', '#B88B6A', '#D4744A'];
const DEFAULT_COLORS_DARK = ['#E8926A', '#D4A870', '#B88B6A', '#E8926A'];

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
