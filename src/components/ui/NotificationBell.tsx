import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSequence, withDelay, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';

interface NotificationBellProps {
  count: number;
  onPress?: () => void;
}

export function NotificationBell({ count, onPress }: NotificationBellProps) {
  const theme = useThemeStore((s) => s.theme);
  const jiggle = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      jiggle.value = withDelay(
        300,
        withSequence(
          withSpring(-15, { damping: 3, stiffness: 200 }),
          withSpring(15, { damping: 3, stiffness: 200 }),
          withSpring(-10, { damping: 3, stiffness: 200 }),
          withSpring(0, { damping: 5, stiffness: 150 })
        )
      );
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${jiggle.value}deg` }],
  }));

  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel="Notifications" accessibilityRole="button">
      <Animated.View style={animatedStyle}>
        <Ionicons name="notifications-outline" size={24} color={theme.text} />
        {count > 0 && (
          <Animated.View style={[styles.badge, { backgroundColor: theme.danger }]}>
            <Animated.Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Animated.Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
});
