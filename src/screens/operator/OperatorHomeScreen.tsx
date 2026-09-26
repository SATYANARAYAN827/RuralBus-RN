/**
 * Operator Home / Operations Overview Screen
 * Displays authoritative backend operational KPIs:
 * - Active fleet vehicles
 * - Buses currently on road (Live Fleet Radar active count)
 * - Active drivers and conductors
 * - Authoritative daily passenger and revenue metrics (online vs cash)
 * - Quick action dispatches
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, LoadingIndicator, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useOperatorStore } from '../../stores/operator.store';

interface OperatorHomeScreenProps {
  onNavigateToBuses: () => void;
  onNavigateToLiveMap: () => void;
  onNavigateToStaff: () => void;
  onNavigateToRoutes: () => void;
  onNavigateToTrips: () => void;
  onNavigateToRevenue: () => void;
}

export const OperatorHomeScreen: React.FC<OperatorHomeScreenProps> = ({
  onNavigateToBuses,
  onNavigateToLiveMap,
  onNavigateToStaff,
  onNavigateToRoutes,
  onNavigateToTrips,
  onNavigateToRevenue,
}) => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    revenueReport,
    isLoadingRevenue,
    revenueError,
    fetchRevenue,
    radarBuses,
    radarTotalActive,
    fetchFleetRadar,
    buses,
    fetchBuses,
    staff,
    fetchStaff,
    trips,
    fetchTrips,
    setIsAddBusModalOpen,
    setIsDispatchTripModalOpen,
    setIsAddStaffModalOpen,
  } = useOperatorStore();

  useEffect(() => {
    fetchRevenue();
    fetchFleetRadar();
    fetchBuses();
    fetchStaff();
    fetchTrips();
  }, [fetchRevenue, fetchFleetRadar, fetchBuses, fetchStaff, fetchTrips]);

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE').length;
  const onRoadCount = radarTotalActive || radarBuses.length;
  const activeStaff = staff.filter((s) => s.isActive).length;
  const activeTripsCount = trips.filter((t) => t.status === 'IN_TRANSIT' || t.status === 'BOARDING').length;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Hero Banner */}
      <Card
        padding={16}
        style={[
          styles.heroCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Badge label="FLEET OWNER" variant="mint" size="sm" />
              <Badge label="TENANT ISOLATED" variant="neutral" size="sm" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              Fleet Operations HUD
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Real-time monitoring and dispatch control for authorized vehicles
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.liveRadarPill, { backgroundColor: 'rgba(0, 212, 136, 0.15)' }]}
            onPress={onNavigateToLiveMap}
          >
            <Text style={styles.pulseDot}>🟢</Text>
            <Text style={styles.liveRadarPillText}>Radar: {onRoadCount} on road</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionRow}>
          <Button
            title="+ Register Bus"
            variant="mint"
            size="sm"
            onPress={() => setIsAddBusModalOpen(true)}
          />
          <Button
            title="⚡ Dispatch Trip"
            variant="primary"
            size="sm"
            onPress={() => setIsDispatchTripModalOpen(true)}
          />
          <Button
            title="+ Provision Staff"
            variant="outline"
            size="sm"
            onPress={() => setIsAddStaffModalOpen(true)}
          />
        </View>
      </Card>

      {/* 2. Loading / Error States */}
      {isLoadingRevenue && (
        <Card padding={20} style={styles.stateCard}>
          <LoadingIndicator message="Loading authoritative fleet operations metrics..." />
        </Card>
      )}

      {revenueError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Fleet Metrics"
            message={revenueError}
            retryLabel="Retry"
            onRetry={fetchRevenue}
          />
        </Card>
      )}

      {/* 3. Core KPI Counters Grid */}
      <View style={[styles.kpiGrid, isMobile && styles.mobileKpiGrid]}>
        {/* KPI 1: Active Fleet Vehicles */}
        <TouchableOpacity
          style={[styles.kpiCard, { backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)' }]}
          onPress={onNavigateToBuses}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiIcon}>🚌</Text>
            <Badge label="FLEET" variant="neutral" size="sm" />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
            {activeBuses}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            Active Fleet Buses ({buses.length} total)
          </Text>
        </TouchableOpacity>

        {/* KPI 2: Buses Currently On Road */}
        <TouchableOpacity
          style={[styles.kpiCard, { backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)' }]}
          onPress={onNavigateToLiveMap}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiIcon}>📡</Text>
            <Badge label="RADAR" variant="mint" size="sm" />
          </View>
          <Text style={[styles.kpiValue, { color: '#00D488' }]}>
            {onRoadCount}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            Buses On Road (Live Radar)
          </Text>
        </TouchableOpacity>

        {/* KPI 3: Active Staff Roster */}
        <TouchableOpacity
          style={[styles.kpiCard, { backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)' }]}
          onPress={onNavigateToStaff}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiIcon}>👥</Text>
            <Badge label="CREW" variant="neutral" size="sm" />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
            {activeStaff}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            Active Drivers & Conductors
          </Text>
        </TouchableOpacity>

        {/* KPI 4: Active / Dispatched Trips */}
        <TouchableOpacity
          style={[styles.kpiCard, { backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)' }]}
          onPress={onNavigateToTrips}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiIcon}>⏱️</Text>
            <Badge label="DISPATCH" variant="neutral" size="sm" />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
            {activeTripsCount}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            In-Transit / Boarding Trips
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Authoritative Revenue Overview Card */}
      {revenueReport && (
        <Card
          padding={16}
          style={[
            styles.revenueCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
              borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Authoritative Revenue & Passengers
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Direct from Fastify ledger • Generated at {new Date(revenueReport.generatedAt).toLocaleTimeString()}
              </Text>
            </View>
            <Button
              title="View Breakdown ➔"
              variant="outline"
              size="sm"
              onPress={onNavigateToRevenue}
            />
          </View>

          <View style={styles.revenueGrid}>
            <View style={styles.revenueCol}>
              <Text style={styles.revLabel}>TOTAL REVENUE</Text>
              <Text style={[styles.revValueBig, { color: '#00D488' }]}>
                ₹{revenueReport.totalRevenue.toLocaleString()}
              </Text>
              <Text style={styles.revSub}>
                {revenueReport.totalPassengers} total passengers
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.revenueCol}>
              <Text style={styles.revLabel}>DIGITAL / ONLINE</Text>
              <Text style={[styles.revValue, { color: colors.textPrimary }]}>
                ₹{revenueReport.onlineRevenue.toLocaleString()}
              </Text>
              <Text style={styles.revSub}>
                {revenueReport.onlineTicketCount} tickets
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.revenueCol}>
              <Text style={styles.revLabel}>CASH POS (CONDUCTOR)</Text>
              <Text style={[styles.revValue, { color: colors.textPrimary }]}>
                ₹{revenueReport.cashRevenue.toLocaleString()}
              </Text>
              <Text style={styles.revSub}>
                {revenueReport.cashTicketCount} tickets
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* 5. Navigation Shortcut Cards */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)' }]}
          onPress={onNavigateToRoutes}
        >
          <Text style={styles.shortcutIcon}>🛣️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.shortcutTitle, { color: colors.textPrimary }]}>Corridor Routes & Stops</Text>
            <Text style={[styles.shortcutDesc, { color: colors.textSecondary }]}>Configure corridors and ordered stops</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)' }]}
          onPress={onNavigateToLiveMap}
        >
          <Text style={styles.shortcutIcon}>📡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.shortcutTitle, { color: colors.textPrimary }]}>Live Fleet Radar</Text>
            <Text style={[styles.shortcutDesc, { color: colors.textSecondary }]}>Real-time GPS vehicle positions</Text>
          </View>
          <Text style={styles.arrow}>➔</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  mobileContainer: {
    padding: 12,
    gap: 12,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  liveRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    fontSize: 10,
  },
  liveRadarPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00D488',
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  stateCard: {
    borderRadius: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mobileKpiGrid: {
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiIcon: {
    fontSize: 20,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  revenueCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  revenueGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
  },
  revenueCol: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  revLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94a3b8',
    marginBottom: 4,
  },
  revValueBig: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  revValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  revSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  shortcutsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  shortcutIcon: {
    fontSize: 22,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shortcutDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  arrow: {
    fontSize: 16,
    color: '#94a3b8',
  },
});
