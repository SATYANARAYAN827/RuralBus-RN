/**
 * Module 6 — Operator Admin App Container
 * Handles tab switching, initialization, and modal dialog mounting.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { useAuthStore } from '../../stores/auth.store';
import { useOperatorStore } from '../../stores/operator.store';
import { useNotificationStore } from '../../stores/notification.store';

import { OperatorHomeScreen } from './OperatorHomeScreen';
import { OperatorBusesScreen } from './OperatorBusesScreen';
import { OperatorLiveMapScreen } from './OperatorLiveMapScreen';
import { OperatorStaffScreen } from './OperatorStaffScreen';
import { OperatorRoutesScreen } from './OperatorRoutesScreen';
import { OperatorTripsScreen } from './OperatorTripsScreen';
import { OperatorRevenueScreen } from './OperatorRevenueScreen';
import { OperatorProfileScreen } from './OperatorProfileScreen';

// Modals
import { AddBusModal } from './modals/AddBusModal';
import { EditBusModal } from './modals/EditBusModal';
import { AddStaffModal } from './modals/AddStaffModal';
import { EditStaffModal } from './modals/EditStaffModal';
import { ResetStaffPasswordModal } from './modals/ResetStaffPasswordModal';
import { DispatchTripModal } from './modals/DispatchTripModal';
import { AddRouteModal } from './modals/AddRouteModal';
import { AddStopModal } from './modals/AddStopModal';
import { BusApprovedModal } from './modals/BusApprovedModal';

export const OperatorAdminApp: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigationStore();
  const { user } = useAuthStore();
  const { fetchRevenue, fetchFleetRadar, fetchBuses, fetchStaff, fetchTrips, fetchRoutes } = useOperatorStore();
  const { getPendingPopupsForUser, markPopupShown } = useNotificationStore();

  const pendingPopups = getPendingPopupsForUser('OPERATOR_ADMIN', user?.tenantId, user?.phone || undefined);
  const activeApprovalPopup = pendingPopups.length > 0 ? pendingPopups[0] : null;

  useEffect(() => {
    // Initial fetch of authoritative tenant data
    fetchRevenue();
    fetchFleetRadar();
    fetchBuses();
    fetchStaff();
    fetchTrips();
    fetchRoutes();
  }, [fetchRevenue, fetchFleetRadar, fetchBuses, fetchStaff, fetchTrips, fetchRoutes]);

  return (
    <View style={styles.container}>
      {/* Tab 1: HOME (Operations Overview HUD) */}
      {(activeTab === 'HOME' || !activeTab) && (
        <OperatorHomeScreen
          onNavigateToBuses={() => setActiveTab('BUSES')}
          onNavigateToLiveMap={() => setActiveTab('LIVE_MAP')}
          onNavigateToStaff={() => setActiveTab('STAFF')}
          onNavigateToRoutes={() => setActiveTab('ROUTES')}
          onNavigateToTrips={() => setActiveTab('TRIPS')}
          onNavigateToRevenue={() => setActiveTab('REVENUE')}
        />
      )}

      {/* Tab 2: BUSES (Fleet Buses) */}
      {activeTab === 'BUSES' && <OperatorBusesScreen />}

      {/* Tab 3: LIVE_MAP (Live Fleet Radar) */}
      {activeTab === 'LIVE_MAP' && <OperatorLiveMapScreen />}

      {/* Tab 4: STAFF (Staff Roster) */}
      {activeTab === 'STAFF' && <OperatorStaffScreen />}

      {/* Tab 5: ROUTES (Routes & Stops) */}
      {activeTab === 'ROUTES' && <OperatorRoutesScreen />}

      {/* Tab 6: TRIPS (Trips & Dispatch) */}
      {activeTab === 'TRIPS' && <OperatorTripsScreen />}

      {/* Tab 7: REVENUE (Revenue & Collections) */}
      {activeTab === 'REVENUE' && <OperatorRevenueScreen />}

      {/* Tab 8: PROFILE (Tenant Company Profile) */}
      {activeTab === 'PROFILE' && <OperatorProfileScreen />}

      {/* Operator Admin Modals */}
      <AddBusModal />
      <EditBusModal />
      <AddStaffModal />
      <EditStaffModal />
      <ResetStaffPasswordModal />
      <DispatchTripModal />
      <AddRouteModal />
      <AddStopModal />

      {/* Credential-Isolated Bus Approval Popup */}
      {activeApprovalPopup && (
        <BusApprovedModal
          isOpen={Boolean(activeApprovalPopup)}
          notification={activeApprovalPopup}
          onClose={() => markPopupShown(activeApprovalPopup.id)}
          onViewFleet={() => {
            markPopupShown(activeApprovalPopup.id);
            setActiveTab('BUSES');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
