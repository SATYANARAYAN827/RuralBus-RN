/**
 * Conductor Experience State Store
 *
 * Manages conductor duty lifecycle, passenger manifest, boarding transitions,
 * QR ticket validation, cash ticketing POS, shift statistics, and offline sync.
 */

import { create } from 'zustand';
import {
  DriverDutyTrip,
  ManifestPassenger,
  ConductorStatsResponse,
  TicketValidationResult,
  DigitalTicketPayload,
  OfflineCashTicketPayload,
  ConductorCashSettlementReport,
  IssuedCashReceipt,
} from '../types';
import { conductorService } from '../services/conductor.service';

interface ConductorState {
  // Duty State
  activeTrip: DriverDutyTrip | null;
  totalBookedSeats: number;
  totalBoardedSeats: number;
  totalAwaitingSeats: number;
  totalSeats: number;
  isLoadingDuty: boolean;
  dutyError: string | null;

  // Passenger Manifest State
  manifest: ManifestPassenger[];
  isLoadingManifest: boolean;
  manifestError: string | null;
  manifestSearch: string;
  manifestFilter: 'ALL' | 'BOARDED' | 'WAITING';

  // Ticket Validation State
  scanStatus: 'IDLE' | 'SCANNING' | 'VALID' | 'DUPLICATE' | 'INVALID';
  scannedTicket: DigitalTicketPayload | null;
  scanMessage: string | null;
  manualTicketInput: string;
  isValidatingTicket: boolean;

  // Cash POS State
  fromStop: string;
  toStop: string;
  unitFare: number;
  passengerCount: number;
  totalFare: number;
  isIssuingCashTicket: boolean;
  cashTicketError: string | null;
  issuedReceipt: IssuedCashReceipt | null;

  // Stats & Settlement
  stats: ConductorStatsResponse | null;
  settlement: ConductorCashSettlementReport | null;
  isLoadingStats: boolean;
  isLoadingSettlement: boolean;

  // Safe Offline Queue
  offlineQueue: OfflineCashTicketPayload[];
  isSyncingQueue: boolean;
  queueSyncMessage: string | null;

  // Modals
  isReceiptModalOpen: boolean;
  isValidationModalOpen: boolean;

  // Actions
  fetchDuty: () => Promise<void>;
  fetchManifest: (tripId?: string) => Promise<void>;
  toggleBoarding: (ticketId: string) => Promise<boolean>;
  setManifestSearch: (query: string) => void;
  setManifestFilter: (filter: 'ALL' | 'BOARDED' | 'WAITING') => void;

  validateTicket: (qrOrCode: string) => Promise<TicketValidationResult>;
  resetScanState: () => void;
  setManualTicketInput: (text: string) => void;

  setFromStop: (stopName: string) => void;
  setToStop: (stopName: string) => void;
  setUnitFare: (fare: number) => void;
  setPassengerCount: (count: number) => void;
  issueCashTicket: () => Promise<IssuedCashReceipt>;
  clearIssuedReceipt: () => void;

  fetchStats: () => Promise<void>;
  fetchSettlement: (tripId?: string) => Promise<void>;

  queueOfflineTicket: (ticket: OfflineCashTicketPayload) => void;
  syncOfflineQueue: () => Promise<void>;

  setReceiptModalOpen: (open: boolean) => void;
  setValidationModalOpen: (open: boolean) => void;
  resetConductorState: () => void;
}

