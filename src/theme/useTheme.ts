import { useThemeStore } from './theme.store';
import { brandColors, lightColors, darkColors, agroColors, statusColors } from './colors';
import { spacing } from './spacing';
import { borderRadius, borderWidths } from './borders';
import { typography } from './typography';
import { shadows } from './shadows';

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';
  const isAgro = theme === 'agro';
  const colors = isAgro ? agroColors : isLight ? lightColors : darkColors;

  return {
    theme,
    isLight,
    isAgro,
    colors,
    brandColors,
    statusColors,
    agroColors,
    spacing,
    borderRadius,
    borderWidths,
    typography,
    shadows,
    setTheme,
    toggleTheme,
  };
}
