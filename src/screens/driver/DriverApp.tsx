import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { useAuthStore } from '../../stores/auth.store';
import { useDriverStore } from '../../stores/driver.store';
import { DriverHomeScreen } from './DriverHomeScreen';
import { DriverMapScreen } from './DriverMapScreen';
import { DriverStopsScreen } from './DriverStopsScreen';
import { DriverHistoryScreen } from './DriverHistoryScreen';
import { DriverProfileScreen } from './DriverProfileScreen';
import { SelectBusModal } from './modals/SelectBusModal';
import { EndTripConfirmModal } from './modals/EndTripConfirmModal';
import { DriverSosModal } from './modals/DriverSosModal';

export const DriverApp: React.FC = () => {
  const { activeTab, setActiveTab, logout } = useNavigationStore();
  const authStore = useAuthStore();
  const {
    fetchDuty,
    fetchHistory,
    startTrip,
    endTrip,
    resetDutyState,
    isSelectBusModalOpen,
    setSelectBusModalOpen,
    isEndTripConfirmOpen,
    setEndTripConfirmOpen,
    isSosModalOpen,
    setSosModalOpen,
  } = useDriverStore();

  useEffect(() => {
    fetchDuty();
    fetchHistory();
  }, [fetchDuty, fetchHistory]);

  const handleStartRun = async (tripId: string) => {
    await startTrip(tripId);
    setSelectBusModalOpen(false);
  };

  const handleEndRun = async (tripId: string) => {
    await endTrip(tripId);
    setEndTripConfirmOpen(false);
  };

  const handleLogout = () => {
    resetDutyState();
    authStore.logout();
    logout();
  };

  return (
    <View style={styles.container}>
      {/* Tab 1: HOME (My Trip / HUD) */}
      {activeTab === 'HOME' && (
        <DriverHomeScreen
          onNavigateToMap={() => setActiveTab('MAP')}
          onNavigateToStops={() => setActiveTab('STOPS')}
          onOpenSos={() => setSosModalOpen(true)}
        />
      )}

      {/* Tab 2: MAP (Live Trip Radar HUD) */}
      {activeTab === 'MAP' && (
        <DriverMapScreen
          onOpenSos={() => setSosModalOpen(true)}
          onNavigateToStops={() => setActiveTab('STOPS')}
        />
      )}

      {/* Tab 3: STOPS (Route & Stops Checklist) */}
      {activeTab === 'STOPS' && (
        <DriverStopsScreen
          onOpenSos={() => setSosModalOpen(true)}
          onNavigateToHome={() => setActiveTab('HOME')}
        />
      )}

      {/* Tab 4: HISTORY (Trip History) */}
      {activeTab === 'HISTORY' && (
        <DriverHistoryScreen onOpenSos={() => setSosModalOpen(true)} />
      )}

      {/* Tab 5: PROFILE (Driver Profile & Credentials) */}
      {activeTab === 'PROFILE' && (
        <DriverProfileScreen
          onLogout={handleLogout}
          onOpenSos={() => setSosModalOpen(true)}
        />
      )}

      {/* Modals */}
      <SelectBusModal
        isOpen={isSelectBusModalOpen}
        onClose={() => setSelectBusModalOpen(false)}
        onStartRun={handleStartRun}
      />

      <EndTripConfirmModal
        isOpen={isEndTripConfirmOpen}
        onClose={() => setEndTripConfirmOpen(false)}
        onConfirmEnd={handleEndRun}
      />

      <DriverSosModal
        isOpen={isSosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
