import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useDriverStore } from '../../stores/driver.store';

interface DriverHomeScreenProps {
  onNavigateToMap: () => void;
  onNavigateToStops: () => void;
  onOpenSos: () => void;
}

export const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({
  onNavigateToMap,
  onNavigateToStops,
  onOpenSos,
}) => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeTrip,
    upcomingTrips,
    isLoadingDuty,
    dutyError,
    fetchDuty,
    isGpsStreaming,
    currentSpeedKmH,
    tripDurationSeconds,
    setSelectBusModalOpen,
    setEndTripConfirmOpen,
  } = useDriverStore();

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const nextStop = activeTrip?.stops?.find(
    (s, idx) => idx === 0 || s.distanceFromStartKm > 0
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Emergency Assistance & Highway SOS Banner */}
      <Card
        padding={14}
        style={[
          styles.sosBanner,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sosLeft}>
          <View style={styles.onlineDot} />
          <View>
            <Text style={[styles.sosTitle, { color: colors.textPrimary }]}>
              Emergency Assistance & Highway SOS
            </Text>
            <Text style={[styles.sosSubtitle, { color: colors.textSecondary }]}>
              Press in case of breakdown, medical crisis or accident
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.sosButton,
            {
              backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            },
          ]}
          onPress={onOpenSos}
          activeOpacity={0.8}
        >
          <Text style={[styles.sosButtonText, { color: '#ef4444' }]}>
            🚨 EMERGENCY SOS
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Error state if duty failed to fetch */}
      {dutyError && (
        <Card variant="outlined" padding={12} style={{ marginBottom: 16, borderColor: '#ef4444' }}>
          <Text style={{ color: '#ef4444', fontWeight: '700' }}>{dutyError}</Text>
          <TouchableOpacity onPress={() => fetchDuty()} style={{ marginTop: 6 }}>
            <Text style={{ color: brandColors.primary, fontWeight: '800' }}>Retry Loading Duty</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* 2. Main Assigned Vehicle & Corridor Card */}
      {activeTrip ? (
        <Card
          padding={20}
          style={[
            styles.vehicleCard,
            {
              borderColor:
                activeTrip.status === 'IN_TRANSIT'
                  ? brandColors.primary
                  : isLight
                  ? '#a7f3d0'
                  : 'rgba(0, 212, 136, 0.4)',
              backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 212, 136, 0.05)',
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.plateContainer}>
              <Text style={[styles.plateNumber, { color: colors.textPrimary }]}>
                {activeTrip.busRegistrationNumber}
              </Text>
              <Badge variant="mint" label="ASSIGNED VEHICLE" />
            </View>

            <View style={styles.statusContainer}>
              {activeTrip.status === 'IN_TRANSIT' ? (
                <Badge variant="success" label="● IN TRANSIT" />
              ) : activeTrip.status === 'COMPLETED' ? (
                <Badge variant="neutral" label="COMPLETED" />
              ) : (
                <Badge variant="warning" label="● READY TO START" />
              )}

              <View style={styles.gpsIndicatorRow}>
                <View
                  style={[
                    styles.gpsDot,
                    { backgroundColor: isGpsStreaming ? '#00D488' : '#64748b' },
                  ]}
                />
                <Text style={[styles.gpsText, { color: colors.textSecondary }]}>
                  GPS: {isGpsStreaming ? 'Streaming' : 'Standby'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.vehicleModelText, { color: colors.textSecondary }]}>
            {activeTrip.busModel} · {activeTrip.routeCode}
          </Text>

          <Text style={[styles.corridorHeading, { color: brandColors.primary }]}>
            Corridor: {activeTrip.origin} ➔ {activeTrip.destination}
          </Text>
        </Card>
      ) : (
        <Card padding={24} style={[styles.vehicleCard, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🚌</Text>
          <Text style={[styles.emptyDutyTitle, { color: colors.textPrimary }]}>
            No Commercial Duty Assigned
          </Text>
          <Text style={[styles.emptyDutySub, { color: colors.textSecondary }]}>
            Contact your transport depot coordinator to be assigned a corridor trip run.
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

      {/* 3. 4 Key Metric HUD Cards */}
      <View style={[styles.metricsGrid, isMobile && styles.metricsGridMobile]}>
        {/* Metric 1: Current Speed */}
        <Card padding={16} style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            CURRENT SPEED
          </Text>
          <Text style={[styles.metricValue, { color: brandColors.primary }]}>
            {currentSpeedKmH}
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>
            km/h (Highway)
          </Text>
        </Card>

        {/* Metric 2: Next Stop */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onNavigateToStops}
          activeOpacity={0.85}
        >
          <Card padding={16} style={[styles.metricCard, { borderColor: brandColors.primary }]}>
            <Text style={[styles.metricLabel, { color: '#00D488' }]}>
              NEXT STOP
            </Text>
            <Text
              style={[styles.metricValueText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {nextStop ? nextStop.stopName : 'Corridor Terminal'}
            </Text>
            <Text style={[styles.metricSub, { color: brandColors.primary, fontWeight: '700' }]}>
              {activeTrip?.status === 'IN_TRANSIT' ? 'ETA 12m' : 'Trip Not Started'}
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Metric 3: Passengers Onboard */}
        <Card padding={16} style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            PASSENGERS ONBOARD
          </Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {activeTrip ? `${activeTrip.totalSeats - activeTrip.availableSeats} ` : '0 '}
            <Text style={{ fontSize: 16, color: colors.textMuted }}>
              / {activeTrip?.totalSeats || 40}
            </Text>
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>
            {activeTrip
              ? `${Math.round(
                  ((activeTrip.totalSeats - activeTrip.availableSeats) /
                    (activeTrip.totalSeats || 1)) *
                    100
                )}% Occupancy`
              : '0% Occupancy'}
          </Text>
        </Card>

        {/* Metric 4: Trip Duration */}
        <Card padding={16} style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            TRIP DURATION
          </Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {formatDuration(tripDurationSeconds)}
          </Text>
          <Text style={[styles.metricSub, { color: colors.textMuted }]}>
            {activeTrip?.status === 'IN_TRANSIT' ? 'Active on Highway' : 'Elapsed on route'}
          </Text>
        </Card>
      </View>

      {/* 4. Action Buttons Row */}
      {activeTrip && (
        <View style={[styles.actionRow, isMobile && styles.actionRowMobile]}>
          {activeTrip.status === 'SCHEDULED' ? (
            <Button
              title="START TRIP (START GPS STREAM)"
              variant="mint"
              size="lg"
              icon="▶"
              onPress={() => setSelectBusModalOpen(true)}
              style={styles.actionButton}
            />
          ) : activeTrip.status === 'IN_TRANSIT' ? (
            <Button
              title="END TRIP (COMPLETE DUTY)"
              variant="danger"
              size="lg"
              icon="■"
              onPress={() => setEndTripConfirmOpen(true)}
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="DUTY COMPLETED"
              variant="outline"
              size="lg"
              disabled
              style={styles.actionButton}
            />
          )}

          <Button
            title="Open Fullscreen Radar Map ➔"
            variant="outline"
            size="lg"
            icon="🗺️"
            onPress={onNavigateToMap}
            style={styles.actionButton}
          />
        </View>
      )}

      {/* 5. Upcoming Assigned Corridor Runs */}
      {upcomingTrips.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={[styles.upcomingSectionTitle, { color: colors.textPrimary }]}>
            Upcoming Scheduled Runs ({upcomingTrips.length})
          </Text>
          <View style={styles.upcomingList}>
            {upcomingTrips.map((trip) => (
              <Card
                key={trip.id}
                padding={14}
                style={[
                  styles.upcomingCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.upcomingHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge variant="neutral" label={trip.routeCode} />
                    <Text style={[styles.upcomingCorridor, { color: colors.textPrimary }]}>
                      {trip.origin} ➔ {trip.destination}
                    </Text>
                  </View>
                  <Text style={[styles.upcomingTime, { color: brandColors.primary }]}>
                    {new Date(trip.departureTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={[styles.upcomingDetails, { color: colors.textSecondary }]}>
                  {trip.busModel} · {trip.totalDistanceKm} km · {trip.stops.length} Corridor Stops
                </Text>
              </Card>
            ))}
          </View>
        </View>
      )}
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
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  sosLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sosSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sosButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  sosButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  vehicleCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plateNumber: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gpsIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleModelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  corridorHeading: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  emptyDutyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyDutySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  metricsGridMobile: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 110,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricValueText: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionRowMobile: {
    flexDirection: 'column',
  },
  actionButton: {
    flex: 1,
  },
  upcomingSection: {
    marginTop: 8,
    gap: 10,
  },
  upcomingSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  upcomingList: {
    gap: 10,
  },
  upcomingCard: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingCorridor: {
    fontSize: 14,
    fontWeight: '800',
  },
  upcomingTime: {
    fontSize: 14,
    fontWeight: '800',
  },
  upcomingDetails: {
    fontSize: 12,
  },
});
