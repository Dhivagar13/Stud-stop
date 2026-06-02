import type { ViewStyle } from 'react-native';

export const animation = {
  spring: {
    snappy: { damping: 14, stiffness: 200, mass: 0.5 },
    smooth: { damping: 18, stiffness: 150, mass: 0.8 },
    bouncy: { damping: 8, stiffness: 120, mass: 0.6 },
    gentle: { damping: 22, stiffness: 100, mass: 1 },
  },
  easing: {
    easeOutCubic: [0.33, 1, 0.68, 1] as [number, number, number, number],
    easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
    easeOutBack: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  duration: {
    fast: 200,
    normal: 350,
    slow: 500,
    slowest: 800,
  },
};

export const shadows: Record<string, ViewStyle & { elevation?: number }> = {
  soft: {
    boxShadow: '0 2 8 rgba(0,0,0,0.08)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0 6 16 rgba(0,0,0,0.12)',
    elevation: 4,
  },
  hard: {
    boxShadow: '0 10 24 rgba(0,0,0,0.18)',
    elevation: 8,
  },
};

export function coloredShadow(color: string, intensity = 0.2): ViewStyle {
  const match = color.match(/[\d.]+/g);
  if (match && match.length >= 3) {
    const [r, g, b] = match;
    return { boxShadow: `0 6 16 rgba(${r},${g},${b},${intensity})`, elevation: 6 };
  }
  return { boxShadow: `0 6 16 ${color}`, elevation: 6 };
}

export const gradients = {
  accent: (a: string, b: string) => [a, b] as const,
  warm: ['#E8926A', '#D4744A'] as const,
  rose: ['#D48A7A', '#C47464'] as const,
  gold: ['#E8C9A0', '#D4A870'] as const,
  sage: ['#5B8A72', '#4A7A62'] as const,
  dark: ['#1A1512', '#2A231E'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadiusTokens = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const zIndex = {
  background: 0,
  content: 1,
  card: 2,
  elevated: 10,
  overlay: 100,
  modal: 200,
  toast: 300,
};
