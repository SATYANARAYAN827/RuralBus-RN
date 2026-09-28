import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

export interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, isLight, toggleTheme, borderRadius, spacing } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
          borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.18)',
          borderWidth: 1.5,
          borderRadius: borderRadius.pill,
          paddingVertical: compact ? 6 : 7,
          paddingHorizontal: compact ? 10 : 16,
          // @ts-ignore
          boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 4px 14px rgba(0, 0, 0, 0.4)',
        },
      ]}
      accessibilityLabel="Toggle dark and light theme mode"
    >
      <Text style={styles.icon}>{isLight ? '☀️' : '🌙'}</Text>
      {!compact && (
        <Text
          style={[
            styles.label,
            { color: isLight ? '#0f172a' : '#f8fafc' },
          ]}
        >
          {isLight ? 'Ice White' : 'Dark Mode'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  icon: {
    fontSize: 14,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
