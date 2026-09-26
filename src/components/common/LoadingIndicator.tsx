import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'small',
  color,
  fullScreen = false,
  style,
}) => {
  const { colors, brandColors } = useTheme();
  const spinnerColor = color || brandColors.primary;

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={spinnerColor} />
      {message ? (
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullScreen: {
    flex: 1,
    minHeight: 200,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
  },
});
