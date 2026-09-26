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

interface DriverStopsScreenProps {
  onOpenSos: () => void;
  onNavigateToHome: () => void;
}

export const DriverStopsScreen: React.FC<DriverStopsScreenProps> = ({
  onOpenSos,
  onNavigateToHome,
}) => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const { activeTrip, completedStopIds, markStopPassed } = useDriverStore();

  const stops = activeTrip?.stops || [];
  const completedCount = completedStopIds.length;
  const progressPercent =
    stops.length > 0 ? Math.round((completedCount / stops.length) * 100) : 0;

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

      {/* 2. Page Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
          Corridor Stops & Schedule
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          {activeTrip
            ? `${activeTrip.routeCode} · ${activeTrip.origin} ➔ ${activeTrip.destination}`
            : 'No active corridor duty assigned'}
        </Text>
      </View>

      {/* 3. Stops Content or Empty State */}
      {stops.length > 0 ? (
        <View style={styles.stopsWrapper}>
          {/* Corridor Summary Card */}
          <Card
            padding={16}
            style={[
              styles.summaryCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  TOTAL STOPS
                </Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {stops.length}
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  CORRIDOR DISTANCE
                </Text>
                <Text style={[styles.statValue, { color: brandColors.primary }]}>
                  {activeTrip?.totalDistanceKm || 0} km
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  EST. DURATION
                </Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {activeTrip?.estimatedDurationMinutes || 0} mins
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  PROGRESS
                </Text>
                <Text style={[styles.statValue, { color: '#00D488' }]}>
                  {progressPercent}%
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: isLight ? '#e2e8f0' : '#1e293b' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: '#00D488',
                  },
                ]}
              />
            </View>
          </Card>

          {/* Chronological Stop List */}
          <View style={styles.stopsList}>
            {stops.map((stop, index) => {
              const isPassed = completedStopIds.includes(stop.stopId);
              const isNext =
                !isPassed &&
                (index === 0 ||
                  completedStopIds.includes(stops[index - 1].stopId));

              return (
                <View key={stop.stopId} style={styles.stopRow}>
                  {/* Timeline Left Column */}
                  <View style={styles.timelineCol}>
                    <View
                      style={[
                        styles.seqCircle,
                        isPassed && styles.seqPassed,
                        isNext && styles.seqNext,
                      ]}
                    >
                      <Text style={styles.seqText}>{stop.sequenceNumber}</Text>
                    </View>
                    {index < stops.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor: isPassed
                              ? '#00D488'
                              : isLight
                              ? '#cbd5e1'
                              : '#334155',
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Stop Information Card */}
                  <Card
                    padding={16}
                    style={[
                      styles.stopCard,
                      {
                        backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: isNext
                          ? '#00D488'
                          : isPassed
                          ? 'rgba(0, 212, 136, 0.3)'
                          : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.stopCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stopTitle, { color: colors.textPrimary }]}>
                          {stop.stopName}
                        </Text>
                        <Text style={[styles.stopSub, { color: colors.textSecondary }]}>
                          {stop.distanceFromStartKm} km from origin · +{stop.estimatedMinutesFromStart}m
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        {isPassed ? (
                          <Badge variant="success" label="✓ PASSED" />
                        ) : isNext ? (
                          <Badge variant="info" label="CURRENT / NEXT" />
                        ) : (
                          <Badge variant="neutral" label="UPCOMING" />
                        )}

                        {activeTrip?.status === 'IN_TRANSIT' && !isPassed && (
                          <Button
                            title="Mark Arrived"
                            variant={isNext ? 'mint' : 'outline'}
                            size="sm"
                            onPress={() => markStopPassed(stop.stopId)}
                          />
                        )}
                      </View>
                    </View>

                    <Text style={[styles.coordsText, { color: colors.textMuted }]}>
                      GPS: {stop.latitude.toFixed(4)}° N, {stop.longitude.toFixed(4)}° E
                    </Text>
                  </Card>
                </View>
              );
            })}
          </View>
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
          <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Route Stoppages Available
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            No scheduled route stoppages assigned. Stops will display when a trip duty is assigned.
          </Text>
          <Button
            title="Go to Duty HUD"
            variant="outline"
            size="sm"
            onPress={onNavigateToHome}
            style={{ marginTop: 16 }}
          />
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
  stopsWrapper: {
    gap: 16,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stopsList: {
    gap: 0,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineCol: {
    alignItems: 'center',
    width: 32,
  },
  seqCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  seqPassed: {
    backgroundColor: '#00D488',
  },
  seqNext: {
    backgroundColor: '#2563eb',
  },
  seqText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 50,
  },
  stopCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 6,
  },
  stopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stopTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  stopSub: {
    fontSize: 12,
    marginTop: 2,
  },
  coordsText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 440,
    marginTop: 6,
    lineHeight: 18,
  },
});
