/**
 * SuperAdminApp — Platform Admin / Super Admin Root Navigator
 *
 * ABSOLUTE INVARIANTS:
 * - No maps, GPS, tracking, telemetry, radar, or location imports.
 * - PLATFORM_ADMIN role only.
 * - Pure platform administration screens.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { SuperAdminHomeScreen } from './SuperAdminHomeScreen';
import { SuperAdminOperatorsScreen } from './SuperAdminOperatorsScreen';
import { SuperAdminStaffScreen } from './SuperAdminStaffScreen';
import { SuperAdminProfileScreen } from './SuperAdminProfileScreen';

export const SuperAdminApp: React.FC = () => {
  const { activeTab } = useNavigationStore();

  const renderScreen = () => {
    switch (activeTab) {
      case 'HOME':
        return <SuperAdminHomeScreen />;
      case 'OWNERS':
        return <SuperAdminOperatorsScreen />;
      case 'STAFF':
        return <SuperAdminStaffScreen />;
      case 'PROFILE':
        return <SuperAdminProfileScreen />;
      default:
        return <SuperAdminHomeScreen />;
    }
  };

  return <View style={styles.root}>{renderScreen()}</View>;
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
