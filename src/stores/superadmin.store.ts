/**
 * Super Admin / Platform Admin Zustand State Store
 *
 * Authoritative client-side state management for:
 * - Platform operator listing, creation, update, deletion
 * - Platform-wide staff listing, status management, deletion
 * - Super Admin profile
 *
 * HARD INVARIANTS:
 * - No GPS / tracking / telemetry / radar / map / location state.
 * - Passwords, tokens, and JWTs are never stored or logged.
 * - Errors always propagate to the UI.
 * - No fake/demo data.
 * - PLATFORM_ADMIN authorization enforced by backend.
 */

import { create } from 'zustand';
import type {
  PlatformOperator,
  CreateOperatorInput,
  UpdateOperatorInput,
  PlatformStaffMember,
  CreatePlatformStaffInput,
  UpdatePlatformStaffInput,
  SuperAdminProfile,
  PlatformDashboardSummary,
} from '../types/superadmin.types';
import { superAdminService } from '../services/superadmin.service';

interface SuperAdminState {
  // 1. Dashboard Summary (derived from operator list)
  dashboardSummary: PlatformDashboardSummary | null;

  // 2. Operators
  operators: PlatformOperator[];
  operatorSearchQuery: string;
  operatorStatusFilter: 'ALL' | 'ACTIVE' | 'SUSPENDED';
  isLoadingOperators: boolean;
  operatorError: string | null;
  editingOperator: PlatformOperator | null;
  setOperatorSearchQuery: (q: string) => void;
  setOperatorStatusFilter: (s: 'ALL' | 'ACTIVE' | 'SUSPENDED') => void;
  setEditingOperator: (op: PlatformOperator | null) => void;
  fetchOperators: () => Promise<void>;
  createOperator: (data: CreateOperatorInput) => Promise<boolean>;
  updateOperator: (tenantId: string, data: UpdateOperatorInput) => Promise<boolean>;
  deleteOperator: (tenantId: string) => Promise<boolean>;

  // 3. Platform Staff
  staff: PlatformStaffMember[];
  totalStaff: number;
  activeDriversCount: number;
  activeConductorsCount: number;
  staffRoleFilter: 'ALL' | 'DRIVER' | 'CONDUCTOR';
  staffSearchQuery: string;
  staffTenantFilter: string; // tenantId to filter staff
  isLoadingStaff: boolean;
  staffError: string | null;
  editingStaff: PlatformStaffMember | null;
  setStaffRoleFilter: (role: 'ALL' | 'DRIVER' | 'CONDUCTOR') => void;
  setStaffSearchQuery: (q: string) => void;
  setStaffTenantFilter: (tenantId: string) => void;
  setEditingStaff: (staff: PlatformStaffMember | null) => void;
  fetchStaff: () => Promise<void>;
  createStaff: (data: CreatePlatformStaffInput) => Promise<boolean>;
  updateStaff: (staffId: string, data: UpdatePlatformStaffInput) => Promise<boolean>;
  updateStaffStatus: (staffId: string, isActive: boolean) => Promise<boolean>;
  deleteStaff: (staffId: string) => Promise<boolean>;

  // 4. Super Admin Profile
  profile: SuperAdminProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  fetchProfile: () => Promise<void>;

  // 5. Modal state
  isAddOperatorModalOpen: boolean;
  setIsAddOperatorModalOpen: (open: boolean) => void;
  isEditOperatorModalOpen: boolean;
  setIsEditOperatorModalOpen: (open: boolean) => void;
  isDeleteOperatorConfirmId: string | null;
  setIsDeleteOperatorConfirmId: (id: string | null) => void;

  isAddStaffModalOpen: boolean;
  setIsAddStaffModalOpen: (open: boolean) => void;
  isEditStaffModalOpen: boolean;
  setIsEditStaffModalOpen: (open: boolean) => void;
  isDeleteStaffConfirmId: string | null;
  setIsDeleteStaffConfirmId: (id: string | null) => void;

  // 6. Cleanup
  resetAllState: () => void;
}

