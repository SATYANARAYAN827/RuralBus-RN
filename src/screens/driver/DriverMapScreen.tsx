import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Card, Badge, Button } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useDriverStore } from '../../stores/driver.store';

interface DriverMapScreenProps {
  onOpenSos: () => void;
  onNavigateToStops: () => void;
}

export const DriverMapScreen: React.FC<DriverMapScreenProps> = ({
  onOpenSos,
  onNavigateToStops,
}) => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeTrip,
    isGpsStreaming,
    currentSpeedKmH,
    currentLatitude,
    currentLongitude,
    currentHeading,
    lastPingTimestamp,
    lastPingError,
    startGpsTelemetry,
    stopGpsTelemetry,
    sendManualPing,
    completedStopIds,
  } = useDriverStore();

  const stops = activeTrip?.stops || [];
  const nextStop =
    stops.find((s) => !completedStopIds.includes(s.stopId)) || stops[0];

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

      {/* 2. Radar Header with Live Speed Pill */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
            Live Highway Radar
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            {activeTrip
              ? `Corridor: ${activeTrip.origin} ➔ ${activeTrip.destination}`
              : 'Awaiting trip assignment to transmit telemetry'}
          </Text>
        </View>

        <View
          style={[
            styles.speedPill,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.15)',
              borderColor: brandColors.primary,
            },
          ]}
        >
          <Text style={[styles.speedPillText, { color: brandColors.primary }]}>
            Speed: {currentSpeedKmH} km/h · Next: {nextStop ? nextStop.stopName : 'N/A'}
          </Text>
        </View>
      </View>

      {/* 3. High-Tech Driver Radar & HUD Cockpit */}
      {activeTrip ? (
        <Card
          padding={20}
          style={[
            styles.radarCard,
            {
              backgroundColor: isLight ? '#0f172a' : '#090d16',
              borderColor: isGpsStreaming ? '#00D488' : '#334155',
            },
          ]}
        >
          {/* Cockpit Status Bar */}
          <View style={styles.cockpitStatusRow}>
            <View style={styles.cockpitBadgeGroup}>
              <View
                style={[
                  styles.statusIndicatorCircle,
                  { backgroundColor: isGpsStreaming ? '#00D488' : '#f59e0b' },
                ]}
              />
              <Text style={styles.cockpitStatusText}>
                {isGpsStreaming ? 'GPS TELEMETRY STREAMING' : 'TELEMETRY STANDBY'}
              </Text>
            </View>

            <Text style={styles.cockpitPlate}>
              {activeTrip.busRegistrationNumber} · {activeTrip.routeCode}
            </Text>
          </View>

          {/* Speedometer Gauge HUD */}
          <View style={styles.speedometerContainer}>
            <View style={styles.speedometerCircle}>
              <Text style={styles.speedLargeValue}>{currentSpeedKmH}</Text>
              <Text style={styles.speedUnitText}>KM / H</Text>
              <Text style={styles.speedLimitText}>HIGHWAY LIMIT: 60 KM/H</Text>
            </View>

            {/* Coordinates & Compass HUD */}
            <View style={styles.telemetryDataBox}>
              <View style={styles.telemetryDataRow}>
                <Text style={styles.dataLabel}>LATITUDE</Text>
                <Text style={styles.dataValue}>
                  {currentLatitude ? currentLatitude.toFixed(6) : '26.802300'}° N
                </Text>
              </View>
              <View style={styles.telemetryDataRow}>
                <Text style={styles.dataLabel}>LONGITUDE</Text>
                <Text style={styles.dataValue}>
                  {currentLongitude ? currentLongitude.toFixed(6) : '75.816600'}° E
                </Text>
              </View>
              <View style={styles.telemetryDataRow}>
                <Text style={styles.dataLabel}>BEARING / HEADING</Text>
                <Text style={styles.dataValue}>{currentHeading}° NNE</Text>
              </View>
              <View style={styles.telemetryDataRow}>
                <Text style={styles.dataLabel}>ACCURACY</Text>
                <Text style={styles.dataValue}>± 4.8 METERS</Text>
              </View>
            </View>
          </View>

          {/* Corridor Stoppage Pipeline Visualization */}
          <View style={styles.pipelineContainer}>
            <View style={styles.pipelineHeader}>
              <Text style={styles.pipelineTitle}>CORRIDOR TRANSIT PROGRESSION</Text>
              <TouchableOpacity onPress={onNavigateToStops}>
                <Text style={styles.pipelineActionText}>View Full Stops ➔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pipelineNodes}>
              {stops.map((stop, idx) => {
                const isPassed = completedStopIds.includes(stop.stopId);
                const isNext = stop.stopId === nextStop?.stopId;
                return (
                  <View key={stop.stopId} style={styles.nodeItem}>
                    <View
                      style={[
                        styles.nodeCircle,
                        isPassed && styles.nodePassed,
                        isNext && styles.nodeNext,
                      ]}
                    >
                      <Text style={styles.nodeSeqText}>{stop.sequenceNumber}</Text>
                    </View>
                    <Text
                      style={[
                        styles.nodeName,
                        isNext && { color: '#00D488', fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {stop.stopName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Last Ping Diagnostics */}
          <View style={styles.diagnosticsRow}>
            <Text style={styles.diagnosticsText}>
              Last Ping:{' '}
              {lastPingTimestamp
                ? new Date(lastPingTimestamp).toLocaleTimeString()
                : 'Awaiting first ping transmission'}
            </Text>
            {lastPingError && (
              <Text style={styles.diagnosticsErrorText}>{lastPingError}</Text>
            )}
          </View>

          {/* Driver Telemetry Controls (Strictly Driver-Only) */}
          <View style={styles.controlButtonsRow}>
            {isGpsStreaming ? (
              <Button
                title="Pause GPS Stream"
                variant="outline"
                size="md"
                onPress={stopGpsTelemetry}
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                title="Resume GPS Stream"
                variant="mint"
                size="md"
                icon="📡"
                onPress={startGpsTelemetry}
                style={{ flex: 1 }}
              />
            )}
            <Button
              title="Send Manual GPS Ping"
              variant="secondary"
              size="md"
              icon="📍"
              onPress={() => sendManualPing()}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : (
        <Card padding={32} style={[styles.emptyCard, { borderColor: colors.border }]}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🛰️</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Location Permission & Trip Required
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            No active commercial duty trip is assigned to your driver session. Telemetry
            radar transmission activates automatically when you start an assigned corridor trip.
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  speedPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  speedPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  radarCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 20,
  },
  cockpitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  cockpitBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicatorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cockpitStatusText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cockpitPlate: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  speedometerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 20,
  },
  speedometerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 4,
    borderColor: '#00D488',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 16px rgba(0, 212, 136, 0.4)' }
      : {
          shadowColor: '#00D488',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  speedLargeValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 60,
  },
  speedUnitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00D488',
    letterSpacing: 1,
    marginTop: 2,
  },
  speedLimitText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
  },
  telemetryDataBox: {
    minWidth: 260,
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  telemetryDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    fontVariant: ['tabular-nums'],
  },
  pipelineContainer: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipelineTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  pipelineActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00D488',
  },
  pipelineNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    overflow: 'hidden',
  },
  nodeItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePassed: {
    backgroundColor: '#00D488',
    borderColor: '#00D488',
  },
  nodeNext: {
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
  },
  nodeSeqText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  nodeName: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  diagnosticsRow: {
    gap: 4,
  },
  diagnosticsText: {
    fontSize: 11,
    color: '#64748b',
  },
  diagnosticsErrorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  controlButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
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
