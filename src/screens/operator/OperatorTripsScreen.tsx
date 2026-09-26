/**
 * Operator Trips & Dispatch Screen
 * Authoritative management of daily transit dispatches:
 * - Lists scheduled and active tenant trips
 * - Dispatch new trip with bus and driver assignment
 * - Real backend status transitions (BOARDING, IN_TRANSIT, COMPLETED, CANCELLED)
 * - Filtering by trip status
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, TextInput, LoadingIndicator, EmptyState, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useOperatorStore } from '../../stores/operator.store';
import { TripStatus } from '../../types/operator.types';

export const OperatorTripsScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    trips,
    totalTrips,
    tripStatusFilter,
    setTripStatusFilter,
    tripSearchQuery,
    setTripSearchQuery,
    isLoadingTrips,
    tripError,
    fetchTrips,
    updateTripStatus,
    setIsDispatchTripModalOpen,
  } = useOperatorStore();

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const filteredTrips = trips.filter((t) => {
    if (tripStatusFilter !== 'ALL' && t.status !== tripStatusFilter) return false;
    if (tripSearchQuery.trim()) {
      const q = tripSearchQuery.toLowerCase();
      const matchRoute = t.routeCode?.toLowerCase().includes(q);
      const matchBus = t.busReg?.toLowerCase().includes(q);
      const matchOrigin = t.origin?.toLowerCase().includes(q);
      const matchDest = t.destination?.toLowerCase().includes(q);
      return matchRoute || matchBus || matchOrigin || matchDest;
    }
    return true;
  });

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'IN_TRANSIT':
        return <Badge label="IN TRANSIT" variant="mint" size="sm" />;
      case 'BOARDING':
        return <Badge label="BOARDING" variant="info" size="sm" />;
      case 'SCHEDULED':
        return <Badge label="SCHEDULED" variant="neutral" size="sm" />;
      case 'COMPLETED':
        return <Badge label="COMPLETED" variant="neutral" size="sm" />;
      case 'CANCELLED':
        return <Badge label="CANCELLED" variant="danger" size="sm" />;
      case 'DELAYED':
        return <Badge label="DELAYED" variant="warning" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Dispatch Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Trips & Dispatch ({totalTrips})
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Real-time daily schedule, departure timing, and status controls
          </Text>
        </View>
        <Button
          title="⚡ Dispatch Trip"
          variant="mint"
          size="sm"
          onPress={() => setIsDispatchTripModalOpen(true)}
        />
      </View>

      {/* 2. Search & Status Filter Pills */}
      <Card padding={12} style={styles.filterCard}>
        <TextInput
          placeholder="Search trips by route, vehicle plate, or city..."
          value={tripSearchQuery}
          onChangeText={setTripSearchQuery}
          style={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusPillsRow}
        >
          {(['ALL', 'IN_TRANSIT', 'BOARDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map(
            (status) => {
              const isSelected = tripStatusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected
                        ? '#00D488'
                        : isLight
                        ? '#f1f5f9'
                        : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                  onPress={() => setTripStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? '#000000' : colors.textPrimary },
                    ]}
                  >
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </Card>

      {/* 3. Loading / Error / Empty States */}
      {isLoadingTrips && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading daily trips..." />
        </Card>
      )}

      {tripError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Trips"
            message={tripError}
            retryLabel="Retry"
            onRetry={fetchTrips}
          />
        </Card>
      )}

      {!isLoadingTrips && filteredTrips.length === 0 && (
        <Card padding={32} style={styles.stateCard}>
          <EmptyState
            title="No Trips Found"
            description={
              tripSearchQuery || tripStatusFilter !== 'ALL'
                ? 'No scheduled trips match your filter criteria.'
                : 'No trips have been dispatched under this operator tenant yet.'
            }
            icon="⏱️"
            action={{
              label: '⚡ Dispatch First Trip',
              onPress: () => setIsDispatchTripModalOpen(true),
            }}
          />
        </Card>
      )}

      {/* 4. Trips Cards List */}
      <View style={styles.tripsList}>
        {filteredTrips.map((trip) => {
          const dep = new Date(trip.departureTime);
          const arr = new Date(trip.scheduledArrival);

          return (
            <Card
              key={trip.id}
              padding={16}
              style={[
                styles.tripCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View style={styles.tripCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    {getStatusBadge(trip.status)}
                    {trip.routeCode && <Badge label={trip.routeCode} variant="neutral" size="sm" />}
                  </View>
                  <Text style={[styles.tripRoute, { color: colors.textPrimary }]}>
                    {trip.origin || 'Origin'} ➔ {trip.destination || 'Destination'}
                  </Text>
                  <Text style={[styles.tripVehicle, { color: colors.textSecondary }]}>
                    🚌 {trip.busReg || 'Bus'} {trip.busModel ? `(${trip.busModel})` : ''}
                  </Text>
                </View>

                {/* Status Transitions */}
                <View style={styles.statusActions}>
                  {trip.status === 'SCHEDULED' && (
                    <Button
                      title="Start Boarding"
                      variant="primary"
                      size="sm"
                      onPress={() => updateTripStatus(trip.id, 'BOARDING')}
                    />
                  )}
                  {trip.status === 'BOARDING' && (
                    <Button
                      title="Start Transit"
                      variant="mint"
                      size="sm"
                      onPress={() => updateTripStatus(trip.id, 'IN_TRANSIT')}
                    />
                  )}
                  {trip.status === 'IN_TRANSIT' && (
                    <Button
                      title="Complete Trip"
                      variant="mint"
                      size="sm"
                      onPress={() => updateTripStatus(trip.id, 'COMPLETED')}
                    />
                  )}
                  {(trip.status === 'SCHEDULED' || trip.status === 'BOARDING') && (
                    <Button
                      title="Cancel"
                      variant="outline"
                      size="sm"
                      onPress={() => updateTripStatus(trip.id, 'CANCELLED')}
                    />
                  )}
                </View>
              </View>

              {/* Timing & Seats Details */}
              <View style={styles.tripFooter}>
                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>DEPARTURE</Text>
                  <Text style={[styles.timingValue, { color: colors.textPrimary }]}>
                    {dep.toLocaleDateString()} {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>SCHEDULED ARRIVAL</Text>
                  <Text style={[styles.timingValue, { color: colors.textPrimary }]}>
                    {arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {trip.availableSeats !== undefined && (
                  <View style={styles.timingCol}>
                    <Text style={styles.timingLabel}>SEATS</Text>
                    <Text style={[styles.timingValue, { color: '#00D488' }]}>
                      {trip.availableSeats} / {trip.totalSeats || 40} available
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterCard: {
    borderRadius: 12,
  },
  searchInput: {
    marginBottom: 8,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateCard: {
    borderRadius: 12,
  },
  tripsList: {
    gap: 12,
  },
  tripCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  tripRoute: {
    fontSize: 17,
    fontWeight: '800',
  },
  tripVehicle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 6,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  timingCol: {
    minWidth: 100,
  },
  timingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timingValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
