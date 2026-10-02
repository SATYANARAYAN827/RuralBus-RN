/**
 * Driver Live Map & Navigation Radar Screen
 * Sleek, clean, driver-centric real-time GPS tracking HUD with watermark-free maps.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import L from 'leaflet';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useDriverStore } from '../../stores/driver.store';
import { driverService } from '../../services/driver.service';
import { TripTrajectoryResponse, LiveVehicleStateResponse } from '../../types/driver.types';

interface DriverMapScreenProps {
  onOpenSos: () => void;
  onNavigateToStops: () => void;
}

type MapLayerType = 'OSM' | 'DARK' | 'LIGHT';

const CARTO_API_KEY = 'cb1_4339_1_2378aef1763217e4a00c045a';

const MAP_LAYERS: Record<MapLayerType, { url: string; attribution: string; subdomains?: string }> = {
  OSM: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  DARK: {
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
  },
  LIGHT: {
    url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
  },
};

export const DriverMapScreen: React.FC<DriverMapScreenProps> = ({
  onOpenSos,
  onNavigateToStops,
}) => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeTrip,
    isGpsStreaming,
    currentSpeedKmH,
    currentLatitude,
    currentLongitude,
    currentHeading,
    currentAccuracy,
    lastPingError,
    startGpsTelemetry,
    stopGpsTelemetry,
    sendManualPing,
    completedStopIds,
  } = useDriverStore();

  const [trajectory, setTrajectory] = useState<TripTrajectoryResponse | null>(null);
  const [liveState, setLiveState] = useState<LiveVehicleStateResponse | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<MapLayerType>('OSM');
  const [isPinging, setIsPinging] = useState(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const crossedPolylineRef = useRef<L.Polyline | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);

  const stops = activeTrip?.stops || [];
  const nextStop =
    stops.find((s) => !completedStopIds.includes(s.stopId)) || stops[0];

  // Coordinates
  const busLat = currentLatitude ?? liveState?.state?.latitude ?? stops[0]?.latitude ?? 20.2961;
  const busLng = currentLongitude ?? liveState?.state?.longitude ?? stops[0]?.longitude ?? 85.8245;
  const busSpeed = currentSpeedKmH;
  const busHeading = currentHeading ?? liveState?.state?.heading ?? 0;

  // Real Trajectory Points
  const crossedPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (trajectory?.polyline && trajectory.polyline.length > 0) {
      trajectory.polyline.forEach((p) => {
        pts.push([p.latitude, p.longitude]);
      });
    }
    if (busLat && busLng) {
      pts.push([busLat, busLng]);
    }
    return pts;
  }, [trajectory, busLat, busLng]);

  // 1. Automatically acquire and watch device's real physical GPS location on mount
  useEffect(() => {
    // Start store GPS telemetry (watchPosition)
    startGpsTelemetry();

    // Query browser geolocation immediately with high accuracy
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, speed, heading, accuracy } = pos.coords;
          useDriverStore.setState({
            currentLatitude: latitude,
            currentLongitude: longitude,
            currentSpeedKmH: speed ? Math.round(speed * 3.6) : 0,
            currentHeading: heading || 0,
            currentAccuracy: accuracy || 5,
          });

          // Immediately pan map to real user position
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
          }
        },
        (err) => {
          console.warn('Geolocation acquisition notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }

    return () => {
      stopGpsTelemetry();
    };
  }, [startGpsTelemetry, stopGpsTelemetry]);

  // Fetch live tracking data from backend
  const fetchLiveTrackingData = async () => {
    if (!activeTrip?.id) return;
    try {
      const [trajData, stateData] = await Promise.all([
        driverService.getTripTrajectory(activeTrip.id),
        driverService.getTripLiveState(activeTrip.id),
      ]);
      if (trajData) setTrajectory(trajData);
      if (stateData) setLiveState(stateData);
    } catch {
      // Background poll silently continues
    }
  };

  useEffect(() => {
    if (!activeTrip?.id) return;
    fetchLiveTrackingData();
    const pollInterval = setInterval(() => {
      fetchLiveTrackingData();
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [activeTrip?.id]);

  // Inject Leaflet CSS + Custom Map Styles
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('leaflet-css-bundle')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-bundle';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('ruralbus-clean-map-styles')) {
      const style = document.createElement('style');
      style.id = 'ruralbus-clean-map-styles';
      style.innerHTML = `
        .custom-bus-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .bus-pulse-ring {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 212, 136, 0.25);
          animation: busPulse 2s ease-out infinite;
        }
        .bus-marker-core {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #00D488;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          z-index: 10;
        }
        @keyframes busPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .clean-stop-badge {
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background: #1e293b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        .clean-stop-badge-next {
          background: #00D488;
          color: #000000;
          border-color: #000000;
          transform: scale(1.15);
        }
        .clean-stop-badge-passed {
          background: #94a3b8;
          opacity: 0.7;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = busLat;
    const initialLng = busLng;
    const layerConfig = MAP_LAYERS[selectedLayer];

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      subdomains: layerConfig.subdomains || 'abc',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Switch Map Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const layerConfig = MAP_LAYERS[selectedLayer];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      subdomains: layerConfig.subdomains || 'abc',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [selectedLayer]);

  // Render Route Polyline & Stop Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Route Polyline
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }
    if (stops.length >= 2) {
      const stopLatLngs: [number, number][] = stops.map((s) => [s.latitude, s.longitude]);
      const routeLine = L.polyline(stopLatLngs, {
        color: '#64748b',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.65,
      }).addTo(map);
      routePolylineRef.current = routeLine;
    }

    // 2. Stop Markers
    stopMarkersRef.current.forEach((m) => map.removeLayer(m));
    stopMarkersRef.current = [];

    stops.forEach((stop) => {
      const isPassed = completedStopIds.includes(stop.stopId);
      const isNext = stop.stopId === nextStop?.stopId;

      const badgeClass = isNext
        ? 'clean-stop-badge clean-stop-badge-next'
        : isPassed
        ? 'clean-stop-badge clean-stop-badge-passed'
        : 'clean-stop-badge';

      const stopIcon = L.divIcon({
        className: 'custom-stop-div-icon',
        html: `<div class="${badgeClass}">${stop.sequenceNumber}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .bindPopup(
          `<strong>${stop.sequenceNumber}. ${stop.stopName}</strong><br/>` +
          `Status: ${isPassed ? 'Passed' : isNext ? 'Approaching Next' : 'Scheduled'}`
        )
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });
  }, [stops, completedStopIds, nextStop?.stopId]);

  // Trajectory breadcrumb line
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (crossedPolylineRef.current) {
      map.removeLayer(crossedPolylineRef.current);
    }

    if (crossedPoints.length >= 2) {
      const trackLine = L.polyline(crossedPoints, {
        color: '#00D488',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      crossedPolylineRef.current = trackLine;
    }
  }, [crossedPoints]);

  // Bus Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentPos: [number, number] = [busLat, busLng];

    const vehicleHtml = `
      <div class="custom-bus-marker">
        <div class="bus-pulse-ring"></div>
        <div class="bus-marker-core" style="transform: rotate(${busHeading}deg);">
          🚍
        </div>
      </div>
    `;

    const vehicleIcon = L.divIcon({
      className: 'custom-bus-wrapper',
      html: vehicleHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!busMarkerRef.current) {
      const marker = L.marker(currentPos, { icon: vehicleIcon })
        .bindPopup(
          `<strong>${activeTrip?.busRegistrationNumber || 'Bus on Route'}</strong><br/>` +
          `Speed: ${busSpeed} KM/H<br/>` +
          `Next: ${nextStop ? nextStop.stopName : 'Depot'}`
        )
        .addTo(map);
      busMarkerRef.current = marker;
    } else {
      busMarkerRef.current.setLatLng(currentPos);
      busMarkerRef.current.setIcon(vehicleIcon);
    }
  }, [busLat, busLng, busHeading, busSpeed, activeTrip, nextStop]);

  const handleRecenter = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          useDriverStore.setState({
            currentLatitude: latitude,
            currentLongitude: longitude,
          });
          mapInstanceRef.current?.setView([latitude, longitude], 16, { animate: true });
        },
        () => {
          mapInstanceRef.current?.setView([busLat, busLng], 16, { animate: true });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      mapInstanceRef.current?.setView([busLat, busLng], 16, { animate: true });
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleManualPing = async () => {
    setIsPinging(true);
    try {
      await sendManualPing();
      await fetchLiveTrackingData();
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Sleek Modern Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isLight ? '#ffffff' : '#0f172a',
            borderBottomColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.busBadge}>
            <Text style={styles.busBadgeIcon}>🚌</Text>
            <Text style={styles.busBadgeText}>
              {activeTrip?.busRegistrationNumber || 'TEST-01'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Speed badge */}
            <View style={styles.speedBadge}>
              <Text style={styles.speedValue}>{busSpeed}</Text>
              <Text style={styles.speedUnit}>KM/H</Text>
            </View>

            {/* GPS Status */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isGpsStreaming
                    ? 'rgba(0, 212, 136, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                },
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: isGpsStreaming ? '#00D488' : '#f59e0b' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isGpsStreaming ? '#059669' : '#d97706' },
                ]}
              >
                {isGpsStreaming ? 'Live' : 'Standby'}
              </Text>
            </View>

            {/* SOS Button */}
            <TouchableOpacity
              style={styles.sosButton}
              onPress={onOpenSos}
              activeOpacity={0.8}
            >
              <Text style={styles.sosText}>🚨 SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Route Corridor Sub-bar */}
        <View style={styles.headerRouteRow}>
          <Text
            style={[styles.routeCodeText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {activeTrip?.routeCode ? `${activeTrip.routeCode} · ` : 'CR-01 · '}
            {activeTrip ? `${activeTrip.origin} ➔ ${activeTrip.destination}` : 'State Rural Corridor'}
          </Text>
        </View>
      </View>

      {/* 2. Map Canvas */}
      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          <div
            ref={mapContainerRef as any}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          />
        ) : (
          <View style={styles.mobileFallback}>
            <Text style={{ color: '#ffffff' }}>Live Map Loaded</Text>
          </View>
        )}

        {/* Floating Map Controls (Top Right) */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[styles.floatingBtn, { backgroundColor: isLight ? '#ffffff' : '#1e293b' }]}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingIcon}>🎯</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingBtn, { backgroundColor: isLight ? '#ffffff' : '#1e293b' }]}
            onPress={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingIcon}>🗺️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingBtn, { backgroundColor: isLight ? '#ffffff' : '#1e293b' }]}
            onPress={handleZoomIn}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingIcon}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingBtn, { backgroundColor: isLight ? '#ffffff' : '#1e293b' }]}
            onPress={handleZoomOut}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingIcon}>－</Text>
          </TouchableOpacity>
        </View>

        {/* Map Layer Menu */}
        {isLayerMenuOpen && (
          <View
            style={[
              styles.layerMenu,
              {
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)',
              },
            ]}
          >
            <Text style={[styles.layerMenuHeading, { color: colors.textSecondary }]}>MAP STYLE</Text>
            {[
              { id: 'OSM', label: '🗺️ OpenStreetMap' },
              { id: 'DARK', label: '🌙 Dark Mode' },
              { id: 'LIGHT', label: '☀️ Light Clean' },
            ].map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerMenuItem,
                  selectedLayer === layer.id && styles.layerMenuItemActive,
                ]}
                onPress={() => {
                  setSelectedLayer(layer.id as MapLayerType);
                  setIsLayerMenuOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.layerMenuText,
                    { color: selectedLayer === layer.id ? '#00D488' : colors.textPrimary },
                  ]}
                >
                  {layer.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 3. Driver Live Navigation HUD Card (Bottom) */}
        <View
          style={[
            styles.driverHudCard,
            {
              bottom: isMobile ? 8 : 16,
              padding: isMobile ? 12 : 14,
              backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
              borderColor: isLight ? '#e2e8f0' : 'rgba(0, 212, 136, 0.3)',
            },
          ]}
        >
          {/* Next Stop Info */}
          <View style={styles.hudTopRow}>
            <View style={styles.nextStopBox}>
              <Text style={styles.nextStopLabel}>NEXT SCHEDULED STOP</Text>
              <View style={styles.nextStopTitleRow}>
                <Text style={styles.stopIconText}>📍</Text>
                <Text
                  style={[styles.nextStopName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {nextStop ? nextStop.stopName : 'Depot Central'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.viewStopsBtn,
                {
                  backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
              onPress={onNavigateToStops}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewStopsText, { color: colors.textPrimary }]}>
                📋 All Stops ({stops.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Telemetry Indicators */}
          <View style={styles.hudStatsRow}>
            <View style={styles.hudStatItem}>
              <Text style={styles.statLabel}>SPEED</Text>
              <Text style={[styles.statValue, { color: '#00D488' }]}>{busSpeed} km/h</Text>
            </View>

            <View style={styles.hudStatItem}>
              <Text style={styles.statLabel}>ACCURACY</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                ± {Math.round(currentAccuracy)}m
              </Text>
            </View>

            <View style={styles.hudStatItem}>
              <Text style={styles.statLabel}>PROGRESS</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {completedStopIds.length} / {stops.length} Stops
              </Text>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.hudActionsRow}>
            <TouchableOpacity
              style={[styles.pingBtn, isPinging && { opacity: 0.7 }]}
              onPress={handleManualPing}
              disabled={isPinging}
              activeOpacity={0.8}
            >
              <Text style={styles.pingBtnText}>
                {isPinging ? '📡 Transmitting...' : '📍 Send GPS Location Ping'}
              </Text>
            </TouchableOpacity>

            {isGpsStreaming ? (
              <TouchableOpacity
                style={[styles.streamToggleBtn, { borderColor: colors.inputBorder }]}
                onPress={stopGpsTelemetry}
                activeOpacity={0.8}
              >
                <Text style={[styles.streamToggleText, { color: colors.textSecondary }]}>
                  ⏸ Pause
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.streamToggleBtn,
                  { borderColor: '#00D488', backgroundColor: 'rgba(0, 212, 136, 0.1)' },
                ]}
                onPress={startGpsTelemetry}
                activeOpacity={0.8}
              >
                <Text style={[styles.streamToggleText, { color: '#00D488' }]}>
                  ▶ Resume
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {lastPingError && (
            <Text style={styles.pingErrorNotice}>⚠️ {lastPingError}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    position: 'relative',
  },
  headerBar: {
    flexDirection: 'column',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
    zIndex: 100,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  busBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00D488',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  busBadgeIcon: {
    fontSize: 13,
  },
  busBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCodeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    borderWidth: 1,
    borderColor: '#00D488',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  speedValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  speedUnit: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sosButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  sosText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  mapCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  mobileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1000,
    gap: 6,
  },
  floatingBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingIcon: {
    fontSize: 14,
  },
  layerMenu: {
    position: 'absolute',
    top: 12,
    right: 54,
    zIndex: 1001,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    minWidth: 160,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  layerMenuHeading: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  layerMenuItem: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  layerMenuItemActive: {
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
  },
  layerMenuText: {
    fontSize: 11,
    fontWeight: '600',
  },
  driverHudCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: 480,
    alignSelf: 'center',
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
  },
  nextStopBox: {
    flex: 1,
  },
  nextStopLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  nextStopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopIconText: {
    fontSize: 14,
  },
  nextStopName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  viewStopsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  viewStopsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hudStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  hudStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  hudActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pingBtn: {
    flex: 1,
    backgroundColor: '#00D488',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
  },
  streamToggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamToggleText: {
    fontWeight: '800',
    fontSize: 11,
  },
  pingErrorNotice: {
    fontSize: 10,
    color: '#ef4444',
    textAlign: 'center',
  },
});
