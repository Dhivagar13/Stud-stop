import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';

export function useGyro(sensitivity = 6) {
  const rotX = useSharedValue(0);
  const rotY = useSharedValue(0);
  const isReduceMotion = useSharedValue(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      isReduceMotion.value = enabled;
    });
  }, []);

  useEffect(() => {
    if (isReduceMotion.value) return;

    try {
      Gyroscope.setUpdateInterval(16);
      const sub = Gyroscope.addListener(({ x, y }) => {
        rotX.value = withSpring(x * sensitivity, { damping: 20, stiffness: 90 });
        rotY.value = withSpring(y * sensitivity, { damping: 20, stiffness: 90 });
      });
      return () => sub.remove();
    } catch {
      return undefined;
    }
  }, []);

  return { rotX, rotY, isReduceMotion };
}
