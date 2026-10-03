import { create } from 'zustand';
import { ThemeMode } from '../types';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'ruralbus_theme_v3';

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Clear legacy theme keys so all existing browsers switch to the new Agro theme
      if (localStorage.getItem('ruralbus_theme') === 'light') {
        localStorage.removeItem('ruralbus_theme');
      }
    } catch {}

    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light' || saved === 'agro') {
      return saved;
    }
  }
  return 'agro'; // Default to the premier Agro-Green Electric Lime theme for passenger experience
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();

  return {
    theme: initialTheme,
    setTheme: (theme: ThemeMode) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch {
          // Ignore storage quota/security errors
        }
      }
      set({ theme });
    },
    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(next);
    },
  };
});