export const useConductorStore = create<ConductorState>((set, get) => ({
  // Duty Initial State
  activeTrip: null,
  totalBookedSeats: 0,
  totalBoardedSeats: 0,
  totalAwaitingSeats: 0,
  totalSeats: 0,
  isLoadingDuty: false,
  dutyError: null,

  // Manifest Initial State
  manifest: [],
  isLoadingManifest: false,
  manifestError: null,
  manifestSearch: '',
  manifestFilter: 'ALL',

  // Scanner Initial State
  scanStatus: 'IDLE',
  scannedTicket: null,
  scanMessage: null,
  manualTicketInput: '',
  isValidatingTicket: false,

  // Cash POS Initial State
  fromStop: '',
  toStop: '',
  unitFare: 50,
  passengerCount: 1,
  totalFare: 50,
  isIssuingCashTicket: false,
  cashTicketError: null,
  issuedReceipt: null,

  // Stats & Settlement Initial State
  stats: null,
  settlement: null,
  isLoadingStats: false,
  isLoadingSettlement: false,

  // Offline Queue Initial State
  offlineQueue: [],
  isSyncingQueue: false,
  queueSyncMessage: null,

  // Modals Initial State
  isReceiptModalOpen: false,
  isValidationModalOpen: false,

  // Actions
  fetchDuty: async () => {
    set({ isLoadingDuty: true, dutyError: null });
    try {
      const data = await conductorService.getDuty();
      const active = data.activeTrip;
      set({
        activeTrip: active,
        totalBookedSeats: data.totalBookedSeats,
        totalBoardedSeats: data.totalBoardedSeats,
        totalAwaitingSeats: data.totalAwaitingSeats,
        totalSeats: data.totalSeats,
        isLoadingDuty: false,
      });

      // If active trip is available, initialize POS stops from route
      if (active) {
        if (!get().fromStop) {
          set({ fromStop: active.origin });
        }
        if (!get().toStop) {
          set({ toStop: active.destination });
        }
        // Also fetch manifest automatically for the active trip
        get().fetchManifest(active.id).catch(() => {});
      }
    } catch (err: any) {
      set({
        activeTrip: null,
        isLoadingDuty: false,
        dutyError: err.message || 'Failed to fetch assigned conductor duty',
      });
    }
  },

  fetchManifest: async (tripIdParam?: string) => {
    const tripId = tripIdParam || get().activeTrip?.id;
    if (!tripId) return;

    set({ isLoadingManifest: true, manifestError: null });
    try {
      const data = await conductorService.getManifest(tripId);
      set({
        manifest: data.passengers || [],
        totalBookedSeats: data.totalBookedSeats,
        totalBoardedSeats: data.totalBoardedSeats,
        totalAwaitingSeats: data.totalAwaitingSeats,
        isLoadingManifest: false,
      });
    } catch (err: any) {
      set({
        isLoadingManifest: false,
        manifestError: err.message || 'Failed to load passenger manifest',
      });
    }
  },

  toggleBoarding: async (ticketId: string) => {
    const active = get().activeTrip;
    if (!active?.id) {
      throw new Error('No active trip assigned');
    }

    const passenger = get().manifest.find((p) => p.ticketId === ticketId);
    if (!passenger) {
      throw new Error('Passenger not found in manifest');
    }

    const nextIsBoarded = !passenger.isBoarded;

    try {
      const res = await conductorService.updateBoardingStatus(
        active.id,
        ticketId,
        nextIsBoarded
      );

      // Update local manifest state accurately based on server response
      set((state) => {
        const updated = state.manifest.map((p) =>
          p.ticketId === ticketId
            ? {
                ...p,
                isBoarded: res.isBoarded,
                status: res.isBoarded ? ('BOARDED' as const) : ('CONFIRMED' as const),
              }
            : p
        );
        const boardedCount = updated.filter((p) => p.isBoarded).length;
        return {
          manifest: updated,
          totalBoardedSeats: boardedCount,
          totalAwaitingSeats: updated.length - boardedCount,
        };
      });

      return res.isBoarded;
    } catch (err: any) {
      // Backend error propagates; do not fake success
      throw err;
    }
  },

  setManifestSearch: (query: string) => {
    set({ manifestSearch: query });
  },

  setManifestFilter: (filter: 'ALL' | 'BOARDED' | 'WAITING') => {
    set({ manifestFilter: filter });
  },

  validateTicket: async (qrOrCode: string) => {
    if (!qrOrCode || !qrOrCode.trim()) {
      throw new Error('Please enter or scan a valid QR code payload');
    }

    set({ isValidatingTicket: true, scanStatus: 'SCANNING' });

    try {
      const res = await conductorService.validateQrTicket(qrOrCode.trim());

      if (res.alreadyBoarded) {
        set({
          scanStatus: 'DUPLICATE',
          scannedTicket: res.ticket || null,
          scanMessage: res.message || 'Duplicate Scan: Passenger already boarded',
          isValidatingTicket: false,
          isValidationModalOpen: true,
        });
      } else if (res.valid) {
        set({
          scanStatus: 'VALID',
          scannedTicket: res.ticket || null,
          scanMessage: res.message || 'Boarding Confirmed: Ticket valid',
          isValidatingTicket: false,
          isValidationModalOpen: true,
        });

        // Update local manifest if ticket is present
        if (res.ticket?.ticketId) {
          const tId = res.ticket.ticketId;
          set((state) => ({
            manifest: state.manifest.map((m) =>
              m.ticketId === tId
                ? { ...m, isBoarded: true, status: 'BOARDED' as const }
                : m
            ),
          }));
        }
      } else {
        set({
          scanStatus: 'INVALID',
          scannedTicket: null,
          scanMessage: res.message || 'Invalid or Expired Ticket',
          isValidatingTicket: false,
          isValidationModalOpen: true,
        });
      }

      return res;
    } catch (err: any) {
      set({
        scanStatus: 'INVALID',
        scannedTicket: null,
        scanMessage: err.message || 'Ticket validation failed on server',
        isValidatingTicket: false,
        isValidationModalOpen: true,
      });
      throw err;
    }
  },

  resetScanState: () => {
    set({
      scanStatus: 'IDLE',
      scannedTicket: null,
      scanMessage: null,
      manualTicketInput: '',
      isValidatingTicket: false,
      isValidationModalOpen: false,
    });
  },

  setManualTicketInput: (text: string) => {
    set({ manualTicketInput: text });
  },

  setFromStop: (stopName: string) => {
    set({ fromStop: stopName });
  },

  setToStop: (stopName: string) => {
    set({ toStop: stopName });
  },

  setUnitFare: (fare: number) => {
    set((state) => ({
      unitFare: fare,
      totalFare: fare * state.passengerCount,
    }));
  },

  setPassengerCount: (count: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    set((state) => ({
      passengerCount: validCount,
      totalFare: state.unitFare * validCount,
    }));
  },

  issueCashTicket: async () => {
    const state = get();
    const trip = state.activeTrip;
    if (!trip?.id) {
      throw new Error('No active trip assigned for cash ticket issuance');
    }

    const { fromStop, toStop, passengerCount, unitFare, totalFare } = state;
    if (!fromStop || !toStop) {
      throw new Error('Boarding stop and dropping stop are required');
    }

    set({ isIssuingCashTicket: true, cashTicketError: null });

    const ticketCode = `CSH-${Date.now().toString().slice(-6)}`;

    try {
      const res = await conductorService.issueCashTicket({
        tripId: trip.id,
        fromStopName: fromStop,
        toStopName: toStop,
        passengerCount,
        unitFare,
        fareAmount: totalFare,
        ticketCode,
      });

      const receipt: IssuedCashReceipt = {
        ticketId: res.ticketId,
        ticketCode,
        fromStopName: fromStop,
        toStopName: toStop,
        passengerCount,
        unitFare,
        fareAmount: totalFare,
        issuedAt: new Date().toISOString(),
        synced: res.synced,
      };

      set({
        issuedReceipt: receipt,
        isIssuingCashTicket: false,
        isReceiptModalOpen: true,
      });

      // Refresh manifest to reflect newly issued cash passenger
      get().fetchManifest(trip.id).catch(() => {});

      return receipt;
    } catch (err: any) {
      set({
        isIssuingCashTicket: false,
        cashTicketError: err.message || 'Failed to issue cash ticket',
      });
      throw err;
    }
  },

  clearIssuedReceipt: () => {
    set({ issuedReceipt: null, isReceiptModalOpen: false });
  },

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      const stats = await conductorService.getStats();
      set({ stats, isLoadingStats: false });
    } catch {
      set({ isLoadingStats: false });
    }
  },

  fetchSettlement: async (tripIdParam?: string) => {
    const tripId = tripIdParam || get().activeTrip?.id;
    if (!tripId) return;

    set({ isLoadingSettlement: true });
    try {
      const settlement = await conductorService.getCashSettlement(tripId);
      set({ settlement, isLoadingSettlement: false });
    } catch {
      set({ isLoadingSettlement: false });
    }
  },

  queueOfflineTicket: (ticket: OfflineCashTicketPayload) => {
    set((state) => ({
      offlineQueue: [...state.offlineQueue, ticket],
    }));
  },

  syncOfflineQueue: async () => {
    const state = get();
    const trip = state.activeTrip;
    if (!trip?.id || state.offlineQueue.length === 0 || state.isSyncingQueue) {
      return;
    }

    set({ isSyncingQueue: true, queueSyncMessage: 'Synchronizing offline tickets...' });

    try {
      const res = await conductorService.syncOfflineBatch(
        trip.id,
        'mobile-conductor-app',
        state.offlineQueue
      );

      set({
        offlineQueue: [],
        isSyncingQueue: false,
        queueSyncMessage: `Synced ${res.syncedCount} offline cash tickets`,
      });

      // Refresh manifest after batch sync
      get().fetchManifest(trip.id).catch(() => {});
    } catch (err: any) {
      set({
        isSyncingQueue: false,
        queueSyncMessage: err.message || 'Failed to synchronize offline batch',
      });
    }
  },

  setReceiptModalOpen: (open: boolean) => {
    set({ isReceiptModalOpen: open });
  },

  setValidationModalOpen: (open: boolean) => {
    set({ isValidationModalOpen: open });
  },

  resetConductorState: () => {
    set({
      activeTrip: null,
      totalBookedSeats: 0,
      totalBoardedSeats: 0,
      totalAwaitingSeats: 0,
      totalSeats: 0,
      isLoadingDuty: false,
      dutyError: null,
      manifest: [],
      isLoadingManifest: false,
      manifestError: null,
      manifestSearch: '',
      manifestFilter: 'ALL',
      scanStatus: 'IDLE',
      scannedTicket: null,
      scanMessage: null,
      manualTicketInput: '',
      isValidatingTicket: false,
      fromStop: '',
      toStop: '',
      unitFare: 50,
      passengerCount: 1,
      totalFare: 50,
      isIssuingCashTicket: false,
      cashTicketError: null,
      issuedReceipt: null,
      stats: null,
      settlement: null,
      isLoadingStats: false,
      isLoadingSettlement: false,
      offlineQueue: [],
      isSyncingQueue: false,
      queueSyncMessage: null,
      isReceiptModalOpen: false,
      isValidationModalOpen: false,
    });
  },
}));
