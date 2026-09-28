import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { ThemeToggle } from './ThemeToggle';

export interface TopHeaderProps {
  icon: string;
  roleBadge: string;
  roleBadgeColor?: string;
  roleBadgeBg?: string;
  portalTitle: string;
  portalSubtitle?: string;
  activeViewTitle?: string;
  isMobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
  unreadNotifsCount?: number;
  onOpenNotifs?: () => void;
  extraActions?: React.ReactNode;
  forceDark?: boolean;
  hideThemeToggle?: boolean;
  style?: ViewStyle;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  icon,
  roleBadge,
  roleBadgeColor = '#00D488',
  roleBadgeBg = 'rgba(0, 212, 136, 0.15)',
  portalTitle,
  portalSubtitle,
  activeViewTitle,
  isMobileNavOpen = false,
  onToggleMobileNav,
  unreadNotifsCount,
  onOpenNotifs,
  extraActions,
  forceDark = false,
  hideThemeToggle = false,
  style,
}) => {
  const { theme, isLight: baseIsLight, colors, borderRadius, spacing, shadows } = useTheme();
  const { isMobile } = useResponsive();
  const isLight = forceDark ? false : baseIsLight;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isLight ? 'rgba(248, 250, 252, 0.95)' : 'rgba(15, 23, 42, 0.95)',
          borderBottomColor: isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(255, 255, 255, 0.08)',
          borderBottomWidth: 1,
          paddingHorizontal: isMobile ? 12 : 24,
          ...(isLight ? shadows.subtle : shadows.card),
        },
        style,
      ]}
    >
      {/* Left: Mobile Nav Button + Brand & Portal Info */}
      <View style={styles.leftSection}>
        {isMobile && onToggleMobileNav && roleBadge !== 'PASSENGER' && (
          <TouchableOpacity
            onPress={onToggleMobileNav}
            accessibilityLabel={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            activeOpacity={0.7}
            style={[
              styles.mobileNavToggle,
              {
                backgroundColor: isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.mobileNavToggleText,
                { color: isLight ? '#0f172a' : '#ffffff' },
              ]}
            >
              {isMobileNavOpen ? '✕' : '☰'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.brandRow}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: roleBadgeBg,
                borderColor: roleBadgeColor,
              },
            ]}
          >
            <Text style={styles.iconText}>{icon}</Text>
          </View>

          <View style={styles.titleColumn}>
            <View style={styles.wordmarkRow}>
              <Text
                style={[
                  styles.brandText,
                  { color: isLight ? '#0f172a' : '#ffffff' },
                ]}
              >
                RURAL
                <Text style={{ color: roleBadgeColor || '#00D488' }}>BUS</Text>
              </Text>

              <View
                style={[
                  styles.roleBadgePill,
                  {
                    backgroundColor: roleBadgeBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: roleBadgeColor },
                  ]}
                >
                  {roleBadge}
                </Text>
              </View>

              {!isMobile && activeViewTitle && (
                <View
                  style={[
                    styles.activeViewBadge,
                    {
                      backgroundColor:
                        roleBadgeColor === '#2563eb'
                          ? isLight
                            ? '#eff6ff'
                            : 'rgba(37, 99, 235, 0.12)'
                          : isLight
                          ? '#ecfdf5'
                          : 'rgba(0, 212, 136, 0.12)',
                      borderColor:
                        roleBadgeColor === '#2563eb'
                          ? isLight
                            ? '#bfdbfe'
                            : 'rgba(37, 99, 235, 0.3)'
                          : isLight
                          ? '#a7f3d0'
                          : 'rgba(0, 212, 136, 0.3)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.activeViewText,
                      {
                        color:
                          roleBadgeColor === '#2563eb'
                            ? isLight
                              ? '#1d4ed8'
                              : '#60a5fa'
                            : isLight
                            ? '#047857'
                            : '#00D488',
                      },
                    ]}
                  >
                    › {activeViewTitle}
                  </Text>
                </View>
              )}
            </View>

            {!isMobile && (
              <Text
                style={[
                  styles.subtitleText,
                  { color: isLight ? '#64748b' : '#94a3b8' },
                ]}
                numberOfLines={1}
              >
                {portalSubtitle || portalTitle}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Right: Actions + Notifications + Theme Toggle */}
      <View style={styles.rightSection}>
        {extraActions}

        {onOpenNotifs && (
          <TouchableOpacity
            onPress={onOpenNotifs}
            activeOpacity={0.7}
            style={[
              styles.notifButton,
              {
                backgroundColor:
                  (unreadNotifsCount ?? 0) > 0
                    ? 'rgba(245, 158, 11, 0.15)'
                    : isLight
                    ? 'rgba(241, 245, 249, 0.9)'
                    : 'rgba(255, 255, 255, 0.08)',
                borderColor:
                  (unreadNotifsCount ?? 0) > 0
                    ? '#f59e0b'
                    : isLight
                    ? '#cbd5e1'
                    : 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {(unreadNotifsCount ?? 0) > 0 && (
              <Text
                style={[
                  styles.notifCount,
                  { color: (unreadNotifsCount ?? 0) > 0 ? '#d97706' : colors.textSecondary },
                ]}
              >
                {unreadNotifsCount}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!forceDark && !hideThemeToggle && (
          <ThemeToggle compact={isMobile} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  mobileNavToggle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileNavToggleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 15,
  },
  titleColumn: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  roleBadgePill: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeViewBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeViewText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifIcon: {
    fontSize: 13,
  },
  notifCount: {
    fontSize: 12,
    fontWeight: '800',
  },
});
