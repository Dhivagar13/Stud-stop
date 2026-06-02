import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../stores/themeStore';

interface GradientIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  colors?: readonly [string, string];
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  elevated?: boolean;
}

function GradientIcon({
  name,
  size = 36,
  colors: explicitColors,
  style,
  iconSize,
  elevated = true,
}: GradientIconProps) {
  const theme = useThemeStore((s) => s.theme);
  const gradientColors = explicitColors || [theme.accent, theme.accentSecondary] as const;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
        },
        elevated && {
          boxShadow: `0 4 8 ${gradientColors[0]}4D`,
          elevation: 4,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 4 }]}
      />
      <Ionicons
        name={name}
        size={iconSize ?? size * 0.55}
        color="#FFF"
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    zIndex: 1,
  },
});

export default GradientIcon;
