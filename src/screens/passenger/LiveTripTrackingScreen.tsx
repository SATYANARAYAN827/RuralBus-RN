import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { Card, Button, Badge, LoadingIndicator } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';

interface LiveTripTrackingScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenSos: () => void;
}

export const LiveTripTrackingScreen: React.FC<LiveTripTrackingScreenProps> = ({
  tripId,
  onBack,
  onOpenSos,
}) => {
  const { colors, isLight } = useTheme();
  const {
    activeTrackingTrip,
    isTrackingLoading,
    startTracking,
    stopTracking,
  } = usePassengerStore();

  useEffect(() => {
    startTracking(tripId);
    return () => {
      stopTracking();
    };
  }, [tripId, startTracking, stopTracking]);

  if (isTrackingLoading || !activeTrackingTrip) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <LoadingIndicator message="Connecting to satellite telemetry & bus GPS..." />
      </View>
    );
  }

  const allStops = [
    ...activeTrackingTrip.passedStops,
    ...activeTrackingTrip.remainingStops,
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button & SOS */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backBtn,
            {
              backgroundColor: isLight ? '#064e3b' : '#050a0f',
              borderColor: '#047857',
            },
          ]}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenSos}
          style={styles.sosButton}
        >
          <Text style={styles.sosButtonText}>🚨 Emergency SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Main Bus Header */}
      <View style={styles.busHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.busTitle, { color: colors.textPrimary }]}>
              {activeTrackingTrip.busRegistration}
            </Text>
            <Badge variant="success" label="● GPS LIVE" />
          </View>
          <Text style={[styles.busSubtitle, { color: colors.textSecondary }]}>
            {activeTrackingTrip.routeName} · {activeTrackingTrip.operatorName}
          </Text>
        </View>
        <Badge variant="mint" label="⚡ 10 Hz Telemetry" />
      </View>

      {/* Speedometer & ETA HUD */}
      <Card
        padding={18}
        style={[
          styles.hudCard,
          {
            backgroundColor: isLight ? '#0f172a' : '#050a0f',
            borderColor: '#334155',
          },
        ]}
      >
        <View style={styles.hudGrid}>
          {/* Speed */}
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>CURRENT SPEED</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.speedValue}>{activeTrackingTrip.currentSpeed}</Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>COMPASS HEADING</Text>
            <Text style={styles.hudValue}>{activeTrackingTrip.heading}° S</Text>
          </View>

          {/* Next Stop ETA */}
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>NEXT STOP ETA</Text>
            <Text style={[styles.hudValue, { color: '#00D488' }]}>
              {activeTrackingTrip.nextStopEta}
            </Text>
          </View>
        </View>

        {/* Approaching stop banner */}
        <View style={styles.approachingBanner}>
          <Text style={styles.approachingLabel}>APPROACHING STOP:</Text>
          <Text style={styles.approachingStopName}>
            📍 {activeTrackingTrip.approachingStop}
          </Text>
        </View>
      </Card>

      {/* Route Corridor Milestone Timeline */}
      <Card padding={18} style={styles.corridorCard}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          CORRIDOR STOPPAGES & MILESTONE TRACKING
        </Text>

        <View style={styles.stopsTimeline}>
          {allStops.map((stopName, idx) => {
            const isPassed = activeTrackingTrip.passedStops.includes(stopName);
            const isCurrent = stopName === activeTrackingTrip.approachingStop;
            const isRemaining = !isPassed && !isCurrent;

            return (
              <View key={idx} style={styles.timelineRow}>
                <View style={styles.indicatorCol}>
                  <View
                    style={[
                      styles.indicatorDot,
                      {
                        backgroundColor: isCurrent ? '#00D488' : isPassed ? '#047857' : '#cbd5e1',
                        borderColor: isCurrent ? '#047857' : '#94a3b8',
                      },
                    ]}
                  />
                  {idx < allStops.length - 1 && (
                    <View
                      style={[
                        styles.indicatorLine,
                        {
                          backgroundColor: isPassed ? '#00D488' : (isLight ? '#e2e8f0' : '#334155'),
                        },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.stopTextCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[
                        styles.stopName,
                        {
                          color: isCurrent ? '#00D488' : isPassed ? colors.textPrimary : colors.textMuted,
                          fontWeight: isCurrent ? '900' : isPassed ? '700' : '500',
                        },
                      ]}
                    >
                      {stopName}
                    </Text>
                    {isCurrent && <Badge variant="mint" label="Approaching" />}
                    {isPassed && <Text style={{ fontSize: 12, color: '#047857' }}>✓</Text>}
                  </View>

                  <Text style={[styles.stopStatus, { color: colors.textMuted }]}>
                    {isCurrent
                      ? `Estimated arrival: ${activeTrackingTrip.nextStopEta}`
                      : isPassed
                      ? 'Passed on schedule'
                      : 'Upcoming scheduled stop'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Safety & Driver Info Card */}
      <Card padding={16} style={styles.driverInfoCard}>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.driverName, { color: colors.textPrimary }]}>
              Assigned Crew: S. K. Mohanty
            </Text>
            <Text style={[styles.driverMeta, { color: colors.textSecondary }]}>
              Verified Commercial PSV License · Alcohol Sensor Verified
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sosButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  busTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  busSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  hudCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  hudGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  speedValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00D488',
  },
  speedUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  hudValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  approachingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  approachingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  approachingStopName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  corridorCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  stopsTimeline: {
    paddingLeft: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  indicatorCol: {
    width: 20,
    alignItems: 'center',
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
  },
  indicatorLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  stopTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 10,
  },
  stopName: {
    fontSize: 13,
    marginBottom: 2,
  },
  stopStatus: {
    fontSize: 11,
  },
  driverInfoCard: {
    borderRadius: 14,
    marginBottom: 30,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 13,
    fontWeight: '800',
  },
  driverMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
