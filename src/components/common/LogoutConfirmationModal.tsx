import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigationStore } from '../../navigation/navigation.store';
import { Modal } from './Modal';
import { ROLE_NAVIGATION_CONFIGS } from '../../navigation/roleNavigationConfig';

export interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { colors, isLight, borderRadius, spacing } = useTheme();
  const { isMobile } = useResponsive();
  const { user, logout: authLogout } = useAuthStore();
  const { activeRole, logout: navLogout, user: navUser } = useNavigationStore();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentUser = user || navUser;
  const config = ROLE_NAVIGATION_CONFIGS[activeRole] || ROLE_NAVIGATION_CONFIGS.PASSENGER;

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        await authLogout();
        navLogout();
      }
    } catch {
      // Fallback safe state wipe
      try {
        navLogout();
      } catch {}
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : config.icon || '👤';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoggingOut ? () => {} : onClose}
      title="Sign Out Confirmation"
      subtitle="Are you sure you want to log out?"
      icon="🚪"
      iconBg="rgba(239, 68, 68, 0.12)"
      iconColor="#ef4444"
      maxWidth={460}
    >
      <View style={styles.container}>
        {/* User Profile Preview Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
              borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: config.roleBadgeColor || '#059669',
              },
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.userName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {currentUser?.fullName || 'Current User'}
              </Text>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: config.roleBadgeBg || 'rgba(16, 185, 129, 0.15)',
                    borderColor: config.roleBadgeColor || '#10b981',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: config.roleBadgeColor || '#10b981' },
                  ]}
                >
                  {config.roleBadge || activeRole}
                </Text>
              </View>
            </View>

            <Text style={[styles.userContact, { color: colors.textMuted }]}>
              {currentUser?.phone ? `📱 +91 ${currentUser.phone}` : ''}
              {currentUser?.phone && currentUser?.email ? ' • ' : ''}
              {currentUser?.email ? `✉️ ${currentUser.email}` : ''}
            </Text>
          </View>
        </View>

        {/* Informative Explanation Banner */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isLight
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(245, 158, 11, 0.12)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
            },
          ]}
        >
          <Text style={styles.infoIcon}>🔒</Text>
          <Text
            style={[
              styles.infoText,
              { color: isLight ? '#92400e' : '#fde68a' },
            ]}
          >
            You will be signed out on this device. All active bookings, live routes, and server data will remain securely saved.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
              },
            ]}
            onPress={onClose}
            disabled={isLoggingOut}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cancelBtnText,
                { color: colors.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              isLoggingOut && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirmLogout}
            disabled={isLoggingOut}
            activeOpacity={0.85}
          >
            {isLoggingOut ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.confirmBtnText}>Signing out...</Text>
              </View>
            ) : (
              <Text style={styles.confirmBtnText}>🚪 Yes, Log Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userContact: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
