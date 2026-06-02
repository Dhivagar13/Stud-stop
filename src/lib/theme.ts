import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Stud-Stop Design System — "Warm Contrast"
 *
 * Light palette uses warm cream/ivory with deep burgundy and forest teal.
 * Dark palette uses warm charcoal with amber and emerald.
 * No purples or blues — rooted in earthy, organic warmth.
 */
export const palettes = {
  light: {
    bg: '#FFF8F0',
    surface: '#FFFDF9',
    glass: 'rgba(255, 248, 240, 0.82)',
    glassBorder: 'rgba(139, 47, 59, 0.18)',
    accent: '#8B2F3B',
    accentSecondary: '#1A6B5A',
    accentTertiary: '#C9A84C',
    text: '#2D1B14',
    textMuted: '#8A7D78',
    danger: '#C94A2A',
    success: '#3A7D5C',
    warning: '#D4942E',
    cardBg: 'rgba(255, 249, 242, 0.72)',
    gradientStart: '#FFF3E6',
    gradientEnd: '#E8D5C4',
    patternColor: 'rgba(139, 47, 59, 0.05)',
    shadowColor: 'rgba(139, 47, 59, 0.15)',
    surfaceElevated: '#FFFBF5',
    overlay: 'rgba(45, 27, 20, 0.40)',
  },
  dark: {
    bg: '#1A1512',
    surface: '#2A231E',
    glass: 'rgba(42, 35, 30, 0.85)',
    glassBorder: 'rgba(233, 185, 110, 0.15)',
    accent: '#E8A637',
    accentSecondary: '#2D8A5E',
    accentTertiary: '#C9952E',
    text: '#F5EFE8',
    textMuted: '#8A7D78',
    danger: '#D95C3A',
    success: '#3DA07A',
    warning: '#D4A530',
    cardBg: 'rgba(42, 35, 30, 0.72)',
    gradientStart: '#1F1815',
    gradientEnd: '#2D231E',
    patternColor: 'rgba(233, 185, 110, 0.05)',
    shadowColor: 'rgba(200, 150, 80, 0.12)',
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
