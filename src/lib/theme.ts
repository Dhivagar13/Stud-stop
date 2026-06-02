import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Stud-Stop Design System — "Twilight Warmth"
 *
 * Inspired by Vocabulary iOS (Apple Design Award Finalist 2025).
 * Warm sunset/twilight palette with terracotta, amber, peach, and rose.
 * Golden-hour vibes across all surfaces.
 */
export const palettes = {
  light: {
    bg: '#FDF6F0',
    surface: '#FFFCF8',
    glass: 'rgba(253, 246, 240, 0.82)',
    glassBorder: 'rgba(212, 116, 74, 0.18)',
    accent: '#D4744A',
    accentSecondary: '#B88B6A',
    accentTertiary: '#E8C9A0',
    text: '#2D1B12',
    textMuted: '#8B7D72',
    danger: '#C94A3A',
    success: '#5B8A72',
    warning: '#D4A030',
    cardBg: 'rgba(255, 252, 248, 0.72)',
    gradientStart: '#FDF0E8',
    gradientEnd: '#F5DCC8',
    patternColor: 'rgba(212, 116, 74, 0.05)',
    shadowColor: 'rgba(180, 120, 80, 0.15)',
    surfaceElevated: '#FFFCF9',
    overlay: 'rgba(45, 27, 18, 0.40)',
  },
  dark: {
    bg: '#1A1412',
    surface: '#2A221E',
    glass: 'rgba(42, 34, 30, 0.85)',
    glassBorder: 'rgba(232, 146, 106, 0.15)',
    accent: '#E8926A',
    accentSecondary: '#B88B6A',
    accentTertiary: '#D4A870',
    text: '#F5EDE8',
    textMuted: '#A09088',
    danger: '#D95C3A',
    success: '#5DA882',
    warning: '#D4A530',
    cardBg: 'rgba(42, 34, 30, 0.72)',
    gradientStart: '#201B18',
    gradientEnd: '#2D2520',
    patternColor: 'rgba(232, 146, 106, 0.05)',
    shadowColor: 'rgba(200, 150, 100, 0.12)',
    surfaceElevated: '#322A24',
    overlay: 'rgba(10, 8, 6, 0.60)',
  },
};

export interface Theme {
  bg: string;
  surface: string;
  glass: string;
  glassBorder: string;
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
  text: string;
  textMuted: string;
  danger: string;
  success: string;
  warning: string;
  cardBg: string;
  gradientStart: string;
  gradientEnd: string;
  patternColor: string;
  shadowColor: string;
  surfaceElevated: string;
  overlay: string;
}

export const typography = {
  hero: { fontSize: 32, fontWeight: '500' as const },
  h1: { fontSize: 24, fontWeight: '500' as const },
  h2: { fontSize: 18, fontWeight: '500' as const },
  h3: { fontSize: 15, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const screenDimensions = { width, height };

export const glassLevels = {
  1: {
    tintColor: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.20)',
    borderRadius: 24,
    shadowElevation: 8,
  },
  2: {
    overlay: 'rgba(255,255,255,0.12)',
    border: 'rgba(255,255,255,0.35)',
    borderWidth: 0.5,
  },
  3: {
    scale: { damping: 10, stiffness: 180 },
  },
};
