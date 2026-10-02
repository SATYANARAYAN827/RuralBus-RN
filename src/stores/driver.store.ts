/**
 * Driver Experience State Store
 *
 * Manages driver duty lifecycle, assigned trips, telemetry streaming,
 * stop progression, and completed trip history.
 */

import { create } from 'zustand';
import {
  DriverDutyTrip,
  DriverHistoryResponse,
  DriverStop,
} from '../types';
import { driverService } from '../services/driver.service';

interface DriverState {
  // Duty State
  activeTrip: DriverDutyTrip | null;
  upcomingTrips: DriverDutyTrip[];
  history: DriverHistoryResponse | null;
  isLoadingDuty: boolean;
  isLoadingHistory: boolean;
  isActionLoading: boolean;
  dutyError: string | null;
  actionError: string | null;

  // Live GPS Telemetry State (Driver-Only)
  isGpsStreaming: boolean;
  currentSpeedKmH: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentHeading: number;
  currentAccuracy: number;
  lastPingTimestamp: string | null;
  lastPingError: string | null;
  telemetryTimerId: any | null;
  geolocationWatchId: number | null;

  // Stoppage Progression State
  completedStopIds: string[];
  tripDurationSeconds: number;
  durationTimerId: any | null;

  // Modals
  isSelectBusModalOpen: boolean;
  isEndTripConfirmOpen: boolean;
  isSosModalOpen: boolean;
  isFullRadarModalOpen: boolean;

  // Actions
  fetchDuty: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  startTrip: (tripId: string) => Promise<DriverDutyTrip>;
  endTrip: (tripId: string) => Promise<DriverDutyTrip>;
  startGpsTelemetry: () => void;
  stopGpsTelemetry: () => void;
  sendManualPing: (coords?: {
    latitude?: number;
    longitude?: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
  }) => Promise<void>;
  markStopPassed: (stopId: string) => void;
  resetDutyState: () => void;

  // Modal Setters
  setSelectBusModalOpen: (open: boolean) => void;
  setEndTripConfirmOpen: (open: boolean) => void;
  setSosModalOpen: (open: boolean) => void;
  setFullRadarModalOpen: (open: boolean) => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  activeTrip: null,
  upcomingTrips: [],
  history: null,
  isLoadingDuty: false,
  isLoadingHistory: false,
  isActionLoading: false,
  dutyError: null,
  actionError: null,

  isGpsStreaming: false,
  currentSpeedKmH: 0,
  currentLatitude: null,
  currentLongitude: null,
  currentHeading: 0,
  currentAccuracy: 5,
  lastPingTimestamp: null,
  lastPingError: null,
  telemetryTimerId: null,
  geolocationWatchId: null,

  completedStopIds: [],
  tripDurationSeconds: 0,
  durationTimerId: null,

  isSelectBusModalOpen: false,
  isEndTripConfirmOpen: false,
  isSosModalOpen: false,
  isFullRadarModalOpen: false,

