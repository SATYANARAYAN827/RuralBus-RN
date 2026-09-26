import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  style,
}) => {
  const { colors, isLight, borderRadius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#fff1f2' : 'rgba(225, 29, 72, 0.10)',
          borderColor: isLight ? '#fecdd3' : 'rgba(225, 29, 72, 0.35)',
          borderRadius: borderRadius.card,
        },
        style,
      ]}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      <Text style={[styles.title, { color: isLight ? '#be123c' : '#fb7185' }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: isLight ? '#475569' : '#cbd5e1' }]}>
        {message}
      </Text>
      {onRetry && (
        <Button
          title={retryLabel}
          variant="danger"
          size="sm"
          onPress={onRetry}
          style={{ marginTop: spacing.md }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginVertical: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
