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

interface RouteItem {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  stopsCount: number;
  activeTripsCount: number;
}

const PLATFORM_ROUTES: RouteItem[] = [
  { id: 'rt-1', code: 'KA-BLR-01', name: 'Belagavi ↔ Hubballi Expressway', origin: 'Belagavi Central', destination: 'Hubballi Junction', distanceKm: 104, stopsCount: 6, activeTripsCount: 2 },
  { id: 'rt-2', code: 'RJ-JPR-02', name: 'Jaipur ↔ Tonk Inter-District', origin: 'Sindhi Camp Jaipur', destination: 'Tonk Central Stand', distanceKm: 98, stopsCount: 5, activeTripsCount: 1 },
  { id: 'rt-3', code: 'KA-HSN-03', name: 'Hassan ↔ Sakleshpur Ghat Link', origin: 'Hassan Bus Terminal', destination: 'Sakleshpur Town Stand', distanceKm: 42, stopsCount: 4, activeTripsCount: 1 },
  { id: 'rt-4', code: 'KA-MYS-04', name: 'Bengaluru ↔ Mysuru Heritage Corridor', origin: 'Majestic Bengaluru', destination: 'Mysuru Suburb Stand', distanceKm: 145, stopsCount: 8, activeTripsCount: 2 },
  { id: 'rt-5', code: 'KA-UDP-05', name: 'Mangaluru ↔ Udupi Coastal Highway', origin: 'State Bank Mangaluru', destination: 'Udupi Service Stand', distanceKm: 58, stopsCount: 5, activeTripsCount: 2 },
  { id: 'rt-6', code: 'KA-SHM-06', name: 'Shivamogga ↔ Bhadravati Industrial Belt', origin: 'Shivamogga KSRTC', destination: 'Bhadravati Bus Stand', distanceKm: 22, stopsCount: 3, activeTripsCount: 1 },
  { id: 'rt-7', code: 'OD-BBI-07', name: 'Bhubaneswar ↔ Cuttack Twin-City Trunk', origin: 'Baramunda Bus Stand', destination: 'Badambadi Cuttack', distanceKm: 32, stopsCount: 4, activeTripsCount: 1 },
  { id: 'rt-8', code: 'OD-PURI-08', name: 'Bhubaneswar ↔ Puri Pilgrim Corridor', origin: 'Master Canteen BBI', destination: 'Puri Jagannath Stand', distanceKm: 65, stopsCount: 5, activeTripsCount: 2 },
];

export const SuperAdminRoutesScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState('');

  const filtered = PLATFORM_ROUTES.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase())
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
            Corridor Routes ({PLATFORM_ROUTES.length})
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Statewide authorized transit corridors, stoppage networks, and assigned commercial services
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <TextInput
          placeholder="Search corridor, route code, city..."
          value={search}
          onChangeText={setSearch}
          leftIcon="🔍"
        />
      </View>

      <View style={{ gap: 10 }}>
        {filtered.map((route) => (
          <View
            key={route.id}
            style={[
              styles.routeCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.routeName, { color: colors.textPrimary }]}>{route.name}</Text>
                <Badge variant="purple" label={route.code} />
              </View>
              <Text style={[styles.routePath, { color: colors.textSecondary }]}>
                {route.origin} ➔ {route.destination}
              </Text>
              <Text style={[styles.routeMeta, { color: colors.textMuted }]}>
                {route.distanceKm} km • {route.stopsCount} intermediate stops • {route.activeTripsCount} scheduled daily trips
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
  routeCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 },
  routeName: { fontSize: 16, fontWeight: '800' },
  routePath: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  routeMeta: { fontSize: 12 },
});
