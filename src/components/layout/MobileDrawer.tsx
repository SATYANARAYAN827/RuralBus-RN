import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { NavItem, UserProfile } from '../../types';

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

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'RB';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawer}>
              {/* Brand Logo Header */}
              <View style={styles.header}>
                <View style={styles.brandRow}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: '#00875A',
                        borderColor: roleBadgeColor,
                      },
                    ]}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>
                      RURAL<Text style={{ color: roleBadgeColor }}>BUS</Text>
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

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityLabel="Close navigation menu"
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Navigation Items */}
              <ScrollView
                style={styles.navScroll}
                contentContainerStyle={styles.navContainer}
                showsVerticalScrollIndicator={false}
              >
                {items.map((item) => {
                  const isActive = activeTab === item.id;
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
                          backgroundColor: isActive
                            ? 'rgba(0, 212, 136, 0.12)'
                            : 'transparent',
                          borderColor: isActive ? roleBadgeColor : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.navItemLeft}>
                        <Text style={styles.navIconText}>{item.icon}</Text>
                        <Text
                          style={[
                            styles.navLabel,
                            {
                              color: isActive ? roleBadgeColor : '#cbd5e1',
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
                                  ? 'rgba(0, 212, 136, 0.25)'
                                  : 'rgba(255, 255, 255, 0.12)'),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.navBadgeText,
                              { color: item.badgeColor || '#ffffff' },
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
              <View style={styles.footer}>
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user?.fullName || 'Transit Staff'}
                    </Text>
                    <Text style={styles.userRole} numberOfLines={1}>
                      {user?.phone || user?.role || 'RuralBus Account'}
                    </Text>
                  </View>
                </View>

                {onLogout && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onLogout();
                    }}
                    style={styles.logoutBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.logoutText}>🚪 Log Out</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
  },
  drawer: {
    width: 280,
    height: '100%',
    backgroundColor: '#050a0f',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.12)',
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
    paddingBottom: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
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
  },
  navIconText: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  navBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#00593b',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#00D488',
    fontWeight: '800',
    fontSize: 13,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fb7185',
    fontSize: 12,
    fontWeight: '800',
  },
});
