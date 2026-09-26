import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  action,
  style,
}) => {
  const { colors, isLight, borderRadius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
          borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
          borderRadius: borderRadius.card,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {description}
        </Text>
      )}
      {action && (
        <Button
          title={action.label}
          variant="outline"
          size="sm"
          onPress={action.onPress}
          style={{ marginTop: spacing.md }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});
