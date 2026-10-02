import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Card, Badge, Button } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useResponsive } from '../../../theme/useResponsive';
import { useDriverStore } from '../../../stores/driver.store';
import { driverService } from '../../../services/driver.service';
import { TripTrajectoryResponse, LiveVehicleStateResponse } from '../../../types/driver.types';

interface DriverFullRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverFullRadarModal: React.FC<DriverFullRadarModalProps> = ({
  isOpen,
  onClose,
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
    currentAccuracy,
    lastPingTimestamp,
    lastPingError,
    startGpsTelemetry,
    stopGpsTelemetry,
    sendManualPing,
    completedStopIds,
  } = useDriverStore();

  const [trajectory, setTrajectory] = useState<TripTrajectoryResponse | null>(null);
  const [liveState, setLiveState] = useState<LiveVehicleStateResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPinging, setIsPinging] = useState(false);

  const stops = activeTrip?.stops || [];
  const nextStop =
    stops.find((s) => !completedStopIds.includes(s.stopId)) || stops[0];

  // Fetch real backend trajectory & live vehicle state
  const fetchLiveTrackingData = async () => {
    if (!activeTrip?.id) return;
    try {
      const [trajData, stateData] = await Promise.all([
        driverService.getTripTrajectory(activeTrip.id),
        driverService.getTripLiveState(activeTrip.id),
      ]);
      if (trajData) setTrajectory(trajData);
      if (stateData) setLiveState(stateData);
    } catch (err) {
      console.warn('Full Radar data refresh notice:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !activeTrip?.id) return;

    setIsLoadingData(true);
    fetchLiveTrackingData().finally(() => setIsLoadingData(false));

    // Poll authoritative backend every 4 seconds while modal is active
    const pollInterval = setInterval(() => {
      fetchLiveTrackingData();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [isOpen, activeTrip?.id]);

  const handleManualPing = async () => {
    setIsPinging(true);
    try {
      await sendManualPing();
      await fetchLiveTrackingData();
    } finally {
      setIsPinging(false);
    }
  };

  // Bus current coordinate (from store or liveState fallback)
  const busLat = currentLatitude ?? liveState?.state?.latitude ?? stops[0]?.latitude ?? 26.8023;
  const busLng = currentLongitude ?? liveState?.state?.longitude ?? stops[0]?.longitude ?? 75.8166;
  const busSpeed = currentSpeedKmH;
  const busHeading = currentHeading ?? liveState?.state?.heading ?? 0;

  // Trajectory crossed road points
  const crossedPoints = useMemo(() => {
    const pts = trajectory?.polyline ? [...trajectory.polyline] : [];
    // Ensure current bus position is the tip of the crossed line
    if (busLat && busLng) {
      pts.push({ latitude: busLat, longitude: busLng });
    }
    return pts;
  }, [trajectory, busLat, busLng]);

  // Compute map bounding box and coordinate projection
  const { minLat, maxLat, minLng, maxLng } = useMemo(() => {
    const allLats: number[] = [];
    const allLngs: number[] = [];

    stops.forEach((s) => {
      allLats.push(s.latitude);
      allLngs.push(s.longitude);
    });

    crossedPoints.forEach((p) => {
      allLats.push(p.latitude);
      allLngs.push(p.longitude);
    });

    if (allLats.length === 0) {
      allLats.push(26.8023);
      allLngs.push(75.8166);
    }

    const minLa = Math.min(...allLats);
    const maxLa = Math.max(...allLats);
    const minLn = Math.min(...allLngs);
    const maxLn = Math.max(...allLngs);

    const latPad = Math.max((maxLa - minLa) * 0.15, 0.008);
    const lngPad = Math.max((maxLn - minLn) * 0.15, 0.008);

    return {
      minLat: minLa - latPad,
      maxLat: maxLa + latPad,
      minLng: minLn - lngPad,
      maxLng: maxLn + lngPad,
    };
  }, [stops, crossedPoints]);

  // SVG dimensions
  const mapWidth = 720;
  const mapHeight = 440;

  const projectToMap = (lat: number, lng: number): { x: number; y: number } => {
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    // Normalizing between 0 and 1
    const normX = (lng - minLng) / lngSpan;
    const normY = (maxLat - lat) / latSpan; // Inverted Y for map coordinates

    // Center point
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;

    const rawX = 40 + normX * (mapWidth - 80);
    const rawY = 40 + normY * (mapHeight - 80);

    // Apply zoom around center
    const zoomedX = centerX + (rawX - centerX) * zoomLevel;
    const zoomedY = centerY + (rawY - centerY) * zoomLevel;

    return {
      x: Math.round(zoomedX),
      y: Math.round(zoomedY),
    };
  };

  // Build SVG polyline points string for nominal route
  const nominalRoutePath = useMemo(() => {
    if (stops.length < 2) return '';
    return stops
      .map((s) => {
        const pt = projectToMap(s.latitude, s.longitude);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  }, [stops, minLat, maxLat, minLng, maxLng, zoomLevel]);

  // Build SVG polyline points string for crossed road trajectory
  const crossedRoadPath = useMemo(() => {
    if (crossedPoints.length < 2) {
      if (stops.length >= 1 && busLat && busLng) {
        const startPt = projectToMap(stops[0].latitude, stops[0].longitude);
        const busPt = projectToMap(busLat, busLng);
        return `${startPt.x},${startPt.y} ${busPt.x},${busPt.y}`;
      }
      return '';
    }
    return crossedPoints
      .map((p) => {
        const pt = projectToMap(p.latitude, p.longitude);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  }, [crossedPoints, stops, busLat, busLng, minLat, maxLat, minLng, maxLng, zoomLevel]);

  const busPos = projectToMap(busLat, busLng);

  if (!isOpen) return null;

  return (
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: isLight ? '#0f172a' : '#050914',
            borderColor: '#00D488',
          },
        ]}
      >
        {/* 1. Modal Top Bar */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.radarIconBox}>
              <Text style={{ fontSize: 20 }}>🛰️</Text>
            </View>
            <View>
              <View style={styles.headerBadgeRow}>
                <Badge variant="mint" label="FULL RADAR LIVE" size="sm" />
                <Badge
                  variant={isGpsStreaming ? 'success' : 'warning'}
                  label={isGpsStreaming ? '● GPS STREAMING' : 'STANDBY'}
                  size="sm"
                />
                {liveState?.freshness && (
                  <Badge
                    variant={liveState.freshness === 'LIVE' ? 'mint' : 'neutral'}
                    label={`FRESHNESS: ${liveState.freshness}`}
                    size="sm"
                  />
                )}
              </View>
              <Text style={styles.headerTitle}>
                {activeTrip
                  ? `${activeTrip.routeCode} · ${activeTrip.origin} ➔ ${activeTrip.destination}`
                  : 'Corridor Highway Radar'}
              </Text>
              <Text style={styles.headerSub}>
                Vehicle: {activeTrip?.busRegistrationNumber || 'N/A'} · Highway Corridor Guidance
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Main Radar Map Canvas & HUD */}
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={styles.modalBodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Radar Visualizer Container */}
          <View style={styles.mapCard}>
            {/* High-Tech Grid & Map Controls */}
            <View style={styles.mapControlsRow}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: '#00D488' }]} />
                  <Text style={styles.legendText}>Road Crossed (Live Track)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLineDashed, { borderColor: '#64748b' }]} />
                  <Text style={styles.legendText}>Planned Route Corridor</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
                  <Text style={styles.legendText}>Bus Stops</Text>
                </View>
              </View>

              <View style={styles.zoomButtonsGroup}>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                >
                  <Text style={styles.zoomBtnText}>＋</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                >
                  <Text style={styles.zoomBtnText}>－</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.zoomBtn, { width: 'auto', paddingHorizontal: 10 }]}
                  onPress={() => setZoomLevel(1)}
                >
                  <Text style={styles.zoomBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SVG Visualizer Rendering */}
            <View style={styles.svgWrapper}>
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              >
                <defs>
                  {/* Grid Pattern */}
                  <pattern
                    id="radarGrid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(0, 212, 136, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>

                  {/* Glow filter for crossed road trajectory */}
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background Grid */}
                <rect width={mapWidth} height={mapHeight} fill="#060c18" />
                <rect width={mapWidth} height={mapHeight} fill="url(#radarGrid)" />

                {/* Radar Range Rings */}
                <circle
                  cx={mapWidth / 2}
                  cy={mapHeight / 2}
                  r="90"
                  fill="none"
                  stroke="rgba(0, 212, 136, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <circle
                  cx={mapWidth / 2}
                  cy={mapHeight / 2}
                  r="170"
                  fill="none"
                  stroke="rgba(0, 212, 136, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="6,6"
                />
                <line
                  x1={mapWidth / 2}
                  y1="0"
                  x2={mapWidth / 2}
                  y2={mapHeight}
                  stroke="rgba(0, 212, 136, 0.08)"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1={mapHeight / 2}
                  x2={mapWidth}
                  y2={mapHeight / 2}
                  stroke="rgba(0, 212, 136, 0.08)"
                  strokeWidth="1"
                />

                {/* 1. Planned Nominal Route Line (Dashed) */}
                {nominalRoutePath ? (
                  <polyline
                    points={nominalRoutePath}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.4)"
                    strokeWidth="3"
                    strokeDasharray="6,6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {/* 2. CROSSED ROAD TRACK LINE (Authoritative Trajectory Breadcrumbs) */}
                {crossedRoadPath ? (
                  <>
                    {/* Outer Glow Line */}
                    <polyline
                      points={crossedRoadPath}
                      fill="none"
                      stroke="rgba(0, 212, 136, 0.35)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#neonGlow)"
                    />
                    {/* Core Glowing Track */}
                    <polyline
                      points={crossedRoadPath}
                      fill="none"
                      stroke="#00D488"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : null}

                {/* 3. Stop Markers along Route */}
                {stops.map((stop, idx) => {
                  const pt = projectToMap(stop.latitude, stop.longitude);
                  const isPassed = completedStopIds.includes(stop.stopId);
                  const isNext = stop.stopId === nextStop?.stopId;

                  return (
                    <g key={stop.stopId || idx}>
                      {isNext && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="16"
                          fill="rgba(0, 212, 136, 0.25)"
                          stroke="#00D488"
                          strokeWidth="1.5"
                        />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="9"
                        fill={isPassed ? '#059669' : isNext ? '#00D488' : '#334155'}
                        stroke={isPassed ? '#34d399' : isNext ? '#ffffff' : '#94a3b8'}
                        strokeWidth="2"
                      />
                      <text
                        x={pt.x}
                        y={pt.y + 4}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {stop.sequenceNumber}
                      </text>
                      <text
                        x={pt.x}
                        y={pt.y + 22}
                        fill={isNext ? '#00D488' : '#cbd5e1'}
                        fontSize="10"
                        fontWeight={isNext ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {stop.stopName}
                      </text>
                    </g>
                  );
                })}

                {/* 4. LIVE BUS POSITION MARKER */}
                <g transform={`translate(${busPos.x}, ${busPos.y})`}>
                  {/* Radar Pulse Beacon */}
                  <circle
                    r="24"
                    fill="rgba(0, 212, 136, 0.18)"
                    stroke="rgba(0, 212, 136, 0.5)"
                    strokeWidth="1.5"
                  />
                  <circle
                    r="15"
                    fill="#00D488"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />

                  {/* Heading Indicator Arrow */}
                  <g transform={`rotate(${busHeading})`}>
                    <polygon
                      points="0,-18 5,-11 -5,-11"
                      fill="#ffffff"
                    />
                  </g>

                  {/* Center Bus Icon */}
                  <text
                    x="0"
                    y="4"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    🚌
                  </text>

                  {/* Live Speed Tag */}
                  <rect
                    x="-32"
                    y="-34"
                    width="64"
                    height="18"
                    rx="4"
                    fill="#090d16"
                    stroke="#00D488"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-21"
                    fill="#00D488"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {busSpeed} KM/H
                  </text>
                </g>
              </svg>
            </View>
          </View>

          {/* 3. Live Telemetry Cockpit Dashboard */}
          <View style={styles.hudSection}>
            {/* Speedometer Gauge HUD */}
            <Card
              padding={16}
              style={[
                styles.hudCard,
                { backgroundColor: '#090d16', borderColor: 'rgba(0, 212, 136, 0.3)' },
              ]}
            >
              <Text style={styles.hudCardLabel}>TELEMETRY COCKPIT</Text>

              <View style={styles.cockpitRow}>
                {/* Speed Dial */}
                <View style={styles.speedDial}>
                  <Text style={styles.speedLargeValue}>{busSpeed}</Text>
                  <Text style={styles.speedUnit}>KM / H</Text>
                  <Text style={styles.speedStatusText}>
                    {busSpeed === 0 ? 'STATIONARY (AT STOP/REST)' : 'IN HIGHWAY TRANSIT'}
                  </Text>
                </View>

                {/* Telemetry Metrics */}
                <View style={styles.metricsList}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>LATITUDE</Text>
                    <Text style={styles.metricValue}>
                      {busLat ? busLat.toFixed(6) : '26.802300'}° N
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>LONGITUDE</Text>
                    <Text style={styles.metricValue}>
                      {busLng ? busLng.toFixed(6) : '75.816600'}° E
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>BEARING / COMPASS</Text>
                    <Text style={styles.metricValue}>
                      {busHeading}° NNE
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>GPS ACCURACY</Text>
                    <Text style={styles.metricValue}>
                      ± {currentAccuracy.toFixed(1)} METERS
                    </Text>
                  </View>
                </View>
              </View>

              {/* Next Stop & ETA Row */}
              <View style={styles.nextStopBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextStopSub}>UPCOMING MILESTONE STOP:</Text>
                  <Text style={styles.nextStopTitle}>
                    📍 {nextStop ? nextStop.stopName : 'Depot Central Terminal'}
                  </Text>
                </View>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaText}>
                    {activeTrip?.status === 'IN_TRANSIT' ? 'ETA ~10m' : 'Trip Ready'}
                  </Text>
                </View>
              </View>

              {/* Last Ping Diagnostic Info */}
              <View style={styles.pingStatusRow}>
                <Text style={styles.pingStatusText}>
                  Last Server Ping:{' '}
                  {lastPingTimestamp
                    ? new Date(lastPingTimestamp).toLocaleTimeString()
                    : 'Awaiting ping'}
                  {' · '}
                  Trajectory Points: {crossedPoints.length}
                </Text>
                {lastPingError && (
                  <Text style={styles.pingErrorText}>{lastPingError}</Text>
                )}
              </View>
            </Card>

            {/* Telemetry Actions */}
            <View style={styles.actionsRow}>
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
                title={isPinging ? 'Transmitting Ping...' : 'Transmit Real GPS Ping'}
                variant="secondary"
                size="md"
                icon="📍"
                isLoading={isPinging}
                onPress={handleManualPing}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 960,
    maxHeight: '92vh' as any,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    display: 'flex' as any,
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 212, 136, 0.25)' as any,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radarIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    borderWidth: 1,
    borderColor: '#00D488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
    gap: 16,
  },
  mapCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.3)',
    backgroundColor: '#060c18',
    overflow: 'hidden',
  },
  mapControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  legendLineDashed: {
    width: 20,
    height: 0,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  zoomButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  svgWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
    backgroundColor: '#060c18',
  },
  hudSection: {
    gap: 12,
  },
  hudCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  hudCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D488',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cockpitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
  },
  speedDial: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 100,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(0, 212, 136, 0.05)',
    borderWidth: 2,
    borderColor: '#00D488',
  },
  speedLargeValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#00D488',
    lineHeight: 40,
  },
  speedUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  speedStatusText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 4,
    textAlign: 'center',
  },
  metricsList: {
    flex: 1,
    minWidth: 240,
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  nextStopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 136, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.2)',
  },
  nextStopSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D488',
    letterSpacing: 0.5,
  },
  nextStopTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  etaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#00D488',
  },
  etaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  pingStatusRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pingStatusText: {
    fontSize: 11,
    color: '#64748b',
  },
  pingErrorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
