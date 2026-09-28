/**
 * Operator Admin / Fleet Owner Zustand State Store
 *
 * Authoritative client-side state management for:
 * - Operations Overview KPI counters
 * - Fleet Bus management & staff assignments
 * - Live Fleet Radar (tenant-scoped)
 * - Driver/Conductor Staff roster & credentials
 * - Corridor Routes & Stops sequence
 * - Daily Trips & Dispatch scheduling
 * - Revenue analytics & collections
 * - Operator Company profile
 */

import { create } from 'zustand';
import type {
  FleetBus,
  CreateBusInput,
  UpdateBusInput,
  StaffMember,
  CreateStaffInput,
  UpdateStaffInput,
  FleetRoute,
  CreateRouteInput,
  StopItem,
  CreateStopInput,
  OperatorTrip,
  DispatchTripInput,
  TripStatus,
  OperatorRevenueReport,
  LiveFleetBus,
  OperatorProfile,
  UpdateOperatorProfileInput,
} from '../types/operator.types';
import { operatorService } from '../services/operator.service';

interface OperatorState {
  // 1. Overview & Revenue
  revenueReport: OperatorRevenueReport | null;
  isLoadingRevenue: boolean;
  revenueError: string | null;
  fetchRevenue: () => Promise<void>;

  // 2. Company Profile
  profile: OperatorProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateOperatorProfileInput) => Promise<boolean>;

  // 3. Fleet Buses
  buses: FleetBus[];
  totalBuses: number;
  activeBusesCount: number;
  maintenanceBusesCount: number;
  busStatusFilter: 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'PENDING_APPROVAL' | 'DECOMMISSIONED';
  busSearchQuery: string;
  isLoadingBuses: boolean;
  busError: string | null;
  setBusStatusFilter: (status: 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'PENDING_APPROVAL' | 'DECOMMISSIONED') => void;
  setBusSearchQuery: (query: string) => void;
  fetchBuses: () => Promise<void>;
  registerBus: (input: CreateBusInput) => Promise<boolean>;
  updateBus: (busId: string, input: UpdateBusInput) => Promise<boolean>;
  decommissionBus: (busId: string) => Promise<boolean>;

  // 4. Live Fleet Radar
  radarBuses: LiveFleetBus[];
  radarTotalActive: number;
  radarLastUpdated: string | null;
  isLoadingRadar: boolean;
  radarError: string | null;
  selectedRadarBus: LiveFleetBus | null;
  setSelectedRadarBus: (bus: LiveFleetBus | null) => void;
  fetchFleetRadar: () => Promise<void>;

  // 5. Staff Roster
  staff: StaffMember[];
  totalStaff: number;
  activeDriversCount: number;
  activeConductorsCount: number;
  staffRoleFilter: 'ALL' | 'DRIVER' | 'CONDUCTOR';
  staffSearchQuery: string;
  isLoadingStaff: boolean;
  staffError: string | null;
  setStaffRoleFilter: (role: 'ALL' | 'DRIVER' | 'CONDUCTOR') => void;
  setStaffSearchQuery: (query: string) => void;
  fetchStaff: () => Promise<void>;
  createStaff: (input: CreateStaffInput) => Promise<boolean>;
  updateStaff: (staffId: string, input: UpdateStaffInput) => Promise<boolean>;
  assignStaffToBus: (staffId: string, busId: string | null) => Promise<boolean>;
  updateStaffStatus: (staffId: string, isActive: boolean) => Promise<boolean>;
  resetStaffPassword: (staffId: string, newPassword: string) => Promise<boolean>;
  deleteStaff: (staffId: string) => Promise<boolean>;

  // 6. Routes & Stops
  routes: FleetRoute[];
  totalRoutes: number;
  routeSearchQuery: string;
  selectedRoute: FleetRoute | null;
  stops: StopItem[];
  isLoadingRoutes: boolean;
  routeError: string | null;
  setRouteSearchQuery: (query: string) => void;
  setSelectedRoute: (route: FleetRoute | null) => void;
  fetchRoutes: () => Promise<void>;
  fetchStops: () => Promise<void>;
  createRoute: (input: CreateRouteInput) => Promise<boolean>;
  createStop: (input: CreateStopInput) => Promise<boolean>;

  // 7. Trips & Dispatch
  trips: OperatorTrip[];
  totalTrips: number;
  tripStatusFilter: 'ALL' | 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  tripSearchQuery: string;
  isLoadingTrips: boolean;
  tripError: string | null;
  setTripStatusFilter: (status: 'ALL' | 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED') => void;
  setTripSearchQuery: (query: string) => void;
  fetchTrips: () => Promise<void>;
  dispatchTrip: (input: DispatchTripInput) => Promise<boolean>;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<boolean>;

  // Modals & UI Controls
  isAddBusModalOpen: boolean;
  setIsAddBusModalOpen: (open: boolean) => void;
  isEditBusModalOpen: boolean;
  setIsEditBusModalOpen: (open: boolean) => void;
  editingBus: FleetBus | null;
  setEditingBus: (bus: FleetBus | null) => void;

  isAddStaffModalOpen: boolean;
  setIsAddStaffModalOpen: (open: boolean) => void;
  isEditStaffModalOpen: boolean;
  setIsEditStaffModalOpen: (open: boolean) => void;
  editingStaff: StaffMember | null;
  setEditingStaff: (staff: StaffMember | null) => void;

  isResetPasswordModalOpen: boolean;
  setIsResetPasswordModalOpen: (open: boolean) => void;
  resetPasswordStaff: StaffMember | null;
  setResetPasswordStaff: (staff: StaffMember | null) => void;

  isDispatchTripModalOpen: boolean;
  setIsDispatchTripModalOpen: (open: boolean) => void;

  isAddRouteModalOpen: boolean;
  setIsAddRouteModalOpen: (open: boolean) => void;

  isAddStopModalOpen: boolean;
  setIsAddStopModalOpen: (open: boolean) => void;

  // Cleanup & Logout
  resetAllState: () => void;
}

