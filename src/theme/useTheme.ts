import { useThemeStore } from './theme.store';
import { brandColors, lightColors, darkColors, statusColors } from './colors';
import { spacing } from './spacing';
import { borderRadius, borderWidths } from './borders';
import { typography } from './typography';
import { shadows } from './shadows';

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';
  const colors = isLight ? lightColors : darkColors;

  return {
    theme,
    isLight,
    colors,
    brandColors,
    statusColors,
    spacing,
    borderRadius,
    borderWidths,
    typography,
    shadows,
    setTheme,
    toggleTheme,
  };
}
