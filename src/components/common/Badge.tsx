import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface BadgeProps {
  children?: React.ReactNode;
  label?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' | 'mint';
  size?: 'sm' | 'md';
  pill?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  label,
  variant = 'mint',
  size = 'md',
  pill = true,
  style,
  textStyle,
}) => {
  const { isLight, isAgro, borderRadius, spacing } = useTheme();

  const getVariantStyles = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'success':
      case 'mint':
        return {
          bg: isAgro ? 'rgba(163, 230, 53, 0.14)' : isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.15)',
          text: isAgro ? '#A3E635' : isLight ? '#047857' : '#00D488',
          border: isAgro ? 'rgba(163, 230, 53, 0.35)' : isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.35)',
        };
      case 'purple':
        return {
          bg: isLight ? '#f3e8ff' : 'rgba(168, 85, 247, 0.15)',
          text: isLight ? '#7e22ce' : '#c084fc',
          border: isLight ? '#d8b4fe' : 'rgba(168, 85, 247, 0.35)',
        };
      case 'warning':
        return {
          bg: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
          text: isLight ? '#b45309' : '#fbbf24',
          border: isLight ? '#fcd34d' : 'rgba(245, 158, 11, 0.35)',
        };
      case 'danger':
        return {
          bg: isLight ? '#ffe4e6' : 'rgba(225, 29, 72, 0.15)',
          text: isLight ? '#be123c' : '#fb7185',
          border: isLight ? '#fecdd3' : 'rgba(225, 29, 72, 0.35)',
        };
      case 'info':
        return {
          bg: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.15)',
          text: isLight ? '#1d4ed8' : '#60a5fa',
          border: isLight ? '#bfdbfe' : 'rgba(37, 99, 235, 0.35)',
        };
      case 'neutral':
      default:
        return {
          bg: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
          text: isLight ? '#475569' : '#cbd5e1',
          border: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
        };
    }
  };

  const v = getVariantStyles();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.baseBadge,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: 1,
          borderRadius: pill ? borderRadius.pill : borderRadius.sm,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 6 : 10,
        },
        style,
      ]}
    >
      {label ? (
        <Text
          style={[
            styles.baseText,
            {
              color: v.text,
              fontSize: isSm ? 10 : 11,
              fontWeight: '800',
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      ) : typeof children === 'string' ? (
        <Text
          style={[
            styles.baseText,
            {
              color: v.text,
              fontSize: isSm ? 10 : 11,
              fontWeight: '800',
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  baseBadge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  baseText: {
    letterSpacing: 0.3,
  },
});
