import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useDriverStore } from '../../stores/driver.store';

interface DriverHistoryScreenProps {
  onOpenSos: () => void;
}

export const DriverHistoryScreen: React.FC<DriverHistoryScreenProps> = ({
  onOpenSos,
}) => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const { history, fetchHistory, isLoadingHistory } = useDriverStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const trips = history?.trips || [];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Highway Emergency Assistance Banner */}
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

      {/* 2. Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
          Driver Trip History
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Past completed commercial duty trips
        </Text>
      </View>

      {/* 3. Summary Stat Cards */}
      <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
        <Card padding={16} style={styles.statCard}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            COMPLETED RUNS
          </Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {history?.totalCompleted || 0}
          </Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            Official corridor trips
          </Text>
        </Card>

        <Card padding={16} style={styles.statCard}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            TOTAL DISTANCE DRIVEN
          </Text>
          <Text style={[styles.statValue, { color: brandColors.primary }]}>
            {history?.totalDistanceDrivenKm || 0} km
          </Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            Verified telemetry mileage
          </Text>
        </Card>

        <Card padding={16} style={styles.statCard}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            DRIVER ACCREDITATION
          </Text>
          <View style={{ marginTop: 4, marginBottom: 4 }}>
            <Badge variant="success" label="ACTIVE OPERATOR DRIVER" />
          </View>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            State Transport Certified
          </Text>
        </Card>
      </View>

      {/* 4. Trips Table or Empty State (Matches Golden Screenshot) */}
      {trips.length > 0 ? (
        <View style={styles.tripsList}>
          {trips.map((trip) => (
            <Card
              key={trip.id}
              padding={16}
              style={[
                styles.tripCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.tripCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Badge variant="mint" label={trip.routeCode} />
                  <Text style={[styles.tripCorridor, { color: colors.textPrimary }]}>
                    {trip.origin} ➔ {trip.destination}
                  </Text>
                </View>
                <Badge variant="neutral" label={trip.status} />
              </View>

              <View style={styles.tripCardDetails}>
                <Text style={[styles.tripDetailItem, { color: colors.textSecondary }]}>
                  Bus: <Text style={{ fontWeight: '700' }}>{trip.busRegistrationNumber}</Text>
                </Text>
                <Text style={[styles.tripDetailItem, { color: colors.textSecondary }]}>
                  Distance: <Text style={{ fontWeight: '700' }}>{trip.distanceKm} km</Text>
                </Text>
                {trip.passengerCount !== undefined && (
                  <Text style={[styles.tripDetailItem, { color: colors.textSecondary }]}>
                    Passengers: <Text style={{ fontWeight: '700' }}>{trip.passengerCount}</Text>
                  </Text>
                )}
                <Text style={[styles.tripDetailItem, { color: colors.textMuted }]}>
                  {new Date(trip.departureTime).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card
          padding={32}
          style={[
            styles.emptyCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No completed commercial duty trips recorded yet.
          </Text>
        </Card>
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
  header: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsRowMobile: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  tripsList: {
    gap: 12,
  },
  tripCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripCorridor: {
    fontSize: 15,
    fontWeight: '800',
  },
  tripCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    paddingTop: 8,
  },
  tripDetailItem: {
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 140,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
