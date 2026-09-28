import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { NavItem, UserProfile } from '../../types';
import { useAuthStore } from '../../stores/auth.store';
import { ThemeToggle } from './ThemeToggle';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  portalTitle: string;
  portalSubtitle?: string;
  icon: string;
  roleBadgeColor?: string;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  items,
  activeTab,
  onSelectTab,
  portalTitle,
  portalSubtitle,
  icon,
  roleBadgeColor = '#00D488',
  user,
  onLogout,
}) => {
  if (!isOpen) return null;

  const { isLight, colors } = useTheme();
  const authStore = useAuthStore();
  const effectiveUser = authStore.user || user;
  const isSuperAdmin = effectiveUser?.role === 'PLATFORM_ADMIN';

  const drawerBg = isLight
    ? '#ffffff'
    : isSuperAdmin
    ? '#050a0f'
    : (colors.sidebarBackground || '#0a1216');

  const drawerBorder = isLight
    ? '#e2e8f0'
    : isSuperAdmin
    ? 'rgba(255, 255, 255, 0.10)'
    : 'rgba(255, 255, 255, 0.12)';

  const headerBorder = isLight
    ? '#e2e8f0'
    : 'rgba(255, 255, 255, 0.08)';

  const brandTextColor = isLight ? '#0f172a' : '#ffffff';
  const brandSubColor = isSuperAdmin
    ? (isLight ? '#7e22ce' : '#d946ef')
    : roleBadgeColor;

  const closeBtnBg = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
  const closeBtnBorder = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)';
  const closeIconColor = isLight ? '#0f172a' : '#ffffff';

  const initials = effectiveUser?.fullName
    ? effectiveUser.fullName
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : effectiveUser?.phone
    ? effectiveUser.phone.slice(-2)
    : 'RB';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Fullscreen dismiss overlay */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sliding Menu Drawer */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: drawerBg,
              borderRightColor: drawerBorder,
            },
          ]}
        >
          {/* Brand Logo Header */}
          <View style={[styles.header, { borderBottomColor: headerBorder }]}>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isSuperAdmin ? '#7e22ce' : '#00875A',
                    borderColor: roleBadgeColor,
                  },
                ]}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              <View style={styles.brandTextContainer}>
                <Text
                  style={[styles.brandTitle, { color: brandTextColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  RURAL<Text style={{ color: roleBadgeColor }}>BUS</Text>
                </Text>
                <Text
                  style={[styles.brandSubtitle, { color: brandSubColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {portalSubtitle || portalTitle}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <ThemeToggle compact />
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: closeBtnBg,
                    borderColor: closeBtnBorder,
                  },
                ]}
                accessibilityLabel="Close navigation menu"
                activeOpacity={0.7}
              >
                <Text style={[styles.closeIcon, { color: closeIconColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Items */}
          <ScrollView
            style={styles.navScroll}
            contentContainerStyle={styles.navContainer}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => {
              const isActive = activeTab === item.id;
              const activeBg = isSuperAdmin
                ? (isLight ? '#f3e8ff' : 'rgba(168, 85, 247, 0.15)')
                : (isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)');
              const activeBorder = isSuperAdmin
                ? (isLight ? '#a855f7' : '#c084fc')
                : roleBadgeColor;
              const activeTextColor = isSuperAdmin
                ? (isLight ? '#7e22ce' : '#c084fc')
                : (isLight ? '#047857' : roleBadgeColor);
              const inactiveTextColor = isLight ? '#475569' : '#cbd5e1';

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  activeOpacity={0.75}
                  style={[
                    styles.navItem,
                    {
                      backgroundColor: isActive ? activeBg : 'transparent',
                      borderColor: isActive ? activeBorder : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.navItemLeft}>
                    <Text style={styles.navIconText}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.navLabel,
                        {
                          color: isActive ? activeTextColor : inactiveTextColor,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.label}
                    </Text>
                  </View>

                  {Boolean(item.badge) && (
                    <View
                      style={[
                        styles.navBadge,
                        {
                          backgroundColor:
                            item.badgeBg ||
                            (isActive
                              ? (isLight
                                  ? (isSuperAdmin ? '#f3e8ff' : '#dcfce7')
                                  : (isSuperAdmin ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 212, 136, 0.25)'))
                              : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.12)')),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.navBadgeText,
                          {
                            color:
                              item.badgeColor ||
                              (isActive
                                ? (isLight ? (isSuperAdmin ? '#7e22ce' : '#15803d') : '#ffffff')
                                : (isLight ? '#64748b' : '#ffffff')),
                          },
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User Profile Card & Sign Out */}
          <View style={[styles.footer, { borderTopColor: headerBorder }]}>
            <View style={styles.userRow}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: isSuperAdmin
                      ? (isLight ? '#f3e8ff' : '#4c1d95')
                      : (isLight ? '#ecfdf5' : '#00593b'),
                    borderColor: isSuperAdmin
                      ? (isLight ? '#d8b4fe' : 'rgba(168, 85, 247, 0.4)')
                      : (isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.3)'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: isSuperAdmin
                        ? (isLight ? '#7e22ce' : '#d8b4fe')
                        : (isLight ? '#047857' : '#00D488'),
                    },
                  ]}
                >
                  {initials}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text
                  style={[
                    styles.userName,
                    { color: isLight ? '#0f172a' : '#ffffff' },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {effectiveUser?.fullName || 'Transit Staff'}
                </Text>
                <Text
                  style={[
                    styles.userRole,
                    { color: isLight ? '#64748b' : '#94a3b8' },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {effectiveUser?.phone || effectiveUser?.role || 'RuralBus Account'}
                </Text>
              </View>
            </View>

            {onLogout && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onLogout();
                }}
                style={[
                  styles.logoutBtn,
                  {
                    backgroundColor: isLight ? '#fee2e2' : 'rgba(225, 29, 72, 0.15)',
                    borderColor: isLight ? '#fca5a5' : 'rgba(225, 29, 72, 0.35)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.logoutText,
                    { color: isLight ? '#be123c' : '#fb7185' },
                  ]}
                >
                  🚪 Log Out
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
  },
  drawer: {
    width: 290,
    maxWidth: '85%',
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brandTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  closeBtn: {
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
  navScroll: {
    flex: 1,
  },
  navContainer: {
    gap: 6,
    paddingVertical: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  navIconText: {
    fontSize: 18,
    flexShrink: 0,
  },
  navLabel: {
    fontSize: 14,
    letterSpacing: -0.2,
    flex: 1,
  },
  navBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 6,
    flexShrink: 0,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    minWidth: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 13,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 11,
    marginTop: 1,
  },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
