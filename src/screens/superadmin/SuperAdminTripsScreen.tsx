import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Badge, TextInput } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';

interface TripItem {
  id: string;
  tripCode: string;
  route: string;
  operator: string;
  busReg: string;
  departureTime: string;
  status: 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED';
}

const PLATFORM_TRIPS: TripItem[] = [
  { id: 'trp-1', tripCode: 'TRP-101', route: 'Belagavi ↔ Hubballi', operator: 'Belagavi Rural Lines', busReg: 'KA-22-F-1001', departureTime: '08:30 AM', status: 'IN_TRANSIT' },
  { id: 'trp-2', tripCode: 'TRP-202', route: 'Jaipur ↔ Tonk', operator: 'Demo Travel', busReg: 'RJ-14-P-2002', departureTime: '09:15 AM', status: 'SCHEDULED' },
  { id: 'trp-3', tripCode: 'TRP-303', route: 'Hassan ↔ Sakleshpur', operator: 'Hassan Coastal Express', busReg: 'KA-19-E-3003', departureTime: '10:00 AM', status: 'BOARDING' },
  { id: 'trp-4', tripCode: 'TRP-404', route: 'Bengaluru ↔ Mysuru', operator: 'Karnataka State Express', busReg: 'KA-01-F-4004', departureTime: '06:00 AM', status: 'COMPLETED' },
];

export const SuperAdminTripsScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');

  const filtered = PLATFORM_TRIPS.filter(
    (t) =>
      t.tripCode.toLowerCase().includes(search.toLowerCase()) ||
      t.route.toLowerCase().includes(search.toLowerCase()) ||
      t.operator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Dispatched Commercial Trips ({PLATFORM_TRIPS.length})
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            System-wide commercial duty log, departure schedules, and service completions
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          placeholder="Search trip code, route, operator..."
          value={search}
          onChangeText={setSearch}
          leftIcon="🔍"
        />
      </View>

      <View style={{ gap: 10 }}>
        {filtered.map((trip) => (
          <View
            key={trip.id}
            style={[
              styles.tripCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.tripCode, { color: colors.textPrimary }]}>{trip.tripCode}</Text>
                <Badge
                  variant={trip.status === 'IN_TRANSIT' ? 'mint' : trip.status === 'COMPLETED' ? 'success' : 'warning'}
                  label={trip.status}
                />
              </View>
              <Text style={[styles.tripRoute, { color: colors.textSecondary }]}>
                {trip.route} • Dep: {trip.departureTime}
              </Text>
              <Text style={[styles.tripMeta, { color: colors.textMuted }]}>
                Operator: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{trip.operator}</Text> • Bus: {trip.busReg}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 14 },
  headerRow: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 4 },
  tripCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 },
  tripCode: { fontSize: 16, fontWeight: '800' },
  tripRoute: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  tripMeta: { fontSize: 12 },
});
