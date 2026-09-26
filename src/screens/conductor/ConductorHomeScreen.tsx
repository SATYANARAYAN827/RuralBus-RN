import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, LoadingIndicator } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useConductorStore } from '../../stores/conductor.store';

interface ConductorHomeScreenProps {
  onNavigateToScan: () => void;
  onNavigateToPassengers: () => void;
  onNavigateToCashTickets: () => void;
}

export const ConductorHomeScreen: React.FC<ConductorHomeScreenProps> = ({
  onNavigateToScan,
  onNavigateToPassengers,
  onNavigateToCashTickets,
}) => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeTrip,
    totalBookedSeats,
    totalBoardedSeats,
    totalAwaitingSeats,
    totalSeats,
    isLoadingDuty,
    dutyError,
    fetchDuty,
    stats,
    fetchStats,
  } = useConductorStore();

  useEffect(() => {
    fetchDuty();
    fetchStats();
  }, [fetchDuty, fetchStats]);

  const occupancyPercent = totalSeats > 0 ? Math.round((totalBookedSeats / totalSeats) * 100) : 0;
  const boardingPercent = totalBookedSeats > 0 ? Math.round((totalBoardedSeats / totalBookedSeats) * 100) : 0;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Conductor Shift Status Banner */}
      <Card
        padding={14}
        style={[
          styles.shiftBanner,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.statusDot} />
          <View>
            <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
              Conductor POS & Boarding Terminal
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
              Fastify verified · Live passenger manifest & POS ticketing
            </Text>
          </View>
        </View>
        <Badge variant="mint" label="ACTIVE SHIFT" />
      </Card>

      {/* Error State */}
      {dutyError && (
        <Card variant="outlined" padding={14} style={{ borderColor: '#ef4444' }}>
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
            {dutyError}
          </Text>
          <TouchableOpacity onPress={() => fetchDuty()} style={{ marginTop: 8 }}>
            <Text style={{ color: brandColors.primary, fontWeight: '800', fontSize: 13 }}>
              Retry Loading Assigned Duty
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* 2. Main Assigned Duty / Vehicle Card */}
      {activeTrip ? (
        <Card
          padding={20}
          style={[
            styles.dutyCard,
            {
              borderColor:
                activeTrip.status === 'IN_TRANSIT' || activeTrip.status === 'BOARDING'
                  ? brandColors.primary
                  : isLight
                  ? '#a7f3d0'
                  : 'rgba(0, 212, 136, 0.4)',
              backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 212, 136, 0.05)',
            },
          ]}
        >
          <View style={styles.dutyHeader}>
            <View style={styles.busPlateWrapper}>
              <Text style={[styles.busPlateNumber, { color: colors.textPrimary }]}>
                {activeTrip.busRegistrationNumber}
              </Text>
              <Badge variant="mint" label="ASSIGNED BUS" />
            </View>

            <View style={styles.statusRow}>
              {activeTrip.status === 'BOARDING' ? (
                <Badge variant="info" label="● BOARDING ACTIVE" />
              ) : activeTrip.status === 'IN_TRANSIT' ? (
                <Badge variant="success" label="● IN TRANSIT" />
              ) : (
                <Badge variant="warning" label="● SCHEDULED" />
              )}
            </View>
          </View>

          <Text style={[styles.busModelText, { color: colors.textSecondary }]}>
            {activeTrip.busModel} · Route Code: {activeTrip.routeCode}
          </Text>

          <Text style={[styles.corridorText, { color: brandColors.primary }]}>
            Corridor: {activeTrip.origin} ➔ {activeTrip.destination}
          </Text>

          <View style={styles.dutyFooter}>
            <Text style={[styles.departureText, { color: colors.textSecondary }]}>
              Scheduled Departure:{' '}
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                {new Date(activeTrip.departureTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Text>
            <Text style={[styles.departureText, { color: colors.textSecondary }]}>
              Total Stops:{' '}
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                {activeTrip.stops?.length || 0}
              </Text>
            </Text>
          </View>
        </Card>
      ) : isLoadingDuty ? (
        <Card padding={24} style={{ alignItems: 'center' }}>
          <LoadingIndicator message="Fetching assigned commercial duty..." />
        </Card>
      ) : (
        <Card padding={24} style={[styles.dutyCard, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🎫</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Assigned Duty Trip
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            You currently have no scheduled trip assigned by your fleet operator.
          </Text>
          <Button
            title="Refresh Duty Status"
            variant="outline"
            size="sm"
            onPress={() => fetchDuty()}
            isLoading={isLoadingDuty}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      {/* 3. Boarding & Occupancy Progress HUD */}
      <Card
        padding={18}
        style={[
          styles.occupancyCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.occupancyHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Passenger Boarding & Cabin Occupancy
          </Text>
          <Text style={[styles.occupancyPercent, { color: brandColors.primary }]}>
            {occupancyPercent}% Booked
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, boardingPercent))}%`,
                backgroundColor: brandColors.primary,
              },
            ]}
          />
        </View>

        {/* 4 Metric Chips */}
        <View style={styles.occupancyGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TOTAL SEATS</Text>
            <Text style={[styles.statNum, { color: colors.textPrimary }]}>
              {totalSeats || activeTrip?.totalSeats || 40}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>BOOKED</Text>
            <Text style={[styles.statNum, { color: brandColors.primary }]}>
              {totalBookedSeats}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>BOARDED</Text>
            <Text style={[styles.statNum, { color: '#10b981' }]}>
              {totalBoardedSeats}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>AWAITING</Text>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>
              {totalAwaitingSeats}
            </Text>
          </View>
        </View>
      </Card>

      {/* 4. Quick Action Shortcuts */}
      <View style={[styles.actionGrid, isMobile && styles.actionGridMobile]}>
        <TouchableOpacity
          style={styles.actionCardWrapper}
          onPress={onNavigateToScan}
          activeOpacity={0.85}
        >
          <Card padding={16} style={[styles.actionCard, { borderColor: brandColors.primary }]}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>📷</Text>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Scan Ticket QR
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Camera reticle & PNR validator
            </Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCardWrapper}
          onPress={onNavigateToPassengers}
          activeOpacity={0.85}
        >
          <Card padding={16} style={styles.actionCard}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>👥</Text>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Passenger Manifest
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              {totalBookedSeats} booked passengers
            </Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCardWrapper}
          onPress={onNavigateToCashTickets}
          activeOpacity={0.85}
        >
          <Card padding={16} style={styles.actionCard}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>💵</Text>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Cash Tickets POS
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Issue on-bus physical tickets
            </Text>
          </Card>
        </TouchableOpacity>
      </View>

      {/* 5. Shift Performance Metrics */}
      <Card
        padding={16}
        style={[
          styles.statsCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
          Shift Collection Summary
        </Text>
        <View style={styles.shiftStatsRow}>
          <View style={styles.shiftStatItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              TOTAL COLLECTIONS
            </Text>
            <Text style={[styles.shiftStatValue, { color: brandColors.primary }]}>
              ₹{stats?.totalShiftCollections || 0}
            </Text>
          </View>

          <View style={styles.shiftStatItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              PASSENGERS BOARDED
            </Text>
            <Text style={[styles.shiftStatValue, { color: colors.textPrimary }]}>
              {stats?.totalPassengersBoarded || totalBoardedSeats}
            </Text>
          </View>

          <View style={styles.shiftStatItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              TRIPS COMPLETED
            </Text>
            <Text style={[styles.shiftStatValue, { color: colors.textPrimary }]}>
              {stats?.totalTripsHandled || 0}
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  mobileContainer: {
    paddingHorizontal: 4,
  },
  shiftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D488',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  dutyCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  dutyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  busPlateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  busPlateNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busModelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  corridorText: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  dutyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  departureText: {
    fontSize: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
    marginTop: 4,
  },
  occupancyCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  occupancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  occupancyPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  occupancyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.06)',
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionGridMobile: {
    flexDirection: 'column',
  },
  actionCardWrapper: {
    flex: 1,
  },
  actionCard: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  shiftStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shiftStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  shiftStatValue: {
    fontSize: 22,
    fontWeight: '900',
  },
});
