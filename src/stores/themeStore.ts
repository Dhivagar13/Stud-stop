import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { palettes } from '../lib/theme';
import type { Theme } from '../lib/theme';

const storage = new MMKV();
const THEME_KEY = 'theme-preference';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

function getStoredMode(): ThemeMode {
  const stored = storage.getString(THEME_KEY);
  return (stored as ThemeMode) || 'system';
}

function resolveTheme(mode: ThemeMode, systemScheme: 'light' | 'dark'): Theme {
  if (mode === 'system') {
    return palettes[systemScheme];
  }
  return palettes[mode];
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getStoredMode(),
  theme: palettes.dark,

  setMode: (mode: ThemeMode) => {
    storage.set(THEME_KEY, mode);
    const systemScheme = useColorScheme() || 'dark';
    set({ mode, theme: resolveTheme(mode, systemScheme) });
  },

  toggleTheme: () => {
    set((state) => {
      const newMode = state.mode === 'dark' ? 'light' : 'dark';
      storage.set(THEME_KEY, newMode);
      return { mode: newMode, theme: palettes[newMode] };
    });
  },
}));
