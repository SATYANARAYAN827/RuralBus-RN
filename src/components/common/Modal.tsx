import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
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

  if (!isOpen) return null;

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: isMobile ? 'flex-end' : 'center',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.modalBackground,
              borderColor: colors.modalBorder,
              maxWidth: isMobile ? '100%' : maxWidth,
              borderTopLeftRadius: borderRadius.modal,
              borderTopRightRadius: borderRadius.modal,
              borderBottomLeftRadius: isMobile ? 0 : borderRadius.modal,
              borderBottomRightRadius: isMobile ? 0 : borderRadius.modal,
              maxHeight: isMobile ? '90%' : '85%',
              ...(isLight ? shadows.modal : shadows.elevated),
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
          >
            {children}
          </ScrollView>

          {/* Footer Actions */}
          {actions && <View style={styles.modalFooter}>{actions}</View>}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    
  },
  modalCard: {
    width: '100%',
    borderWidth: 1.5,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    
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
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
