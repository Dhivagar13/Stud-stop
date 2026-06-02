import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { interpolate, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated';
import { useThemeStore } from '../../stores/themeStore';

interface GlassHeaderProps {
  title: string;
  scrollRef: React.RefObject<Animated.ScrollView>;
  rightAction?: React.ReactNode;
}

export function GlassHeader({ title, scrollRef, rightAction }: GlassHeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const scrollOffset = useScrollViewOffset(scrollRef as any);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, 80], [0, 1]),
  }));

  return (
    <View style={styles.container}>
      <BlurView
        intensity={interpolate(scrollOffset.value, [0, 80], [0, 90])}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.overlay, animatedStyle]} />
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { color: theme.text }]}>
          {title}
        </Animated.Text>
        {rightAction && <View style={styles.right}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 100,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flex: 1,
  },
  title: { fontSize: 24, fontWeight: '500' },
  right: { flexDirection: 'row', gap: 12 },
});
