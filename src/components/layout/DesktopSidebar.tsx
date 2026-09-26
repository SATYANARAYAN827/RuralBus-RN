import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { NavItem, UserProfile } from '../../types';

export interface DesktopSidebarProps {
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

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
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
  const { colors, isLight, borderRadius, spacing } = useTheme();

  const isSuperAdmin = user?.role === 'PLATFORM_ADMIN';
  const sidebarBg = isSuperAdmin ? '#050a0f' : colors.sidebarBackground;
  const sidebarBorder = isSuperAdmin ? 'rgba(255, 255, 255, 0.10)' : colors.sidebarBorder;
  const isDarkShell = isSuperAdmin || !isLight;

  let lastGroup = '';

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'RB';

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: sidebarBg,
          borderRightColor: sidebarBorder,
        },
      ]}
    >
      {/* Brand Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: sidebarBorder },
        ]}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isSuperAdmin
                ? '#7e22ce'
                : '#00875A',
              borderColor: roleBadgeColor,
            },
          ]}
        >
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View>
          <Text
            style={[
              styles.brandTitle,
              { color: isDarkShell ? '#ffffff' : '#0f172a' },
            ]}
          >
            RURAL
            <Text style={{ color: roleBadgeColor }}>BUS</Text>
          </Text>
          <Text
            style={[
              styles.brandSubtitle,
              { color: roleBadgeColor },
            ]}
          >
            {portalSubtitle || portalTitle}
          </Text>
        </View>
      </View>

      {/* Navigation Links */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navContainer}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const showGroup = item.group && item.group !== lastGroup;
          if (showGroup) lastGroup = item.group!;

          return (
            <View key={item.id} style={{ width: '100%' }}>
              {showGroup && (
                <Text
                  style={[
                    styles.groupHeading,
                    { color: isDarkShell ? '#64748b' : colors.textTertiary },
                  ]}
                >
                  {item.group}
                </Text>
              )}

              <TouchableOpacity
                onPress={() => onSelectTab(item.id)}
                activeOpacity={0.75}
                style={[
                  styles.navItem,
                  {
                    backgroundColor: isActive
                      ? isDarkShell
                        ? 'rgba(0, 212, 136, 0.12)'
                        : '#ecfdf5'
                      : 'transparent',
                    borderColor: isActive
                      ? roleBadgeColor
                      : 'transparent',
                  },
                ]}
              >
                <View style={styles.navItemLeft}>
                  <Text style={styles.navIconText}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.navLabel,
                      {
                        color: isActive
                          ? isDarkShell
                            ? roleBadgeColor
                            : '#047857'
                          : isDarkShell
                          ? '#cbd5e1'
                          : colors.textSecondary,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {item.badge && (
                  <View
                    style={[
                      styles.navBadge,
                      {
                        backgroundColor:
                          item.badgeBg ||
                          (isActive
                            ? isDarkShell
                              ? 'rgba(0, 212, 136, 0.25)'
                              : '#dcfce7'
                            : isDarkShell
                            ? 'rgba(255, 255, 255, 0.10)'
                            : '#f1f5f9'),
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
                              ? isDarkShell
                                ? '#00D488'
                                : '#15803d'
                              : isDarkShell
                              ? '#94a3b8'
                              : '#64748b'),
                        },
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Profile Card & Logout */}
      <View
        style={[
          styles.footer,
          { borderTopColor: sidebarBorder },
        ]}
      >
        <View style={styles.userRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isSuperAdmin ? '#4c1d95' : '#00593b',
                borderColor: isSuperAdmin ? 'rgba(168, 85, 247, 0.4)' : 'rgba(0, 212, 136, 0.3)',
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isSuperAdmin ? '#d8b4fe' : '#00D488' },
              ]}
            >
              {initials}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                { color: isDarkShell ? '#ffffff' : '#0f172a' },
              ]}
              numberOfLines={1}
            >
              {user?.fullName || 'Transit Staff'}
            </Text>
            <Text
              style={[
                styles.userSubtitle,
                { color: isDarkShell ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              {user?.phone || user?.role || 'RuralBus'}
            </Text>
          </View>
        </View>

        {onLogout && (
          <TouchableOpacity
            onPress={onLogout}
            style={[
              styles.logoutBtn,
              {
                backgroundColor: isDarkShell ? 'rgba(225, 29, 72, 0.15)' : '#fee2e2',
                borderColor: isDarkShell ? 'rgba(225, 29, 72, 0.35)' : '#fca5a5',
              },
            ]}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.logoutText,
                { color: isDarkShell ? '#fb7185' : '#be123c' },
              ]}
            >
              🚪 Log Out
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1.5,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
    marginBottom: 8,
    borderBottomWidth: 1.5,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  groupHeading: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  navScroll: {
    flex: 1,
  },
  navContainer: {
    gap: 4,
    paddingVertical: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navIconText: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  navBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 13,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
  },
  userSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  logoutBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
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