export const useOperatorStore = create<OperatorState>((set, get) => ({
  // 1. Revenue
  revenueReport: null,
  isLoadingRevenue: false,
  revenueError: null,
  fetchRevenue: async () => {
    set({ isLoadingRevenue: true, revenueError: null });
    try {
      const data = await operatorService.getRevenue();
      set({ revenueReport: data, isLoadingRevenue: false });
    } catch (err: any) {
      set({ revenueError: err.message || 'Failed to load revenue data', isLoadingRevenue: false });
    }
  },

  // 2. Profile
  profile: null,
  isLoadingProfile: false,
  profileError: null,
  fetchProfile: async () => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const profile = await operatorService.getProfile();
      set({ profile, isLoadingProfile: false });
    } catch (err: any) {
      set({ profileError: err.message || 'Failed to load profile', isLoadingProfile: false });
    }
  },
  updateProfile: async (data: UpdateOperatorProfileInput) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const updated = await operatorService.updateProfile(data);
      set({ profile: updated, isLoadingProfile: false });
      return true;
    } catch (err: any) {
      set({ profileError: err.message || 'Failed to update profile', isLoadingProfile: false });
      return false;
    }
  },

  // 3. Fleet Buses
  buses: [],
  totalBuses: 0,
  activeBusesCount: 0,
  maintenanceBusesCount: 0,
  busStatusFilter: 'ALL',
  busSearchQuery: '',
  isLoadingBuses: false,
  busError: null,
  setBusStatusFilter: (status) => {
    set({ busStatusFilter: status });
    get().fetchBuses();
  },
  setBusSearchQuery: (query) => {
    set({ busSearchQuery: query });
  },
  fetchBuses: async () => {
    const { busStatusFilter, busSearchQuery } = get();
    set({ isLoadingBuses: true, busError: null });
    try {
      const query: { status?: string; search?: string } = {};
      if (busStatusFilter !== 'ALL') query.status = busStatusFilter;
      if (busSearchQuery.trim()) query.search = busSearchQuery.trim();

      const res = await operatorService.getBuses(query);
      set({
        buses: res.buses,
        totalBuses: res.total,
        activeBusesCount: res.activeCount,
        maintenanceBusesCount: res.maintenanceCount,
        isLoadingBuses: false,
      });
    } catch (err: any) {
      set({ busError: err.message || 'Failed to load buses', isLoadingBuses: false });
    }
  },
  registerBus: async (input) => {
    set({ isLoadingBuses: true, busError: null });
    try {
      await operatorService.createBus(input);
      await get().fetchBuses();
      return true;
    } catch (err: any) {
      set({ busError: err.message || 'Failed to register bus', isLoadingBuses: false });
      return false;
    }
  },
  updateBus: async (busId, input) => {
    set({ isLoadingBuses: true, busError: null });
    try {
      await operatorService.updateBus(busId, input);
      await Promise.all([get().fetchBuses(), get().fetchStaff()]);
      return true;
    } catch (err: any) {
      set({ busError: err.message || 'Failed to update bus', isLoadingBuses: false });
      return false;
    }
  },
  decommissionBus: async (busId) => {
    set({ isLoadingBuses: true, busError: null });
    try {
      await operatorService.decommissionBus(busId);
      await get().fetchBuses();
      return true;
    } catch (err: any) {
      set({ busError: err.message || 'Failed to decommission bus', isLoadingBuses: false });
      return false;
    }
  },

  // 4. Live Fleet Radar
  radarBuses: [],
  radarTotalActive: 0,
  radarLastUpdated: null,
  isLoadingRadar: false,
  radarError: null,
  selectedRadarBus: null,
  setSelectedRadarBus: (bus) => set({ selectedRadarBus: bus }),
  fetchFleetRadar: async () => {
    set({ isLoadingRadar: true, radarError: null });
    try {
      const radar = await operatorService.getFleetRadar();
      set({
        radarBuses: radar.buses || [],
        radarTotalActive: radar.totalActive || (radar.buses ? radar.buses.length : 0),
        radarLastUpdated: radar.lastUpdated || new Date().toISOString(),
        isLoadingRadar: false,
      });
    } catch (err: any) {
      set({ radarError: err.message || 'Failed to fetch fleet radar', isLoadingRadar: false });
    }
  },

  // 5. Staff Roster
  staff: [],
  totalStaff: 0,
  activeDriversCount: 0,
  activeConductorsCount: 0,
  staffRoleFilter: 'ALL',
  staffSearchQuery: '',
  isLoadingStaff: false,
  staffError: null,
  setStaffRoleFilter: (role) => {
    set({ staffRoleFilter: role });
    get().fetchStaff();
  },
  setStaffSearchQuery: (query) => {
    set({ staffSearchQuery: query });
  },
  fetchStaff: async () => {
    const { staffRoleFilter, staffSearchQuery } = get();
    set({ isLoadingStaff: true, staffError: null });
    try {
      const query: { role?: 'DRIVER' | 'CONDUCTOR'; search?: string } = {};
      if (staffRoleFilter !== 'ALL') query.role = staffRoleFilter;
      if (staffSearchQuery.trim()) query.search = staffSearchQuery.trim();

      const res = await operatorService.getStaff(query);
      set({
        staff: res.staff,
        totalStaff: res.total,
        activeDriversCount: res.activeDrivers,
        activeConductorsCount: res.activeConductors,
        isLoadingStaff: false,
      });
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to load staff roster', isLoadingStaff: false });
    }
  },
  createStaff: async (input) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      await operatorService.createStaff(input);
      await get().fetchStaff();
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to add staff member', isLoadingStaff: false });
      return false;
    }
  },
  updateStaff: async (staffId, input) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      const realId = get().staff.find((s) => s.id === staffId || s.userId === staffId)?.id || staffId;
      await operatorService.updateStaff(realId, input);
      await Promise.all([get().fetchStaff(), get().fetchBuses()]);
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to update staff member', isLoadingStaff: false });
      return false;
    }
  },
  assignStaffToBus: async (staffId, busId) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      const realId = get().staff.find((s) => s.id === staffId || s.userId === staffId)?.id || staffId;
      await operatorService.updateStaff(realId, { busId });
      await Promise.all([get().fetchStaff(), get().fetchBuses()]);
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to assign staff to vehicle', isLoadingStaff: false });
      return false;
    }
  },
  updateStaffStatus: async (staffId, isActive) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      const realId = get().staff.find((s) => s.id === staffId || s.userId === staffId)?.id || staffId;
      await operatorService.updateStaffStatus(realId, isActive);
      await get().fetchStaff();
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to update staff status', isLoadingStaff: false });
      return false;
    }
  },
  resetStaffPassword: async (staffId, newPassword) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      const realId = get().staff.find((s) => s.id === staffId || s.userId === staffId)?.id || staffId;
      await operatorService.resetStaffPassword(realId, newPassword);
      set({ isLoadingStaff: false });
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to reset staff password', isLoadingStaff: false });
      return false;
    }
  },
  deleteStaff: async (staffId) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      const realId = get().staff.find((s) => s.id === staffId || s.userId === staffId)?.id || staffId;
      await operatorService.deleteStaff(realId);
      await Promise.all([get().fetchStaff(), get().fetchBuses()]);
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to delete staff member', isLoadingStaff: false });
      return false;
    }
  },

  // 6. Routes & Stops
  routes: [],
  totalRoutes: 0,
  routeSearchQuery: '',
  selectedRoute: null,
  stops: [],
  isLoadingRoutes: false,
  routeError: null,
  setRouteSearchQuery: (query) => set({ routeSearchQuery: query }),
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  fetchRoutes: async () => {
    const { routeSearchQuery } = get();
    set({ isLoadingRoutes: true, routeError: null });
    try {
      const res = await operatorService.getRoutes({ search: routeSearchQuery.trim() || undefined });
      set({
        routes: res.routes,
        totalRoutes: res.total,
        isLoadingRoutes: false,
      });
    } catch (err: any) {
      set({ routeError: err.message || 'Failed to load routes', isLoadingRoutes: false });
    }
  },
  fetchStops: async () => {
    try {
      const res = await operatorService.getStops();
      set({ stops: res.stops });
    } catch (_err) {
      // Non-fatal if stops fails
    }
  },
  createRoute: async (input) => {
    set({ isLoadingRoutes: true, routeError: null });
    try {
      await operatorService.createRoute(input);
      await get().fetchRoutes();
      return true;
    } catch (err: any) {
      set({ routeError: err.message || 'Failed to create route', isLoadingRoutes: false });
      return false;
    }
  },
  createStop: async (input) => {
    try {
      await operatorService.createStop(input);
      await get().fetchStops();
      return true;
    } catch (err: any) {
      set({ routeError: err.message || 'Failed to create stop' });
      return false;
    }
  },

  // 7. Trips & Dispatch
  trips: [],
  totalTrips: 0,
  tripStatusFilter: 'ALL',
  tripSearchQuery: '',
  isLoadingTrips: false,
  tripError: null,
  setTripStatusFilter: (status) => {
    set({ tripStatusFilter: status });
    get().fetchTrips();
  },
  setTripSearchQuery: (query) => set({ tripSearchQuery: query }),
  fetchTrips: async () => {
    const { tripStatusFilter } = get();
    set({ isLoadingTrips: true, tripError: null });
    try {
      const query: { status?: TripStatus } = {};
      if (tripStatusFilter !== 'ALL') query.status = tripStatusFilter;

      const res = await operatorService.getTrips(query);
      set({
        trips: res.trips,
        totalTrips: res.total,
        isLoadingTrips: false,
      });
    } catch (err: any) {
      set({ tripError: err.message || 'Failed to load trips', isLoadingTrips: false });
    }
  },
  dispatchTrip: async (input) => {
    set({ isLoadingTrips: true, tripError: null });
    try {
      await operatorService.dispatchTrip(input);
      await get().fetchTrips();
      return true;
    } catch (err: any) {
      set({ tripError: err.message || 'Failed to dispatch trip', isLoadingTrips: false });
      return false;
    }
  },
  updateTripStatus: async (tripId, status) => {
    set({ isLoadingTrips: true, tripError: null });
    try {
      await operatorService.updateTripStatus(tripId, status);
      await get().fetchTrips();
      return true;
    } catch (err: any) {
      set({ tripError: err.message || 'Failed to update trip status', isLoadingTrips: false });
      return false;
    }
  },

  // Modals & UI Controls
  isAddBusModalOpen: false,
  setIsAddBusModalOpen: (open) => set({ isAddBusModalOpen: open }),
  isEditBusModalOpen: false,
  setIsEditBusModalOpen: (open) => set({ isEditBusModalOpen: open }),
  editingBus: null,
  setEditingBus: (bus) => set({ editingBus: bus }),

  isAddStaffModalOpen: false,
  setIsAddStaffModalOpen: (open) => set({ isAddStaffModalOpen: open }),
  isEditStaffModalOpen: false,
  setIsEditStaffModalOpen: (open) => set({ isEditStaffModalOpen: open }),
  editingStaff: null,
  setEditingStaff: (staff) => set({ editingStaff: staff }),

  isResetPasswordModalOpen: false,
  setIsResetPasswordModalOpen: (open) => set({ isResetPasswordModalOpen: open }),
  resetPasswordStaff: null,
  setResetPasswordStaff: (staff) => set({ resetPasswordStaff: staff }),

  isDispatchTripModalOpen: false,
  setIsDispatchTripModalOpen: (open) => set({ isDispatchTripModalOpen: open }),

  isAddRouteModalOpen: false,
  setIsAddRouteModalOpen: (open) => set({ isAddRouteModalOpen: open }),

  isAddStopModalOpen: false,
  setIsAddStopModalOpen: (open) => set({ isAddStopModalOpen: open }),

  // Cleanup
  resetAllState: () => {
    set({
      revenueReport: null,
      isLoadingRevenue: false,
      revenueError: null,
      profile: null,
      isLoadingProfile: false,
      profileError: null,
      buses: [],
      totalBuses: 0,
      activeBusesCount: 0,
      maintenanceBusesCount: 0,
      busStatusFilter: 'ALL',
      busSearchQuery: '',
      isLoadingBuses: false,
      busError: null,
      radarBuses: [],
      radarTotalActive: 0,
      radarLastUpdated: null,
      isLoadingRadar: false,
      radarError: null,
      selectedRadarBus: null,
      staff: [],
      totalStaff: 0,
      activeDriversCount: 0,
      activeConductorsCount: 0,
      staffRoleFilter: 'ALL',
      staffSearchQuery: '',
      isLoadingStaff: false,
      staffError: null,
      routes: [],
      totalRoutes: 0,
      routeSearchQuery: '',
      selectedRoute: null,
      stops: [],
      isLoadingRoutes: false,
      routeError: null,
      trips: [],
      totalTrips: 0,
      tripStatusFilter: 'ALL',
      tripSearchQuery: '',
      isLoadingTrips: false,
      tripError: null,
      isAddBusModalOpen: false,
      isEditBusModalOpen: false,
      editingBus: null,
      isAddStaffModalOpen: false,
      isEditStaffModalOpen: false,
      editingStaff: null,
      isResetPasswordModalOpen: false,
      resetPasswordStaff: null,
      isDispatchTripModalOpen: false,
      isAddRouteModalOpen: false,
      isAddStopModalOpen: false,
    });
  },
}));