  fetchDuty: async () => {
    set({ isLoadingDuty: true, dutyError: null });
    try {
      const data = await driverService.getDuty();
      const active = data.activeTrip;
      set({
        activeTrip: active,
        upcomingTrips: data.upcomingTrips || [],
        isLoadingDuty: false,
      });

      // If active trip is IN_TRANSIT and telemetry isn't running yet, initialize coordinates to first stop
      if (active && active.status === 'IN_TRANSIT') {
        const firstStop = active.stops?.[0];
        if (firstStop && get().currentLatitude === null) {
          set({
            currentLatitude: firstStop.latitude,
            currentLongitude: firstStop.longitude,
            currentSpeedKmH: 0,
          });
        }
      }
    } catch (err: any) {
      set({
        activeTrip: null,
        isLoadingDuty: false,
        dutyError: err.message || 'Failed to fetch assigned driver duty',
      });
    }
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const history = await driverService.getHistory();
      set({ history, isLoadingHistory: false });
    } catch {
      set({ isLoadingHistory: false });
    }
  },

  startTrip: async (tripId: string) => {
    set({ isActionLoading: true, actionError: null });
    try {
      let updatedTrip: DriverDutyTrip;
      try {
        updatedTrip = await driverService.startTrip(tripId);
      } catch (err: any) {
        const currentActive = get().activeTrip;
        if (currentActive && (tripId.startsWith('duty-') || currentActive.id === tripId)) {
          updatedTrip = {
            ...currentActive,
            status: 'IN_TRANSIT',
            actualDeparture: new Date().toISOString(),
          };
        } else {
          throw err;
        }
      }

      set({
        activeTrip: updatedTrip,
        isActionLoading: false,
      });

      // Start duration elapsed timer
      const existingTimer = get().durationTimerId;
      if (existingTimer) clearInterval(existingTimer);
      const timer = setInterval(() => {
        set((state) => ({ tripDurationSeconds: state.tripDurationSeconds + 1 }));
      }, 1000);
      set({ durationTimerId: timer });

      // Automatically engage GPS telemetry for the active run
      get().startGpsTelemetry();

      return updatedTrip;
    } catch (err: any) {
      set({
        isActionLoading: false,
        actionError: err.message || 'Failed to start trip duty',
      });
      throw err;
    }
  },

  endTrip: async (tripId: string) => {
    set({ isActionLoading: true, actionError: null });
    try {
      let completedTrip: DriverDutyTrip | null = null;
      try {
        completedTrip = await driverService.endTrip(tripId);
      } catch {
        const currentActive = get().activeTrip;
        if (currentActive) {
          completedTrip = {
            ...currentActive,
            status: 'COMPLETED',
            actualArrival: new Date().toISOString(),
          };
        }
      }

      // Stop timers and telemetry
      get().stopGpsTelemetry();
      const durTimer = get().durationTimerId;
      if (durTimer) {
        clearInterval(durTimer);
        set({ durationTimerId: null });
      }

      set({
        activeTrip: null,
        isActionLoading: false,
        isEndTripConfirmOpen: false,
      });

      // Refresh duty & history
      get().fetchDuty();
      get().fetchHistory();

      return completedTrip as DriverDutyTrip;
    } catch (err: any) {
      set({
        isActionLoading: false,
        actionError: err.message || 'Failed to end commercial trip duty',
      });
      throw err;
    }
  },

  startGpsTelemetry: () => {
    if (get().isGpsStreaming) return;

    set({ isGpsStreaming: true, lastPingError: null });

    // 1. Hook into real device/browser geolocation watchPosition
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const coords = pos.coords;
            let speedKmH = 0;
            // pos.coords.speed is in meters/second
            if (coords.speed !== null && !isNaN(coords.speed) && coords.speed > 0.3) {
              speedKmH = Math.round(coords.speed * 3.6);
            }
            const heading =
              coords.heading !== null && !isNaN(coords.heading)
                ? Math.round(coords.heading)
                : get().currentHeading;
            const lat = coords.latitude;
            const lon = coords.longitude;
            const accuracy = coords.accuracy || 5;

            set({
              currentLatitude: lat,
              currentLongitude: lon,
              currentSpeedKmH: speedKmH,
              currentHeading: heading,
              currentAccuracy: accuracy,
            });

            // Send authoritative ping with real GPS coordinates
            get()
              .sendManualPing({
                latitude: lat,
                longitude: lon,
                speed: speedKmH,
                heading,
                accuracy,
              })
              .catch(() => {});
          },
          (err) => {
            console.warn('Geolocation watch notice:', err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000,
          }
        );
      } catch (err) {
        console.warn('Error initiating geolocation watcher:', err);
      }
    }

    set({ geolocationWatchId: watchId });

    // 2. Initial trigger
    get().sendManualPing().catch(() => {});

    // 3. Periodic heartbeat stream (every 6 seconds) to maintain backend live vehicle cache
    const intervalId = setInterval(() => {
      get().sendManualPing().catch(() => {});
    }, 6000);

    set({ telemetryTimerId: intervalId });
  },

  stopGpsTelemetry: () => {
    const timer = get().telemetryTimerId;
    if (timer) {
      clearInterval(timer);
    }
    const watchId = get().geolocationWatchId;
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {}
    }
    set({
      isGpsStreaming: false,
      telemetryTimerId: null,
      geolocationWatchId: null,
      currentSpeedKmH: 0,
    });
  },

  sendManualPing: async (coords) => {
    const active = get().activeTrip;
    if (!active) return;

    // Only IN_TRANSIT trips accept telemetry pings on the Fastify backend
    if (active.status !== 'IN_TRANSIT') {
      set({
        lastPingError: "Trip is not active ('IN_TRANSIT'). Telemetry ping paused.",
      });
      return;
    }

    // Determine coordinates (from passed param, or from store state, or fallback)
    let lat = coords?.latitude ?? get().currentLatitude;
    let lon = coords?.longitude ?? get().currentLongitude;
    let speed = coords?.speed !== undefined ? Math.max(0, coords.speed) : (get().currentSpeedKmH || 0);
    let heading = coords?.heading !== undefined ? coords.heading : get().currentHeading;
    let accuracy = coords?.accuracy !== undefined ? coords.accuracy : (get().currentAccuracy || 5);

    // If coordinates are not yet set, query current browser position
    if ((lat === null || lon === null) && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
              if (pos.coords.speed !== null && !isNaN(pos.coords.speed) && pos.coords.speed > 0.3) {
                speed = Math.round(pos.coords.speed * 3.6);
              } else {
                speed = 0;
              }
              if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
                heading = Math.round(pos.coords.heading);
              }
              if (pos.coords.accuracy) {
                accuracy = pos.coords.accuracy;
              }
              resolve();
            },
            () => resolve(),
            { timeout: 3000, enableHighAccuracy: true }
          );
        });
      } catch {}
    }

    if (lat === null || lon === null) {
      const firstStop = active.stops?.[0];
      lat = firstStop?.latitude || 26.8023;
      lon = firstStop?.longitude || 75.8166;
      speed = 0;
    }

    try {
      const pingRes = await driverService.sendGpsPing({
        tripId: active.id,
        latitude: lat,
        longitude: lon,
        speed,
        heading,
        accuracy,
        timestamp: new Date().toISOString(),
      });

      set({
        currentLatitude: lat,
        currentLongitude: lon,
        currentSpeedKmH: speed,
        currentHeading: heading,
        currentAccuracy: accuracy,
        lastPingTimestamp: pingRes.recordedAt || new Date().toISOString(),
        lastPingError: null,
      });
    } catch (err: any) {
      set({
        lastPingError: err.message || 'GPS telemetry ping failed',
      });
    }
  },

  markStopPassed: (stopId: string) => {
    set((state) => {
      if (state.completedStopIds.includes(stopId)) return state;
      const nextCompleted = [...state.completedStopIds, stopId];
      // Update coordinates to this stop's location if available
      const stop = state.activeTrip?.stops.find((s) => s.stopId === stopId);
      return {
        completedStopIds: nextCompleted,
        currentLatitude: stop?.latitude ?? state.currentLatitude,
        currentLongitude: stop?.longitude ?? state.currentLongitude,
      };
    });
  },

  resetDutyState: () => {
    const telTimer = get().telemetryTimerId;
    if (telTimer) clearInterval(telTimer);

    const durTimer = get().durationTimerId;
    if (durTimer) clearInterval(durTimer);

    const watchId = get().geolocationWatchId;
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {}
    }

    set({
      activeTrip: null,
      upcomingTrips: [],
      history: null,
      isLoadingDuty: false,
      isLoadingHistory: false,
      isActionLoading: false,
      dutyError: null,
      actionError: null,
      isGpsStreaming: false,
      currentSpeedKmH: 0,
      currentLatitude: null,
      currentLongitude: null,
      currentHeading: 0,
      currentAccuracy: 5,
      lastPingTimestamp: null,
      lastPingError: null,
      telemetryTimerId: null,
      geolocationWatchId: null,
      completedStopIds: [],
      tripDurationSeconds: 0,
      durationTimerId: null,
      isSelectBusModalOpen: false,
      isEndTripConfirmOpen: false,
      isSosModalOpen: false,
      isFullRadarModalOpen: false,
    });
  },

  setSelectBusModalOpen: (open) => set({ isSelectBusModalOpen: open }),
  setEndTripConfirmOpen: (open) => set({ isEndTripConfirmOpen: open }),
  setSosModalOpen: (open) => set({ isSosModalOpen: open }),
  setFullRadarModalOpen: (open) => set({ isFullRadarModalOpen: open }),
}));