const computeDashboard = (operators: PlatformOperator[]): PlatformDashboardSummary => ({
  totalOperators: operators.length,
  activeOperators: operators.filter((o) => o.status === 'ACTIVE').length,
  suspendedOperators: operators.filter((o) => o.status === 'SUSPENDED').length,
  totalBuses: operators.reduce((sum, o) => sum + (o.busesCount || 0), 0),
  totalStaff: operators.reduce((sum, o) => sum + (o.staffCount || 0), 0),
});

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  // 1. Dashboard
  dashboardSummary: null,

  // 2. Operators
  operators: [],
  operatorSearchQuery: '',
  operatorStatusFilter: 'ALL',
  isLoadingOperators: false,
  operatorError: null,
  editingOperator: null,
  setOperatorSearchQuery: (q) => set({ operatorSearchQuery: q }),
  setOperatorStatusFilter: (s) => set({ operatorStatusFilter: s }),
  setEditingOperator: (op) => set({ editingOperator: op }),

  fetchOperators: async () => {
    set({ isLoadingOperators: true, operatorError: null });
    try {
      const operators = await superAdminService.listOperators();
      set({
        operators,
        dashboardSummary: computeDashboard(operators),
        isLoadingOperators: false,
      });
    } catch (err: any) {
      set({ operatorError: err.message || 'Failed to load operators', isLoadingOperators: false });
    }
  },

  createOperator: async (data) => {
    set({ isLoadingOperators: true, operatorError: null });
    try {
      await superAdminService.createOperator(data);
      await get().fetchOperators();
      return true;
    } catch (err: any) {
      set({ operatorError: err.message || 'Failed to create operator', isLoadingOperators: false });
      return false;
    }
  },

  updateOperator: async (tenantId, data) => {
    set({ isLoadingOperators: true, operatorError: null });
    try {
      await superAdminService.updateOperator(tenantId, data);
      await get().fetchOperators();
      return true;
    } catch (err: any) {
      set({ operatorError: err.message || 'Failed to update operator', isLoadingOperators: false });
      return false;
    }
  },

  deleteOperator: async (tenantId) => {
    set({ isLoadingOperators: true, operatorError: null });
    try {
      await superAdminService.deleteOperator(tenantId);
      await get().fetchOperators();
      return true;
    } catch (err: any) {
      set({ operatorError: err.message || 'Failed to delete operator', isLoadingOperators: false });
      return false;
    }
  },

  // 3. Staff
  staff: [],
  totalStaff: 0,
  activeDriversCount: 0,
  activeConductorsCount: 0,
  staffRoleFilter: 'ALL',
  staffSearchQuery: '',
  staffTenantFilter: '',
  isLoadingStaff: false,
  staffError: null,
  editingStaff: null,
  setStaffRoleFilter: (role) => {
    set({ staffRoleFilter: role });
    get().fetchStaff();
  },
  setStaffSearchQuery: (q) => set({ staffSearchQuery: q }),
  setStaffTenantFilter: (tenantId) => {
    set({ staffTenantFilter: tenantId });
    get().fetchStaff();
  },
  setEditingStaff: (staff) => set({ editingStaff: staff }),

  fetchStaff: async () => {
    const { staffRoleFilter, staffSearchQuery, staffTenantFilter } = get();
    set({ isLoadingStaff: true, staffError: null });
    try {
      const query: { tenantId?: string; role?: 'DRIVER' | 'CONDUCTOR'; search?: string } = {};
      if (staffTenantFilter) query.tenantId = staffTenantFilter;
      if (staffRoleFilter !== 'ALL') query.role = staffRoleFilter;
      if (staffSearchQuery.trim()) query.search = staffSearchQuery.trim();

      const res = await superAdminService.listStaff(query);
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

  createStaff: async (data) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      await superAdminService.createStaff(data);
      await get().fetchStaff();
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to create staff member', isLoadingStaff: false });
      return false;
    }
  },

  updateStaff: async (staffId, data) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      await superAdminService.updateStaff(staffId, data);
      await get().fetchStaff();
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to update staff member', isLoadingStaff: false });
      return false;
    }
  },

  updateStaffStatus: async (staffId, isActive) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      await superAdminService.updateStaffStatus(staffId, isActive);
      await get().fetchStaff();
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to update staff status', isLoadingStaff: false });
      return false;
    }
  },

  deleteStaff: async (staffId) => {
    set({ isLoadingStaff: true, staffError: null });
    try {
      await superAdminService.deleteStaff(staffId);
      await get().fetchStaff();
      return true;
    } catch (err: any) {
      set({ staffError: err.message || 'Failed to delete staff member', isLoadingStaff: false });
      return false;
    }
  },

  // 4. Profile
  profile: null,
  isLoadingProfile: false,
  profileError: null,
  fetchProfile: async () => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const profile = await superAdminService.getProfile();
      set({ profile, isLoadingProfile: false });
    } catch (err: any) {
      set({ profileError: err.message || 'Failed to load profile', isLoadingProfile: false });
    }
  },

  // 5. Modals
  isAddOperatorModalOpen: false,
  setIsAddOperatorModalOpen: (open) => set({ isAddOperatorModalOpen: open }),
  isEditOperatorModalOpen: false,
  setIsEditOperatorModalOpen: (open) => set({ isEditOperatorModalOpen: open }),
  isDeleteOperatorConfirmId: null,
  setIsDeleteOperatorConfirmId: (id) => set({ isDeleteOperatorConfirmId: id }),

  isAddStaffModalOpen: false,
  setIsAddStaffModalOpen: (open) => set({ isAddStaffModalOpen: open }),
  isEditStaffModalOpen: false,
  setIsEditStaffModalOpen: (open) => set({ isEditStaffModalOpen: open }),
  isDeleteStaffConfirmId: null,
  setIsDeleteStaffConfirmId: (id) => set({ isDeleteStaffConfirmId: id }),

  // 6. Cleanup
  resetAllState: () => {
    set({
      dashboardSummary: null,
      operators: [],
      operatorSearchQuery: '',
      operatorStatusFilter: 'ALL',
      isLoadingOperators: false,
      operatorError: null,
      editingOperator: null,
      staff: [],
      totalStaff: 0,
      activeDriversCount: 0,
      activeConductorsCount: 0,
      staffRoleFilter: 'ALL',
      staffSearchQuery: '',
      staffTenantFilter: '',
      isLoadingStaff: false,
      staffError: null,
      editingStaff: null,
      profile: null,
      isLoadingProfile: false,
      profileError: null,
      isAddOperatorModalOpen: false,
      isEditOperatorModalOpen: false,
      isDeleteOperatorConfirmId: null,
      isAddStaffModalOpen: false,
      isEditStaffModalOpen: false,
      isDeleteStaffConfirmId: null,
    });
  },
}));
