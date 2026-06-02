import React from 'react';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useGyro } from '../../lib/sensors';

interface GyroParallaxProps {
  children: React.ReactNode;
  depth?: number;
}

export function GyroParallax({ children, depth = 8 }: GyroParallaxProps) {
  const { rotX, rotY } = useGyro();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(rotY.value, [-10, 10], [-depth, depth]) },
      { translateY: interpolate(rotX.value, [-10, 10], [-depth, depth]) },
      { rotateX: `${interpolate(rotX.value, [-10, 10], [-3, 3])}deg` },
      { rotateY: `${interpolate(rotY.value, [-10, 10], [-3, 3])}deg` },
    ],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
