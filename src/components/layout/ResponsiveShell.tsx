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

  const activeBottomItems = bottomNavItems || navItems.slice(0, 4);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isLight ? '#f8fafc' : '#0f172a' },
      ]}
    >
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={isLight ? '#f8fafc' : '#0f172a'}
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
            user={user}
            onLogout={onLogout}
          />
        )}

        {/* Mobile Sliding Drawer (Rendered as Modal Overlay on < 768px) */}
        {isMobile && (
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
            user={user}
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
            onToggleMobileNav={onToggleMobileNav}
            unreadNotifsCount={unreadNotifsCount}
            onOpenNotifs={onOpenNotifs}
            extraActions={extraHeaderActions}
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
                  { padding: isMobile ? 14 : 24 },
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
