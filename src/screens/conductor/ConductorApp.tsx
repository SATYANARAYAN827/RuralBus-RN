import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { useConductorStore } from '../../stores/conductor.store';
import { ConductorHomeScreen } from './ConductorHomeScreen';
import { ConductorScanScreen } from './ConductorScanScreen';
import { ConductorPassengersScreen } from './ConductorPassengersScreen';
import { ConductorCashTicketsScreen } from './ConductorCashTicketsScreen';
import { ConductorProfileScreen } from './ConductorProfileScreen';

export const ConductorApp: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigationStore();
  const { fetchDuty, fetchStats } = useConductorStore();

  useEffect(() => {
    fetchDuty();
    fetchStats();
  }, [fetchDuty, fetchStats]);

  return (
    <View style={styles.container}>
      {/* Tab 1: HOME (Home / My Trip HUD) */}
      {(activeTab === 'HOME' || !activeTab) && (
        <ConductorHomeScreen
          onNavigateToScan={() => setActiveTab('SCAN')}
          onNavigateToPassengers={() => setActiveTab('PASSENGERS')}
          onNavigateToCashTickets={() => setActiveTab('CASH_TICKETS')}
        />
      )}

      {/* Tab 2: SCAN (Scan QR Ticket) */}
      {activeTab === 'SCAN' && <ConductorScanScreen />}

      {/* Tab 3: PASSENGERS (Passenger Manifest & Boarding) */}
      {activeTab === 'PASSENGERS' && <ConductorPassengersScreen />}

      {/* Tab 4: CASH_TICKETS (Cash Ticketing POS) */}
      {activeTab === 'CASH_TICKETS' && <ConductorCashTicketsScreen />}

      {/* Tab 5: PROFILE (Conductor Profile & Settlement) */}
      {activeTab === 'PROFILE' && <ConductorProfileScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
