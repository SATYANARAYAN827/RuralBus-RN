import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { Card, Button, Badge } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';
import { BusService } from '../../types';

interface TripResultsScreenProps {
  onBackToSearch: () => void;
  onSelectTripToBook: (trip: BusService) => void;
  onOpenLiveTrack?: (tripId: string) => void;
}

export const TripResultsScreen: React.FC<TripResultsScreenProps> = ({
  onBackToSearch,
  onSelectTripToBook,
  onOpenLiveTrack,
}) => {
  const { colors, isLight } = useTheme();
  const { isDesktop } = useResponsive();
  const {
    origin,
    destination,
    journeyDate,
    busTypeFilter,
    trips,
    selectTrip,
  } = usePassengerStore();

  const [focusedTrip, setFocusedTrip] = useState<BusService>(trips[0] || null);

  const filteredTrips = trips.filter((t) => {
    if (busTypeFilter && busTypeFilter !== 'ALL' && t.busType !== busTypeFilter) {
      return false;
    }
    return true;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <TouchableOpacity
        onPress={onBackToSearch}
        style={[
          styles.backButton,
          {
            backgroundColor: isLight ? '#064e3b' : '#050a0f',
            borderColor: '#047857',
          },
        ]}
      >
        <Text style={styles.backButtonText}>← Clear Search / Back to Search</Text>
      </TouchableOpacity>

      {/* Header with Live Updates badge & timestamp */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Search Results
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {origin || 'Baramunda ISBT'} ➔ {destination || 'Puri Bus Stand'} · 📅 {journeyDate}
          </Text>
        </View>

        <View style={styles.liveMeta}>
          <Badge variant="mint" label="● Live Updates" />
          <View style={[styles.timestampBox, { backgroundColor: isLight ? '#ffffff' : '#1e293b' }]}>
            <Text style={[styles.timestampText, { color: colors.textMuted }]}>
              Last updated: 12:30:03
            </Text>
          </View>
        </View>
      </View>

      {/* Desktop Split / Mobile Stacked Layout */}
      <View style={[styles.mainLayout, isDesktop ? styles.mainLayoutDesktop : styles.mainLayoutMobile]}>
        {/* Left Column: Trip Cards */}
        <View style={isDesktop ? styles.leftColDesktop : styles.fullCol}>
          <View style={styles.resultsListHeader}>
            <Text style={[styles.resultsCount, { color: colors.textPrimary }]}>
              Available Buses ({filteredTrips.length})
            </Text>
            <View style={[styles.sortPill, { backgroundColor: isLight ? '#ffffff' : '#1e293b' }]}>
              <Text style={[styles.sortText, { color: colors.textSecondary }]}>
                Sort by: Arrival Time ⌄
              </Text>
            </View>
          </View>

          {filteredTrips.length === 0 ? (
            <Card padding={24} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>🚌</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                No Buses Found
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                Try adjusting your starting stop, destination or vehicle filter category.
              </Text>
            </Card>
          ) : (
            <View style={styles.tripsList}>
              {filteredTrips.map((trip) => {
                const isFocused = focusedTrip?.id === trip.id;
                return (
                  <TouchableOpacity
                    key={trip.id}
                    onPress={() => setFocusedTrip(trip)}
                    activeOpacity={0.85}
                  >
                    <Card
                      padding={16}
                      style={[
                        styles.tripCard,
                        isFocused ? { borderColor: '#00D488', borderWidth: 2 } : undefined,
                      ]}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={styles.busIconBox}>
                          <Text style={{ fontSize: 20 }}>🚌</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.busTitle, { color: colors.textPrimary }]}>
                              {trip.busModel}
                            </Text>
                            {trip.isLive && <Badge variant="success" label="LIVE" />}
                          </View>
                          <Text style={[styles.routeSubtitle, { color: colors.textSecondary }]}>
                            {trip.routeName} · {trip.busRegistration}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.tripFare}>₹{trip.fare}</Text>
                          <Text style={[styles.tripSeats, { color: '#047857' }]}>
                            {trip.availableSeats} seats left
                          </Text>
                        </View>
                      </View>

                      {/* Timetable & Speed Meta */}
                      <View style={styles.cardMidRow}>
                        <View>
                          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                            DEPARTURE
                          </Text>
                          <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                            {trip.departureTime}
                          </Text>
                        </View>

                        <View>
                          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                            DURATION
                          </Text>
                          <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                            {trip.duration}
                          </Text>
                        </View>

                        <View>
                          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                            ARRIVAL
                          </Text>
                          <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                            {trip.arrivalTime}
                          </Text>
                        </View>

                        <View>
                          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                            SPEED
                          </Text>
                          <Text style={[styles.metaValue, { color: '#047857' }]}>
                            {trip.isLive ? `${trip.currentSpeedKmH || 48} km/h` : 'At Depot'}
                          </Text>
                        </View>
                      </View>

                      {/* Card Action Buttons */}
                      <View style={styles.cardActionsRow}>
                        <Button
                          title="Select Seats"
                          variant="primary"
                          size="md"
                          onPress={() => {
                            selectTrip(trip);
                            onSelectTripToBook(trip);
                          }}
                        />

                        {trip.isLive && onOpenLiveTrack && (
                          <Button
                            title="📍 Track This Bus"
                            variant="mint"
                            size="md"
                            onPress={() => onOpenLiveTrack(trip.tripId)}
                          />
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Right Column: Live Bus Radar HUD Panel (Desktop & Tablet) */}
        {isDesktop && focusedTrip && (
          <View style={styles.rightColDesktop}>
            <Card padding={18} style={styles.trackingRadarCard}>
              <View style={styles.radarHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, color: '#00D488' }}>●</Text>
                  <Text style={[styles.radarTitle, { color: colors.textPrimary }]}>
                    Live Bus Tracking
                  </Text>
                </View>
                <Text style={[styles.focusedBusName, { color: '#047857' }]}>
                  Focused: {focusedTrip.busModel}
                </Text>
              </View>

              {/* Status badges */}
              <View style={styles.telemetryStatusRow}>
                <Badge
                  variant={focusedTrip.isLive ? 'success' : 'neutral'}
                  label={focusedTrip.isLive ? '● GPS SIGNAL LIVE' : '○ NO GPS SIGNAL'}
                />
                <Badge variant="mint" label="⚡ WebSocket Stream" />
              </View>

              {/* Telemetry Metrics */}
              <View
                style={[
                  styles.telemetryBox,
                  {
                    backgroundColor: isLight ? '#0f172a' : '#050a0f',
                  },
                ]}
              >
                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.tLabel}>GPS SPEED</Text>
                    <Text style={styles.tVal}>
                      {focusedTrip.isLive ? `${focusedTrip.currentSpeedKmH || 52} km/h` : '0 km/h'}
                    </Text>
                  </View>

                  <View style={styles.telemetryItem}>
                    <Text style={styles.tLabel}>NEXT STOP ETA</Text>
                    <Text style={styles.tVal}>
                      {focusedTrip.isLive ? `${focusedTrip.etaMinutes || 14} mins` : '--'}
                    </Text>
                  </View>

                  <View style={styles.telemetryItem}>
                    <Text style={styles.tLabel}>APPROACHING STOP</Text>
                    <Text style={styles.tVal}>
                      {focusedTrip.nextStopName || 'Baramunda ISBT'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Highway Corridor Map Progress Simulation */}
              <View
                style={[
                  styles.mapSimulationBox,
                  {
                    backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                    borderColor: isLight ? '#cbd5e1' : '#334155',
                  },
                ]}
              >
                <View style={styles.corridorPathGraphic}>
                  <Text style={[styles.corridorPathTitle, { color: colors.textSecondary }]}>
                    HIGHWAY CORRIDOR TELEMETRY · {focusedTrip.routeCode}
                  </Text>

                  <View style={styles.pathLine}>
                    {focusedTrip.stops.map((stop, sIdx) => {
                      const isPassed = sIdx === 0;
                      const isCurrent = sIdx === 1;
                      return (
                        <View key={sIdx} style={styles.stopMilestone}>
                          <View
                            style={[
                              styles.milestoneDot,
                              {
                                backgroundColor: isCurrent ? '#00D488' : isPassed ? '#047857' : '#cbd5e1',
                              },
                            ]}
                          />
                          <Text style={[styles.milestoneName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {stop.stopName}
                          </Text>
                          <Text style={[styles.milestoneTime, { color: colors.textMuted }]}>
                            {stop.arrivalTime}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {onOpenLiveTrack && (
                  <Button
                    title="Launch Fullscreen Radar 📡"
                    variant="mint"
                    size="sm"
                    onPress={() => onOpenLiveTrack(focusedTrip.tripId)}
                  />
                )}
              </View>
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  liveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mainLayout: {
    gap: 16,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainLayoutMobile: {
    flexDirection: 'column',
  },
  leftColDesktop: {
    flex: 3,
  },
  fullCol: {
    width: '100%',
  },
  rightColDesktop: {
    flex: 2,
  },
  resultsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '800',
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tripsList: {
    gap: 12,
  },
  tripCard: {
    borderRadius: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  busIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 136, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  routeSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  tripFare: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00D488',
  },
  tripSeats: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  trackingRadarCard: {
    borderRadius: 16,
  },
  radarHeader: {
    marginBottom: 10,
  },
  radarTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  focusedBusName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  telemetryStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  telemetryBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    alignItems: 'center',
  },
  tLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  tVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  mapSimulationBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  corridorPathGraphic: {
    gap: 8,
  },
  corridorPathTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pathLine: {
    gap: 8,
  },
  stopMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  milestoneName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  milestoneTime: {
    fontSize: 11,
  },
});
