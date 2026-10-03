import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { TopHeader } from './TopHeader';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileDrawer } from './MobileDrawer';
import { BottomNav } from './BottomNav';
import { NavItem, UserProfile } from '../../types';
import { useAuthStore } from '../../stores/auth.store';

export interface ResponsiveShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  bottomNavItems?: NavItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  portalTitle: string;
  portalSubtitle?: string;
  activeViewTitle?: string;
  icon: string;
  roleBadge: string;
  roleBadgeColor?: string;
  roleBadgeBg?: string;
  user?: UserProfile | null;
  isMobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  onCloseMobileNav: () => void;
  unreadNotifsCount?: number;
  onOpenNotifs?: () => void;
  onLogout?: () => void;
  extraHeaderActions?: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}

export const ResponsiveShell: React.FC<ResponsiveShellProps> = ({
  children,
  navItems,
  bottomNavItems,
  activeTab,
  onSelectTab,
  portalTitle,
  portalSubtitle,
  activeViewTitle,
  icon,
  roleBadge,
  roleBadgeColor = '#00D488',
  roleBadgeBg,
  user,
  isMobileNavOpen,
  onToggleMobileNav,
  onCloseMobileNav,
  unreadNotifsCount,
  onOpenNotifs,
  onLogout,
  extraHeaderActions,
  scrollable = true,
  contentStyle,
}) => {
  const { isLight, colors } = useTheme();
  const { isMobile } = useResponsive();
  const authStore = useAuthStore();
  const effectiveUser = authStore.user || user;

  const activeBottomItems = bottomNavItems || navItems.slice(0, 4);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.shellLayout}>
        {/* Desktop Sidebar (Rendered on >= 768px only) */}
        {!isMobile && (
          <DesktopSidebar
            items={navItems}
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            portalTitle={portalTitle}
            portalSubtitle={portalSubtitle}
            icon={icon}
            roleBadgeColor={roleBadgeColor}
            user={effectiveUser}
            onLogout={onLogout}
          />
        )}

        {/* Mobile Sliding Drawer (Rendered as Modal Overlay on < 768px for non-passenger roles) */}
        {isMobile && roleBadge !== 'PASSENGER' && isMobileNavOpen && (
          <MobileDrawer
            isOpen={isMobileNavOpen}
            onClose={onCloseMobileNav}
            items={navItems}
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            portalTitle={portalTitle}
            portalSubtitle={portalSubtitle}
            icon={icon}
            roleBadgeColor={roleBadgeColor}
            user={effectiveUser}
            onLogout={onLogout}
          />
        )}

        {/* Main Workspace */}
        <View style={styles.mainWrapper}>
          {/* Top Sticky Header */}
          <TopHeader
            icon={icon}
            roleBadge={roleBadge}
            roleBadgeColor={roleBadgeColor}
            roleBadgeBg={roleBadgeBg}
            portalTitle={portalTitle}
            portalSubtitle={portalSubtitle}
            activeViewTitle={activeViewTitle}
            isMobileNavOpen={isMobileNavOpen}
            onToggleMobileNav={roleBadge === 'PASSENGER' ? undefined : onToggleMobileNav}
            unreadNotifsCount={roleBadge === 'PASSENGER' ? undefined : unreadNotifsCount}
            onOpenNotifs={roleBadge === 'PASSENGER' ? undefined : onOpenNotifs}
            extraActions={extraHeaderActions}
            hideThemeToggle={roleBadge === 'PASSENGER'}
          />

          {/* Content Area */}
          <View
            style={[
              styles.contentArea,
              { backgroundColor: colors.background },
            ]}
          >
            {scrollable ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  { padding: isMobile ? 14 : 24 },
                  contentStyle,
                ]}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View
                style={[
                  styles.nonScrollContent,
                  { padding: roleBadge === 'PASSENGER' ? 0 : isMobile ? 14 : 24 },
                  contentStyle,
                ]}
              >
                {children}
              </View>
            )}
          </View>

          {/* Mobile Bottom Navigation (Rendered on < 768px only) */}
          {isMobile && (
            <BottomNav
              items={activeBottomItems}
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              roleBadgeColor={roleBadgeColor}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  shellLayout: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  nonScrollContent: {
    flex: 1,
  },
});
