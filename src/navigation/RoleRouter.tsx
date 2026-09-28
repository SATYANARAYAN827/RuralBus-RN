import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { useResponsive } from '../theme/useResponsive';
import { useNavigationStore } from './navigation.store';
import { useAuthStore } from '../stores/auth.store';
import { useOperatorStore } from '../stores/operator.store';
import { useSuperAdminStore } from '../stores/superadmin.store';
import { useNotificationStore } from '../stores/notification.store';
import { NotificationsModal } from '../components/common/NotificationsModal';
import { ROLE_NAVIGATION_CONFIGS } from './roleNavigationConfig';
import { ResponsiveShell } from '../components/layout/ResponsiveShell';
import { LoginScreen, RegisterScreen, ForceChangePasswordModal } from '../screens/auth';
import { PassengerApp } from '../screens/passenger';
import { DriverApp } from '../screens/driver';
import { ConductorApp } from '../screens/conductor';
import { OperatorAdminApp } from '../screens/operator';
import { SuperAdminApp } from '../screens/superadmin';
import {
  Button,
  Card,
  Badge,
  TextInput,
  Modal,
  LoadingIndicator,
  ErrorState,
  EmptyState,
} from '../components/common';
import { UserRole } from '../types';

export const RoleRouter: React.FC = () => {
  const { isLight, colors } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeRole,
    activeTab,
    isMobileNavOpen,
    isAuthenticated,
    user: navUser,
    unreadNotifsCount,
    setActiveRole,
    setActiveTab,
    toggleMobileNav,
    setMobileNavOpen,
    setUser,
    login,
    logout,
  } = useNavigationStore();

  const authStore = useAuthStore();
  const operatorStore = useOperatorStore();
  const superAdminStore = useSuperAdminStore();
  const notificationStore = useNotificationStore();

  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [testInputValue, setTestInputValue] = useState('');
  const [isForcePasswordDismissed, setIsForcePasswordDismissed] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const effectiveUser = authStore.user || navUser;

  // Initial fetch of authoritative counts for the active role
  useEffect(() => {
    if (activeRole === 'OPERATOR_ADMIN' && authStore.isAuthenticated) {
      operatorStore.fetchBuses();
      operatorStore.fetchStaff();
      operatorStore.fetchFleetRadar();
      operatorStore.fetchRoutes();
      operatorStore.fetchTrips();
    } else if (activeRole === 'PLATFORM_ADMIN' && authStore.isAuthenticated) {
      superAdminStore.fetchOperators();
      superAdminStore.fetchStaff();
      superAdminStore.fetchBuses();
    }
  }, [activeRole, authStore.isAuthenticated]);

  // Sync active role and user identity with authoritative logged-in user from authStore
  useEffect(() => {
    if (authStore.user) {
      if (authStore.user.role !== activeRole) {
        setActiveRole(authStore.user.role, authStore.user);
      } else if (navUser?.phone !== authStore.user.phone || navUser?.fullName !== authStore.user.fullName) {
        setUser(authStore.user);
      }
    }
  }, [authStore.user, activeRole, setActiveRole, setUser, navUser]);

  const config = ROLE_NAVIGATION_CONFIGS[activeRole] || ROLE_NAVIGATION_CONFIGS.PASSENGER;
  const currentItem = config.items.find((i) => i.id === activeTab) || config.items[0];

  // Dynamically compute badges from real live store state
  const dynamicNavItems = useMemo(() => {
    if (activeRole === 'OPERATOR_ADMIN') {
      const onRoad = operatorStore.radarTotalActive || operatorStore.radarBuses.length;
      return config.items.map((item) => {
        if (item.id === 'BUSES') {
          return { ...item, badge: String(operatorStore.buses.length) };
        }
        if (item.id === 'STAFF') {
          return { ...item, badge: String(operatorStore.staff.length) };
        }
        if (item.id === 'ROUTES') {
          return { ...item, badge: operatorStore.routes.length > 0 ? String(operatorStore.routes.length) : undefined };
        }
        if (item.id === 'TRIPS') {
          return { ...item, badge: operatorStore.trips.length > 0 ? String(operatorStore.trips.length) : undefined };
        }
        if (item.id === 'LIVE_MAP') {
          return { ...item, badge: onRoad > 0 ? `${onRoad} Live` : 'Live' };
        }
        return item;
      });
    }

    if (activeRole === 'PLATFORM_ADMIN') {
      const pendingRequestsCount = superAdminStore.buses.filter(
        (b) => b.status === 'PENDING_APPROVAL'
      ).length;

      return config.items.map((item) => {
        if (item.id === 'OWNERS') {
          return { ...item, badge: String(superAdminStore.operators.length) };
        }
        if (item.id === 'BUSES') {
          return { ...item, badge: String(superAdminStore.buses.length) };
        }
        if (item.id === 'STAFF') {
          return { ...item, badge: String(superAdminStore.staff.length) };
        }
        if (item.id === 'REQUESTS') {
          return {
            ...item,
            badge: pendingRequestsCount > 0 ? String(pendingRequestsCount) : undefined,
            badgeBg: '#f59e0b',
          };
        }
        return item;
      });
    }

    return config.items;
  }, [
    activeRole,
    config.items,
    operatorStore.buses.length,
    operatorStore.staff.length,
    operatorStore.routes.length,
    operatorStore.trips.length,
    operatorStore.radarTotalActive,
    operatorStore.radarBuses.length,
    superAdminStore.operators.length,
    superAdminStore.buses.length,
    superAdminStore.staff.length,
  ]);

  // If unauthenticated: Render Golden Login or Register Screen
  if (!isAuthenticated && !authStore.isAuthenticated) {
    if (authView === 'REGISTER') {
      return (
        <RegisterScreen
          onSwitchToLogin={() => setAuthView('LOGIN')}
          onRegisterSuccess={(phone) => {
            setAuthView('LOGIN');
          }}
        />
      );
    }

    return (
      <LoginScreen
        onSwitchToRegister={() => setAuthView('REGISTER')}
      />
    );
  }

  // Authenticated Shell: Full Responsive Navigation Shell for Active Role
  return (
    <>
      <ResponsiveShell
        navItems={dynamicNavItems}
        bottomNavItems={dynamicNavItems.filter((item) => config.bottomTabIds.includes(item.id))}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        portalTitle={config.portalTitle}
        portalSubtitle={config.portalSubtitle}
        activeViewTitle={
          activeRole === 'PASSENGER'
            ? activeTab === 'HOME'
              ? 'Home & Live Radar'
              : currentItem.label
            : activeRole === 'OPERATOR_ADMIN'
            ? activeTab === 'HOME'
              ? 'Fleet Operations HUD'
              : activeTab === 'BUSES'
              ? `My Fleet Buses (${operatorStore.buses.length})`
              : activeTab === 'STAFF'
              ? `Staff Roster (${operatorStore.staff.length})`
              : activeTab === 'ROUTES'
              ? `Routes & Stops (${operatorStore.routes.length})`
              : activeTab === 'TRIPS'
              ? `Daily Trips (${operatorStore.trips.length})`
              : currentItem.label
            : activeRole === 'PLATFORM_ADMIN'
            ? activeTab === 'HOME'
              ? 'System Overview'
              : activeTab === 'OWNERS'
              ? `Fleet Owners (${superAdminStore.operators.length})`
              : activeTab === 'BUSES'
              ? `Fleet Buses (${superAdminStore.buses.length})`
              : activeTab === 'STAFF'
              ? `Platform Staff (${superAdminStore.staff.length})`
              : activeTab === 'ROUTES'
              ? 'Corridor Routes'
              : activeTab === 'TRIPS'
              ? 'Dispatched Trips'
              : activeTab === 'REQUESTS'
              ? `Pending Requests (${superAdminStore.buses.filter((b) => b.status === 'PENDING_APPROVAL').length})`
              : currentItem.label
            : currentItem.label
        }
        scrollable={activeRole !== 'PASSENGER'}
        icon={config.icon}
        roleBadge={config.roleBadge}
        roleBadgeColor={config.roleBadgeColor}
        roleBadgeBg={config.roleBadgeBg}
        user={effectiveUser}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={toggleMobileNav}
        onCloseMobileNav={() => setMobileNavOpen(false)}
        unreadNotifsCount={notificationStore.getUnreadCountForUser(activeRole, effectiveUser?.tenantId, effectiveUser?.phone || undefined)}
        onOpenNotifs={() => setIsNotifModalOpen(true)}
        onLogout={() => {
          authStore.logout();
          logout();
        }}
        extraHeaderActions={null}
      >
        {activeRole === 'PASSENGER' ? (
          <PassengerApp />
        ) : activeRole === 'DRIVER' ? (
          <DriverApp />
        ) : activeRole === 'CONDUCTOR' ? (
          <ConductorApp />
        ) : activeRole === 'OPERATOR_ADMIN' ? (
          <OperatorAdminApp />
        ) : activeRole === 'PLATFORM_ADMIN' ? (
          <SuperAdminApp />
        ) : (
          <View style={styles.foundationContainer}>
            {/* Role Quick Selector Banner */}
          <Card
            variant="mint"
            padding={16}
            style={{ marginBottom: 16 }}
          >
            <View style={styles.roleBannerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 18, flexShrink: 0 }}>{config.icon}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.bannerTitle, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                    {config.portalTitle}
                  </Text>
                  <Text style={[styles.bannerDesc, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                    {config.portalSubtitle}
                  </Text>
                </View>
              </View>
              <Badge variant="mint" label={config.roleBadge} />
            </View>

            <View style={styles.roleTabs}>
              {(['PASSENGER', 'DRIVER', 'CONDUCTOR', 'OPERATOR_ADMIN', 'PLATFORM_ADMIN'] as UserRole[]).map((r) => {
                const isActive = r === activeRole;
                const rConfig = ROLE_NAVIGATION_CONFIGS[r];
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setActiveRole(r)}
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: isActive ? rConfig.roleBadgeColor : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)'),
                        borderColor: isActive ? rConfig.roleBadgeColor : (isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)'),
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>{rConfig.icon}</Text>
                    <Text
                      style={[
                        styles.rolePillText,
                        { color: isActive ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      {rConfig.roleBadge}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Shared Primitives Showcase Grid */}
          <View style={styles.showcaseGrid}>
            {/* Card 1: Buttons & Actions */}
            <Card padding={18} style={styles.gridCard}>
              <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
                Button Primitives
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                Variants and states matching old Capacitor UI
              </Text>

              <View style={styles.buttonRow}>
                <Button title="Primary CTA" variant="primary" size="sm" icon="✓" />
                <Button title="Secondary" variant="secondary" size="sm" />
                <Button title="Outline" variant="outline" size="sm" />
                <Button title="Danger" variant="danger" size="sm" icon="✕" />
                <Button title="Mint" variant="mint" size="sm" />
                <Button title="Loading" variant="primary" size="sm" isLoading />
              </View>
            </Card>

            {/* Card 2: Badges & Tags */}
            <Card padding={18} style={styles.gridCard}>
              <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
                Badge Primitives
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                Semantic status and role pill badges
              </Text>

              <View style={styles.badgeRow}>
                <Badge variant="success" label="ACTIVE" />
                <Badge variant="warning" label="PENDING" />
                <Badge variant="danger" label="CANCELLED" />
                <Badge variant="info" label="BOARDING" />
                <Badge variant="purple" label="SUPER ADMIN" />
                <Badge variant="neutral" label="OFFLINE" />
              </View>
            </Card>

            {/* Card 3: Inputs & Forms */}
            <Card padding={18} style={styles.gridCard}>
              <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
                Input Primitives
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                Labels, focus states, icons & password toggles
              </Text>

              <TextInput
                label="STARTING STOP (FROM)"
                placeholder="e.g. Baramunda ISBT"
                value={testInputValue}
                onChangeText={setTestInputValue}
                leftIcon="📍"
              />

              <TextInput
                label="SECURE ACCESS PIN"
                placeholder="Enter PIN"
                secureTextEntry
                leftIcon="🔒"
              />
            </Card>

            {/* Card 4: Modal & Overlay Primitive */}
            <Card padding={18} style={styles.gridCard}>
              <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
                Modal & Dialog Primitive
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                Centered dialog on desktop, bottom sheet on mobile
              </Text>

              <Button
                title="Open Test Dialog Modal"
                variant="outline"
                size="md"
                icon="🪟"
                onPress={() => setIsDemoModalOpen(true)}
                style={{ marginTop: 8 }}
              />
            </Card>

            {/* Card 5: Feedback & State Primitives */}
            <Card padding={18} style={styles.gridCard}>
              <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
                Feedback & State Primitives
              </Text>

              <LoadingIndicator message="Syncing corridor telemetry..." />

              <ErrorState
                title="Connection Warning"
                message="GPS ping delayed. Retrying over fallback cellular channel."
                onRetry={() => {}}
                retryLabel="Re-ping"
              />

              <EmptyState
                icon="🚌"
                title="No Fleet Vehicles Assigned"
                description="Assign buses from the fleet manager to view live tracking telemetry."
                action={{
                  label: "Assign First Bus",
                  onPress: () => {},
                }}
              />
            </Card>
          </View>

          {/* Demo Modal Dialog */}
          <Modal
            isOpen={isDemoModalOpen}
            onClose={() => setIsDemoModalOpen(false)}
            title="RuralBus Foundation Modal"
            subtitle="Exact parity with Capacitor dialogs"
            icon="🛡️"
            actions={
              <>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  onPress={() => setIsDemoModalOpen(false)}
                />
                <Button
                  title="Confirm & Proceed"
                  variant="primary"
                  size="md"
                  onPress={() => setIsDemoModalOpen(false)}
                />
              </>
            }
          >
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
              This modal primitive reproduces the dialog styling from the approved golden Capacitor screenshots (e.g. `SUPERADMIN_03_MODAL_ADD_OWNER` and `PASSENGER_05_BUY_TICKET_MODAL`).
            </Text>
            <TextInput
              label="CONFIRMATION NOTE"
              placeholder="Type optional verification note"
              style={{ marginTop: 12 }}
            />
          </Modal>
        </View>
        )}
      </ResponsiveShell>

      {/* Mandatory Force Password Change Modal (Shown if user flag is active) */}
      <ForceChangePasswordModal
        isOpen={Boolean(authStore.isAuthenticated && authStore.user?.mustChangePassword && !isForcePasswordDismissed)}
        onClose={() => setIsForcePasswordDismissed(true)}
      />

      {/* Global In-App Notifications Modal */}
      <NotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        userRole={activeRole}
        tenantId={effectiveUser?.tenantId}
        userPhone={effectiveUser?.phone || undefined}
        onNavigateToRequests={() => setActiveTab('REQUESTS')}
        onNavigateToBuses={() => setActiveTab('BUSES')}
      />
    </>
  );
};

const styles = StyleSheet.create({
  foundationContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  roleBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  roleTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  showcaseGrid: {
    gap: 16,
  },
  gridCard: {
    width: '100%',
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
