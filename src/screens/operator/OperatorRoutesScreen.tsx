/**
 * Operator Routes & Stops Screen
 * Authoritative management of transit corridors and stop sequences:
 * - Lists tenant corridors and ordered stop pipelines
 * - Preserves stop sequence number exactly as backend defines it
 * - Route creation & Stoppage geo-fence creation
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

export const OperatorRoutesScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    routes,
    totalRoutes,
    routeSearchQuery,
    setRouteSearchQuery,
    isLoadingRoutes,
    routeError,
    fetchRoutes,
    fetchStops,
    selectedRoute,
    setSelectedRoute,
    setIsAddRouteModalOpen,
    setIsAddStopModalOpen,
  } = useOperatorStore();

  useEffect(() => {
    fetchRoutes();
    fetchStops();
  }, [fetchRoutes, fetchStops]);

  const filteredRoutes = routes.filter((r) => {
    if (routeSearchQuery.trim()) {
      const q = routeSearchQuery.toLowerCase();
      const matchCode = r.routeCode?.toLowerCase().includes(q);
      const matchOrigin = r.origin?.toLowerCase().includes(q);
      const matchDest = r.destination?.toLowerCase().includes(q);
      return matchCode || matchOrigin || matchDest;
    }
    return true;
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Actions */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Corridors & Routes ({totalRoutes})
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Ordered stoppages, cumulative distances, and transit sequence
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="+ New Stop"
            variant="outline"
            size="sm"
            onPress={() => setIsAddStopModalOpen(true)}
          />
          <Button
            title="+ Create Route"
            variant="mint"
            size="sm"
            onPress={() => setIsAddRouteModalOpen(true)}
          />
        </View>
      </View>

      {/* 2. Search Card */}
      <Card padding={12} style={styles.searchCard}>
        <TextInput
          placeholder="Search corridors by code, origin, or destination..."
          value={routeSearchQuery}
          onChangeText={setRouteSearchQuery}
          style={styles.searchInput}
        />
      </Card>

      {/* 3. Loading / Error / Empty States */}
      {isLoadingRoutes && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading transit corridors..." />
        </Card>
      )}

      {routeError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Routes"
            message={routeError}
            retryLabel="Retry"
            onRetry={fetchRoutes}
          />
        </Card>
      )}

      {!isLoadingRoutes && filteredRoutes.length === 0 && (
        <Card padding={32} style={styles.stateCard}>
          <EmptyState
            title="No Routes Found"
            description={
              routeSearchQuery
                ? 'No corridors match your search query.'
                : 'No transit corridors have been configured under this operator tenant yet.'
            }
            icon="🛣️"
            action={{
              label: '+ Create First Route',
              onPress: () => setIsAddRouteModalOpen(true),
            }}
          />
        </Card>
      )}

      {/* 4. Routes List */}
      <View style={styles.routesList}>
        {filteredRoutes.map((route) => {
          const isSelected = selectedRoute?.id === route.id;
          const stops = route.stops || [];
          const sortedStops = [...stops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

          return (
            <Card
              key={route.id}
              padding={16}
              style={[
                styles.routeCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isSelected
                    ? '#00D488'
                    : isLight
                    ? 'rgba(0,0,0,0.06)'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View style={styles.routeHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <Badge label={route.routeCode} variant="mint" size="sm" />
                    <Badge
                      label={route.isActive ? 'ACTIVE CORRIDOR' : 'INACTIVE'}
                      variant={route.isActive ? 'mint' : 'neutral'}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.corridorName, { color: colors.textPrimary }]}>
                    {route.origin} ➔ {route.destination}
                  </Text>
                  <Text style={[styles.corridorMeta, { color: colors.textSecondary }]}>
                    {route.totalDistanceKm ? `${route.totalDistanceKm} km` : 'Standard Distance'} •{' '}
                    {route.estimatedDurationMinutes ? `${route.estimatedDurationMinutes} mins` : 'Express'} •{' '}
                    {sortedStops.length} Ordered Stops
                  </Text>
                </View>

                <Button
                  title={isSelected ? 'Hide Stops ▲' : 'View Stops ▼'}
                  variant="outline"
                  size="sm"
                  onPress={() => setSelectedRoute(isSelected ? null : route)}
                />
              </View>

              {/* Stop Sequence Pipeline (Shown if selected or on desktop) */}
              {isSelected && (
                <View style={styles.stopPipelineContainer}>
                  <Text style={styles.pipelineTitle}>ORDERED STOPPAGE SEQUENCE</Text>
                  <View style={styles.pipelineList}>
                    {sortedStops.map((stop, idx) => (
                      <View key={stop.stopId || idx} style={styles.stopItemRow}>
                        <View style={styles.seqBadge}>
                          <Text style={styles.seqText}>{stop.sequenceNumber}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stopName, { color: colors.textPrimary }]}>
                            {stop.name || `Stoppage #${stop.sequenceNumber}`}
                          </Text>
                          <Text style={styles.stopMeta}>
                            +{stop.distanceFromStartKm} km from start • +{stop.estimatedMinutesFromStart} mins • Fare: ₹{stop.fareFromStart}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  searchCard: {
    borderRadius: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  stateCard: {
    borderRadius: 12,
  },
  routesList: {
    gap: 12,
  },
  routeCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  corridorName: {
    fontSize: 18,
    fontWeight: '900',
  },
  corridorMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  stopPipelineContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    marginTop: 12,
  },
  pipelineTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  pipelineList: {
    gap: 8,
  },
  stopItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seqBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D488',
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
  },
  stopMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
});
