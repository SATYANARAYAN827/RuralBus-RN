import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../theme';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: string | React.ReactNode;
  iconRight?: string | React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onPress,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors, brandColors, isLight, isAgro, borderRadius, spacing, shadows } = useTheme();

  const isDisabled = disabled || isLoading;

  // Size styling
  const sizeStyles: Record<string, { paddingVertical: number; paddingHorizontal: number; fontSize: number; minHeight: number }> = {
    sm: { paddingVertical: 6, paddingHorizontal: 10, fontSize: 12, minHeight: 32 },
    md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13, minHeight: 44 },
    lg: { paddingVertical: 14, paddingHorizontal: 22, fontSize: 15, minHeight: 50 },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // Variant styling
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isAgro ? '#A3E635' : '#059669', // Electric Lime in Agro mode
            borderColor: 'transparent',
            borderWidth: 0,
            ...(isLight ? shadows.card : shadows.glow),
          },
          text: {
            color: isAgro ? '#071007' : '#ffffff',
            fontWeight: isAgro ? '900' : '800',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isAgro ? '#142814' : isLight ? '#334155' : '#1e293b',
            borderColor: isAgro ? 'rgba(163, 230, 53, 0.3)' : isLight ? '#475569' : '#334155',
            borderWidth: 1,
          },
          text: {
            color: '#ffffff',
            fontWeight: '700',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: isLight ? '#ffffff' : 'transparent',
            borderColor: isAgro ? 'rgba(163, 230, 53, 0.35)' : isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.20)',
            borderWidth: 1.5,
          },
          text: {
            color: colors.textPrimary,
            fontWeight: '700',
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: '#e11d48', // Rose-600
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: '#ffffff',
            fontWeight: '800',
          },
        };
      case 'mint':
        return {
          container: {
            backgroundColor: isAgro ? 'rgba(163, 230, 53, 0.14)' : isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)',
            borderColor: isAgro ? 'rgba(163, 230, 53, 0.35)' : isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.35)',
            borderWidth: 1.5,
          },
          text: {
            color: isAgro ? '#A3E635' : isLight ? '#047857' : '#00D488',
            fontWeight: '800',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: colors.textPrimary,
            fontWeight: '600',
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.baseButton,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          minHeight: currentSize.minHeight,
          borderRadius: borderRadius.xl,
          width: fullWidth ? '100%' : 'auto',
          opacity: isDisabled ? 0.5 : 1,
        },
        vStyles.container,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={vStyles.text.color || '#ffffff'}
          style={styles.spinner}
        />
      ) : (
        <>
          {typeof icon === 'string' ? (
            <Text style={[styles.iconText, { marginRight: (title || children) ? spacing.xs : 0 }]}>{icon}</Text>
          ) : icon ? (
            <View style={{ marginRight: (title || children) ? spacing.xs : 0 }}>{icon}</View>
          ) : null}

          {title ? (
            <Text
              style={[
                styles.baseText,
                { fontSize: currentSize.fontSize },
                vStyles.text,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}

          {typeof iconRight === 'string' ? (
            <Text style={[styles.iconText, { marginLeft: spacing.xs }]}>{iconRight}</Text>
          ) : iconRight ? (
            <View style={{ marginLeft: spacing.xs }}>{iconRight}</View>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  baseText: {
    letterSpacing: -0.2,
  },
  iconText: {
    fontSize: 15,
  },
  spinner: {
    marginHorizontal: 4,
  },
});
