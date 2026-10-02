import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { createPortal } from 'react-dom';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  children,
  actions,
  maxWidth = 440,
  style,
}) => {
  const { colors, isLight, borderRadius, spacing, shadows } = useTheme();
  const { isMobile } = useResponsive();

  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      slideAnim.setValue(120);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <View
      style={[
        styles.backdrop,
        {
          backgroundColor: isLight ? 'rgba(15, 23, 42, 0.50)' : 'rgba(0, 0, 0, 0.72)',
          ...(Platform.OS === 'web'
            ? ({
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxSizing: 'border-box',
                padding: isMobile ? 16 : 24,
                overflow: 'hidden',
              } as any)
            : {}),
        },
      ]}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.modalCard,
          {
            backgroundColor: colors.modalBackground,
            borderColor: colors.modalBorder,
            width: '100%',
            maxWidth: isMobile ? Math.min(maxWidth, 400) : maxWidth,
            borderRadius: borderRadius.modal || 20,
            maxHeight: isMobile ? '82%' : '85%',
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
            ...(Platform.OS === 'web'
              ? ({
                  boxShadow: isLight
                    ? '0 25px 60px -15px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                    : '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                } as any)
              : (isLight ? shadows.modal : shadows.elevated)),
          },
          style,
        ]}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: iconBg || (isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.15)'),
                    borderColor: iconColor || '#00D488',
                  },
                ]}
              >
                <Text style={[styles.iconText, { color: iconColor || '#00D488' }]}>{icon}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              {title && (
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: spacing.default }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>

        {/* Footer Actions */}
        {actions && <View style={styles.modalFooter}>{actions}</View>}
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {content}
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1.5,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalBody: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    flexShrink: 0,
  },
});
