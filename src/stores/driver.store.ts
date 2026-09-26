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
  lastPingTimestamp: string | null;
  lastPingError: string | null;
  telemetryTimerId: any | null;

  // Stoppage Progression State
  completedStopIds: string[];
  tripDurationSeconds: number;
  durationTimerId: any | null;

  // Modals
  isSelectBusModalOpen: boolean;
  isEndTripConfirmOpen: boolean;
  isSosModalOpen: boolean;

  // Actions
  fetchDuty: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  startTrip: (tripId: string) => Promise<DriverDutyTrip>;
  endTrip: (tripId: string) => Promise<DriverDutyTrip>;
  startGpsTelemetry: () => void;
  stopGpsTelemetry: () => void;
  sendManualPing: (coords?: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }) => Promise<void>;
  markStopPassed: (stopId: string) => void;
  resetDutyState: () => void;

  // Modal Setters
  setSelectBusModalOpen: (open: boolean) => void;
  setEndTripConfirmOpen: (open: boolean) => void;
  setSosModalOpen: (open: boolean) => void;
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
  lastPingTimestamp: null,
  lastPingError: null,
  telemetryTimerId: null,

  completedStopIds: [],
  tripDurationSeconds: 0,
  durationTimerId: null,

  isSelectBusModalOpen: false,
  isEndTripConfirmOpen: false,
  isSosModalOpen: false,

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

      // If active trip is IN_TRANSIT and telemetry isn't running yet, initialize telemetry coordinates
      if (active && active.status === 'IN_TRANSIT') {
        const firstStop = active.stops?.[0];
        if (firstStop && get().currentLatitude === null) {
          set({
            currentLatitude: firstStop.latitude,
            currentLongitude: firstStop.longitude,
            currentSpeedKmH: 42,
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
      const updatedTrip = await driverService.startTrip(tripId);
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
      const completedTrip = await driverService.endTrip(tripId);

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

      return completedTrip;
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

    // Initial ping
    get().sendManualPing().catch(() => {});

    // Periodic telemetry stream every 8 seconds
    const intervalId = setInterval(() => {
      get().sendManualPing().catch(() => {});
    }, 8000);

    set({ telemetryTimerId: intervalId });
  },

  stopGpsTelemetry: () => {
    const timer = get().telemetryTimerId;
    if (timer) {
      clearInterval(timer);
    }
    set({
      isGpsStreaming: false,
      telemetryTimerId: null,
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

    // Determine coordinates (from passed param, or from stop route interpolation)
    let lat = coords?.latitude ?? get().currentLatitude;
    let lon = coords?.longitude ?? get().currentLongitude;
    let speed = coords?.speed ?? (Math.floor(Math.random() * 25) + 35); // 35-60 km/h
    let heading = coords?.heading ?? (get().currentHeading + 5) % 360;

    if (lat === null || lon === null) {
      const firstStop = active.stops?.[0];
      lat = firstStop?.latitude || 26.8023;
      lon = firstStop?.longitude || 75.8166;
    }

    try {
      const pingRes = await driverService.sendGpsPing({
        tripId: active.id,
        latitude: lat,
        longitude: lon,
        speed,
        heading,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      });

      set({
        currentLatitude: lat,
        currentLongitude: lon,
        currentSpeedKmH: speed,
        currentHeading: heading,
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
      lastPingTimestamp: null,
      lastPingError: null,
      telemetryTimerId: null,
      completedStopIds: [],
      tripDurationSeconds: 0,
      durationTimerId: null,
      isSelectBusModalOpen: false,
      isEndTripConfirmOpen: false,
      isSosModalOpen: false,
    });
  },

  setSelectBusModalOpen: (open) => set({ isSelectBusModalOpen: open }),
  setEndTripConfirmOpen: (open) => set({ isEndTripConfirmOpen: open }),
  setSosModalOpen: (open) => set({ isSosModalOpen: open }),
}));
