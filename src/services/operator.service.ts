/**
 * Authoritative Operator Admin / Fleet Owner Service
 * Strictly interfaces with Fastify backend routes:
 * - apps/api/src/routes/operator.ts
 * - apps/api/src/routes/fleet.ts
 * - apps/api/src/routes/telemetry.ts
 *
 * HARD INVARIANTS:
 * - No fake/demo data or silent success fallbacks
 * - Real errors propagate to UI
 * - Tenant isolation enforced by backend
 * - Passwords, tokens, or JWTs are never logged
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';
import type {
  OperatorProfile,
  UpdateOperatorProfileInput,
  FleetBus,
  BusListResponse,
  CreateBusInput,
  UpdateBusInput,
  StaffMember,
  StaffListResponse,
  CreateStaffInput,
  UpdateStaffInput,
  FleetRoute,
  RouteListResponse,
  CreateRouteInput,
  UpdateRouteInput,
  StopItem,
  StopListResponse,
  CreateStopInput,
  OperatorTrip,
  TripListResponse,
  DispatchTripInput,
  TripStatus,
  OperatorRevenueReport,
  LiveFleetRadarResponse,
} from '../types/operator.types';

export class OperatorService {
  // ==========================================
  // 1. Company Profile
  // ==========================================

  async getProfile(): Promise<OperatorProfile> {
    const res = await apiClient.get<{ profile: OperatorProfile }>(
      API_CONFIG.ENDPOINTS.OPERATOR_PROFILE
    );
    return res.data.profile;
  }

  async updateProfile(data: UpdateOperatorProfileInput): Promise<OperatorProfile> {
    const res = await apiClient.put<{ profile: OperatorProfile }>(
      API_CONFIG.ENDPOINTS.OPERATOR_PROFILE,
      data
    );
    return res.data.profile;
  }

  // ==========================================
  // 2. Fleet Buses
  // ==========================================

  async getBuses(query?: { status?: string; search?: string }): Promise<BusListResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search && query.search.trim()) params.append('search', query.search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<BusListResponse>(
      `${API_CONFIG.ENDPOINTS.OPERATOR_BUSES}${qs}`
    );
    return res.data;
  }

  async createBus(data: CreateBusInput): Promise<FleetBus> {
    const res = await apiClient.post<{ bus: FleetBus }>(
      API_CONFIG.ENDPOINTS.OPERATOR_BUSES,
      data
    );
    return res.data.bus;
  }

  async updateBus(busId: string, data: UpdateBusInput): Promise<FleetBus> {
    const res = await apiClient.put<{ bus: FleetBus }>(
      API_CONFIG.ENDPOINTS.OPERATOR_BUS_DETAIL(busId),
      data
    );
    return res.data.bus;
  }

  async decommissionBus(busId: string): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      API_CONFIG.ENDPOINTS.OPERATOR_BUS_DETAIL(busId)
    );
    return res.data;
  }

  // ==========================================
  // 3. Staff Roster (Drivers & Conductors)
  // ==========================================

  async getStaff(query?: { role?: 'DRIVER' | 'CONDUCTOR'; search?: string }): Promise<StaffListResponse> {
    const params = new URLSearchParams();
    if (query?.role) params.append('role', query.role);
    if (query?.search && query.search.trim()) params.append('search', query.search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<StaffListResponse>(
      `${API_CONFIG.ENDPOINTS.OPERATOR_STAFF}${qs}`
    );
    return res.data;
  }

  async createStaff(data: CreateStaffInput): Promise<StaffMember> {
    const res = await apiClient.post<{ staff: StaffMember }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF,
      data
    );
    return res.data.staff;
  }

  async updateStaff(staffId: string, data: UpdateStaffInput): Promise<StaffMember> {
    const res = await apiClient.put<{ staff: StaffMember }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_DETAIL(staffId),
      data
    );
    return res.data.staff;
  }

  async updateStaffStatus(staffId: string, isActive: boolean): Promise<StaffMember> {
    const res = await apiClient.put<{ staff: StaffMember }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_STATUS(staffId),
      { isActive }
    );
    return res.data.staff;
  }

  async resetStaffPassword(staffId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_RESET_PASSWORD(staffId),
      { newPassword }
    );
    return res.data;
  }

  async deleteStaff(staffId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_DETAIL(staffId)
    );
    return res.data;
  }

  // ==========================================
  // 4. Stops & Geo-fences
  // ==========================================

  async getStops(query?: { search?: string }): Promise<StopListResponse> {
    const params = new URLSearchParams();
    if (query?.search && query.search.trim()) params.append('search', query.search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<StopListResponse>(
      `${API_CONFIG.ENDPOINTS.OPERATOR_STOPS}${qs}`
    );
    return res.data;
  }

  async createStop(data: CreateStopInput): Promise<StopItem> {
    const res = await apiClient.post<{ stop: StopItem }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STOPS,
      data
    );
    return res.data.stop;
  }

  // ==========================================
  // 5. Corridors & Routes
  // ==========================================

  async getRoutes(query?: { search?: string; isActive?: boolean }): Promise<RouteListResponse> {
    const params = new URLSearchParams();
    if (query?.search && query.search.trim()) params.append('search', query.search.trim());
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<RouteListResponse>(
      `${API_CONFIG.ENDPOINTS.OPERATOR_ROUTES}${qs}`
    );
    return res.data;
  }

  async getRouteDetail(routeId: string): Promise<FleetRoute> {
    const res = await apiClient.get<{ route: FleetRoute }>(
      API_CONFIG.ENDPOINTS.OPERATOR_ROUTE_DETAIL(routeId)
    );
    return res.data.route;
  }

  async createRoute(data: CreateRouteInput): Promise<FleetRoute> {
    const res = await apiClient.post<{ route: FleetRoute }>(
      API_CONFIG.ENDPOINTS.OPERATOR_ROUTES,
      data
    );
    return res.data.route;
  }

  async updateRoute(routeId: string, data: UpdateRouteInput): Promise<FleetRoute> {
    const res = await apiClient.put<{ route: FleetRoute }>(
      API_CONFIG.ENDPOINTS.OPERATOR_ROUTE_DETAIL(routeId),
      data
    );
    return res.data.route;
  }

  async deleteRoute(routeId: string): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      API_CONFIG.ENDPOINTS.OPERATOR_ROUTE_DETAIL(routeId)
    );
    return res.data;
  }

  // ==========================================
  // 6. Trips & Dispatch
  // ==========================================

  async getTrips(query?: { routeId?: string; busId?: string; status?: TripStatus; date?: string }): Promise<TripListResponse> {
    const params = new URLSearchParams();
    if (query?.routeId) params.append('routeId', query.routeId);
    if (query?.busId) params.append('busId', query.busId);
    if (query?.status) params.append('status', query.status);
    if (query?.date) params.append('date', query.date);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<TripListResponse>(
      `${API_CONFIG.ENDPOINTS.OPERATOR_TRIPS}${qs}`
    );
    return res.data;
  }

  async dispatchTrip(data: DispatchTripInput): Promise<OperatorTrip> {
    const res = await apiClient.post<{ trip: OperatorTrip }>(
      API_CONFIG.ENDPOINTS.OPERATOR_DISPATCH_TRIP,
      data
    );
    return res.data.trip;
  }

  async updateTripStatus(tripId: string, status: TripStatus): Promise<OperatorTrip> {
    const res = await apiClient.put<{ trip: OperatorTrip }>(
      API_CONFIG.ENDPOINTS.OPERATOR_TRIP_STATUS(tripId),
      { status }
    );
    return res.data.trip;
  }

  // ==========================================
  // 7. Authoritative Revenue & Stats
  // ==========================================

  async getRevenue(): Promise<OperatorRevenueReport> {
    const res = await apiClient.get<OperatorRevenueReport>(
      API_CONFIG.ENDPOINTS.OPERATOR_REVENUE
    );
    return res.data;
  }

  // ==========================================
  // 8. Live Fleet Radar (Tenant-Scoped)
  // ==========================================

  async getFleetRadar(): Promise<LiveFleetRadarResponse> {
    const res = await apiClient.get<LiveFleetRadarResponse>(
      API_CONFIG.ENDPOINTS.FLEET_RADAR
    );
    return res.data;
  }
}

export const operatorService = new OperatorService();
