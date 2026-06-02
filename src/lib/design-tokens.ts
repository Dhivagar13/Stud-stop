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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  hard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

export function coloredShadow(color: string, intensity = 0.2): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: intensity,
    shadowRadius: 16,
    elevation: 6,
  };
}

export const gradients = {
  accent: (a: string, b: string) => [a, b] as const,
  warm: ['#E8A637', '#C94A2A'] as const,
  teal: ['#2D8A5E', '#1A6B5A'] as const,
  gold: ['#C9952E', '#E8A637'] as const,
  emerald: ['#2D8A5E', '#3DA07A'] as const,
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
