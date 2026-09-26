import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useTheme } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'mint' | 'outlined' | 'dark';
  padding?: number;
  radius?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding,
  radius,
  onPress,
  style,
}) => {
  const { colors, isLight, borderRadius, spacing, shadows } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          borderColor: colors.borderSubtle,
          borderWidth: 1.5,
          ...(isLight ? shadows.elevated : shadows.card),
        };
      case 'mint':
        return {
          backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)',
          borderColor: isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.35)',
          borderWidth: 1.5,
        };
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1.5,
        };
      case 'dark':
        return {
          backgroundColor: '#0a101d',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1.5,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.card,
          borderColor: isLight ? '#e2e8f0' : colors.border,
          borderWidth: 1.5,
          ...(isLight ? shadows.card : shadows.subtle),
        };
    }
  };

  const cardStyle: ViewStyle = {
    padding: padding !== undefined ? padding : spacing.default,
    borderRadius: radius !== undefined ? radius : borderRadius.card,
    ...getVariantStyles(),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.baseCard, cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.baseCard, cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  baseCard: {
    width: '100%',
    
  },
});
