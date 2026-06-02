import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useThemeStore } from '../../stores/themeStore';
import { useOfflineStore } from '../../stores/offlineStore';
import { screenDimensions } from '../../lib/theme';

export function OfflineBanner() {
  const theme = useThemeStore((s) => s.theme);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const translateY = useSharedValue(isOnline ? 100 : 0);

  React.useEffect(() => {
    translateY.value = withSpring(isOnline ? 100 : 0, { damping: 15, stiffness: 150 });
  }, [isOnline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      translateY.value = withSpring(100);
    });

  if (isOnline) return null;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.banner,
          animatedStyle,
          { backgroundColor: theme.danger + 'CC' },
        ]}
      >
        <Text style={styles.text}>Offline — syncing when connected</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: { color: 'white', fontSize: 14, fontWeight: '500' },
});
