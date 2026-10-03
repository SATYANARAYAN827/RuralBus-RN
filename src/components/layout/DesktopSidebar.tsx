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
import { useAuthStore } from '../../stores/auth.store';
import { useSuperAdminStore } from '../../stores/superadmin.store';

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
  const { colors, isLight, isAgro } = useTheme();
  const authStore = useAuthStore();
  const effectiveUser = authStore.user || user;

  const isSuperAdmin = effectiveUser?.role === 'PLATFORM_ADMIN';
  const superAdminBuses = useSuperAdminStore((s) => s.buses);
  const pendingBusesCount = isSuperAdmin
    ? superAdminBuses.filter((b) => b.status === 'PENDING_APPROVAL').length
    : 0;
  const sidebarBg = isSuperAdmin ? '#050a0f' : colors.sidebarBackground;
  const sidebarBorder = isSuperAdmin ? 'rgba(255, 255, 255, 0.10)' : colors.sidebarBorder;
  const isDarkShell = isSuperAdmin || isAgro || !isLight;

  let lastGroup = '';

  const isPassenger = effectiveUser?.role === 'PASSENGER' || portalTitle.includes('Passenger');
  const initials = isSuperAdmin
    ? 'SA'
    : isPassenger
    ? 'PA'
    : effectiveUser?.fullName
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
        <View style={styles.brandTextContainer}>
          <Text
            style={[
              styles.brandTitle,
              { color: isDarkShell ? '#ffffff' : '#0f172a' },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            RURAL
            <Text style={{ color: roleBadgeColor }}>BUS</Text>
          </Text>
          <Text
            style={[
              styles.brandSubtitle,
              { color: isSuperAdmin ? '#d946ef' : roleBadgeColor },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isSuperAdmin
              ? 'Super Admin Console'
              : isPassenger
              ? 'Passenger App'
              : portalSubtitle || portalTitle}
          </Text>
        </View>
      </View>

      {/* Super Admin Audit Logs Alert Pill */}
      {isSuperAdmin && (
        <TouchableOpacity
          onPress={() => onSelectTab('REQUESTS')}
          activeOpacity={0.8}
          style={styles.auditLogsBtn}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 13 }}>🔔</Text>
            <Text style={styles.auditLogsText}>Owner Audit Logs</Text>
          </View>
          <View
            style={[
              styles.auditLogsBadge,
              {
                backgroundColor: pendingBusesCount > 0 ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            <Text style={styles.auditLogsBadgeText}>
              {pendingBusesCount > 0 ? `${pendingBusesCount} PENDING` : 'CLEARED'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

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
                      ? isSuperAdmin
                        ? 'rgba(168, 85, 247, 0.15)'
                        : isDarkShell
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
                          ? isSuperAdmin
                            ? '#c084fc'
                            : isDarkShell
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

                {Boolean(item.badge) && (
                  <View
                    style={[
                      styles.navBadge,
                      {
                        backgroundColor:
                          item.badgeBg ||
                          (isSuperAdmin
                            ? 'rgba(255, 255, 255, 0.10)'
                            : isActive
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
                            (isSuperAdmin
                              ? '#ffffff'
                              : isActive
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
                backgroundColor: isSuperAdmin
                  ? '#4c1d95'
                  : isAgro
                  ? '#A3E635'
                  : '#00593b',
                borderColor: isSuperAdmin
                  ? 'rgba(168, 85, 247, 0.4)'
                  : isAgro
                  ? '#A3E635'
                  : 'rgba(0, 212, 136, 0.3)',
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isSuperAdmin ? '#d8b4fe' : isAgro ? '#071007' : '#00D488' },
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
              {effectiveUser?.fullName || (isPassenger ? 'Passenger' : 'Transit Staff')}
            </Text>
            <Text
              style={[
                styles.userSubtitle,
                { color: isDarkShell ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              {isSuperAdmin
                ? 'Full System Oversight'
                : effectiveUser?.phone || (isPassenger ? '7381319957' : effectiveUser?.role || 'RuralBus')}
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
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    minWidth: 0,
  },
  brandTextContainer: {
    flex: 1,
    minWidth: 0,
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
  auditLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 12,
  },
  auditLogsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
  },
  auditLogsBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  auditLogsBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
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
    minWidth: 0,
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
    minWidth: 0,
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
