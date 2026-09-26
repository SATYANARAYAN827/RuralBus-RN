/**
 * Operator Live Fleet Radar Screen
 * Authoritative endpoint: GET /api/v1/tracking/fleet
 *
 * Requirements:
 * - Tenant-scoped fleet only
 * - Live vehicle position/state
 * - Route code, speed, heading, freshness
 * - Loading / error / empty states
 * - Non-map list/card fallback for Web/headless environments
 * - Zero driver GPS telemetry or /api/v1/tracking/ping or /ws/tracking
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, LoadingIndicator, EmptyState, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useOperatorStore } from '../../stores/operator.store';
import { LiveFleetBus } from '../../types/operator.types';

export const OperatorLiveMapScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    radarBuses,
    radarTotalActive,
    radarLastUpdated,
    isLoadingRadar,
    radarError,
    fetchFleetRadar,
    selectedRadarBus,
    setSelectedRadarBus,
  } = useOperatorStore();

  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  useEffect(() => {
    fetchFleetRadar();
  }, [fetchFleetRadar]);

  // Optional 15-second polling if user activates auto-refresh
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchFleetRadar();
    }, 15000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchFleetRadar]);

  const getFreshness = (lastPingAt?: string): { label: string; color: string } => {
    if (!lastPingAt) return { label: 'UNKNOWN', color: '#94a3b8' };
    const diffMs = Date.now() - new Date(lastPingAt).getTime();
    if (diffMs < 30000) return { label: 'LIVE (< 30s)', color: '#00D488' };
    if (diffMs < 180000) return { label: 'STALE (< 3m)', color: '#f59e0b' };
    return { label: 'OFFLINE (> 3m)', color: '#ef4444' };
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Radar Control HUD Header */}
      <Card
        padding={16}
        style={[
          styles.radarHudCard,
          {
            backgroundColor: isLight ? '#0f172a' : '#090d16',
            borderColor: 'rgba(0, 212, 136, 0.3)',
          },
        ]}
      >
        <View style={styles.hudTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Badge label="LIVE RADAR" variant="mint" size="sm" />
              <Badge label="TENANT SCOPED" variant="neutral" size="sm" />
            </View>
            <Text style={styles.hudTitle}>Live Fleet Telemetry Snapshot</Text>
            <Text style={styles.hudSubtitle}>
              Endpoint: /api/v1/tracking/fleet • {radarTotalActive} Vehicles In-Transit
            </Text>
          </View>

          <View style={styles.hudControls}>
            <TouchableOpacity
              style={[
                styles.autoRefreshBtn,
                {
                  backgroundColor: isAutoRefresh ? 'rgba(0, 212, 136, 0.2)' : 'rgba(255,255,255,0.06)',
                  borderColor: isAutoRefresh ? '#00D488' : 'rgba(255,255,255,0.1)',
                },
              ]}
              onPress={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              <Text style={[styles.autoRefreshText, { color: isAutoRefresh ? '#00D488' : '#cbd5e1' }]}>
                {isAutoRefresh ? '🟢 Auto (15s)' : '⚪ Manual'}
              </Text>
            </TouchableOpacity>

            <Button
              title="↻ Refresh"
              variant="outline"
              size="sm"
              isLoading={isLoadingRadar}
              onPress={fetchFleetRadar}
            />
          </View>
        </View>

        {radarLastUpdated && (
          <Text style={styles.timestampText}>
            Snapshot time: {new Date(radarLastUpdated).toLocaleTimeString()} • Updated from Redis geospatial index
          </Text>
        )}
      </Card>

      {/* 2. Loading / Error / Empty States */}
      {isLoadingRadar && radarBuses.length === 0 && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Querying tenant fleet radar..." />
        </Card>
      )}

      {radarError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Fleet Radar Error"
            message={radarError}
            retryLabel="Retry"
            onRetry={fetchFleetRadar}
          />
        </Card>
      )}

      {!isLoadingRadar && radarBuses.length === 0 && (
        <Card padding={32} style={styles.stateCard}>
          <EmptyState
            title="No Active Vehicles On Road"
            description="No buses under this operator organization currently have status 'IN_TRANSIT' with active GPS telemetry."
            icon="📡"
            action={{
              label: 'Refresh Radar',
              onPress: fetchFleetRadar,
            }}
          />
        </Card>
      )}

      {/* 3. Selected Vehicle Detail Card */}
      {selectedRadarBus && (
        <Card
          padding={16}
          style={[
            styles.selectedCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              borderColor: '#00D488',
            },
          ]}
        >
          <View style={styles.selectedHeader}>
            <View>
              <View style={styles.badgeRow}>
                <Badge label="SELECTED VEHICLE" variant="mint" size="sm" />
                <Badge label={selectedRadarBus.routeCode} variant="neutral" size="sm" />
              </View>
              <Text style={[styles.selectedTitle, { color: colors.textPrimary }]}>
                {selectedRadarBus.registrationNumber}
              </Text>
              <Text style={[styles.selectedSub, { color: colors.textSecondary }]}>
                Driver: {selectedRadarBus.driverName || 'Operator Staff'} • Trip ID: {selectedRadarBus.tripId.substring(0, 8)}...
              </Text>
            </View>
            <Button
              title="Close ✕"
              variant="outline"
              size="sm"
              onPress={() => setSelectedRadarBus(null)}
            />
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemLabel}>SPEED</Text>
              <Text style={[styles.telemValue, { color: '#00D488' }]}>
                {selectedRadarBus.speed} KM/H
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemLabel}>BEARING</Text>
              <Text style={[styles.telemValue, { color: colors.textPrimary }]}>
                {selectedRadarBus.heading}°
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemLabel}>LATITUDE</Text>
              <Text style={[styles.telemValue, { color: colors.textPrimary }]}>
                {selectedRadarBus.latitude.toFixed(5)}° N
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemLabel}>LONGITUDE</Text>
              <Text style={[styles.telemValue, { color: colors.textPrimary }]}>
                {selectedRadarBus.longitude.toFixed(5)}° E
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* 4. Non-map Vehicle Card Fallback / List */}
      <View style={styles.vehicleList}>
        {radarBuses.map((bus) => {
          const freshness = getFreshness(bus.lastPingAt);
          const isSelected = selectedRadarBus?.busId === bus.busId;

          return (
            <TouchableOpacity
              key={bus.busId}
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isSelected ? '#00D488' : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                },
              ]}
              onPress={() => setSelectedRadarBus(bus)}
            >
              <View style={styles.vehicleHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.freshnessDot, { backgroundColor: freshness.color }]} />
                    <Text style={[styles.freshnessText, { color: freshness.color }]}>
                      {freshness.label}
                    </Text>
                    <Badge label={bus.routeCode} variant="neutral" size="sm" />
                  </View>
                  <Text style={[styles.vehiclePlate, { color: colors.textPrimary }]}>
                    {bus.registrationNumber}
                  </Text>
                  <Text style={[styles.vehicleDriver, { color: colors.textSecondary }]}>
                    👨‍✈️ {bus.driverName || 'Driver'} • Status: {bus.status}
                  </Text>
                </View>

                <View style={styles.speedBadge}>
                  <Text style={styles.speedNumber}>{bus.speed}</Text>
                  <Text style={styles.speedUnit}>KM/H</Text>
                </View>
              </View>

              <View style={styles.vehicleCoordsRow}>
                <Text style={styles.coordsText}>
                  📍 {bus.latitude.toFixed(4)}° N, {bus.longitude.toFixed(4)}° E • 🧭 {bus.heading}°
                </Text>
                <Text style={styles.tapToInspect}>
                  {isSelected ? 'Selected ✓' : 'Tap to focus ➔'}
                </Text>
              </View>
            </TouchableOpacity>
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
  radarHudCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hudTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  hudSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  hudControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoRefreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  autoRefreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  stateCard: {
    borderRadius: 12,
  },
  selectedCard: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  selectedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  telemetryItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  telemLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  telemValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  freshnessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  freshnessText: {
    fontSize: 10,
    fontWeight: '800',
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  vehicleDriver: {
    fontSize: 12,
    marginTop: 2,
  },
  speedBadge: {
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  speedNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00D488',
  },
  speedUnit: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D488',
  },
  vehicleCoordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
    marginTop: 10,
  },
  coordsText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tapToInspect: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D488',
  },
});
