/**
 * Super Admin / Platform Admin Service
 *
 * Interfaces EXCLUSIVELY with authoritative Fastify backend routes
 * that are actually implemented and PLATFORM_ADMIN-gated:
 *
 * Operator management  ? apps/api/src/routes/tenant.ts
 * Staff management     ? apps/api/src/routes/operator.ts (staffGuards)
 * Profile              ? apps/api/src/routes/auth.ts
 *
 * HARD INVARIANTS:
 * - No GPS / tracking / telemetry / map / radar calls.
 * - Passwords, tokens, and JWTs are never logged.
 * - Real errors propagate to UI — no silent fallbacks.
 * - No fake/demo data.
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';
import type {
  PlatformOperator,
  OperatorListResponse,
  CreateOperatorInput,
  CreateOperatorResult,
  UpdateOperatorInput,
  PlatformStaffMember,
  PlatformStaffListResponse,
  CreatePlatformStaffInput,
  UpdatePlatformStaffInput,
  SuperAdminProfile,
} from '../types/superadmin.types';

export class SuperAdminService {
  // ============================================================
  // 1. Operator / Tenant Management
  //    Backend: apps/api/src/routes/tenant.ts
  // ============================================================

  /** GET /api/v1/tenant/operators — list all operators (all authenticated) */
  async listOperators(): Promise<PlatformOperator[]> {
    const res = await apiClient.get<OperatorListResponse>(
      API_CONFIG.ENDPOINTS.SA_LIST_OPERATORS
    );
    return res.data.operators;
  }

  /** POST /api/v1/tenant/operators — create operator+owner (PLATFORM_ADMIN) */
  async createOperator(data: CreateOperatorInput): Promise<CreateOperatorResult> {
    const res = await apiClient.post<CreateOperatorResult>(
      API_CONFIG.ENDPOINTS.SA_LIST_OPERATORS,
      data
    );
    return res.data;
  }

  /** PUT /api/v1/tenant/operators/:tenantId — update operator (PLATFORM_ADMIN) */
  async updateOperator(tenantId: string, data: UpdateOperatorInput): Promise<PlatformOperator> {
    const res = await apiClient.put<{ operator: PlatformOperator }>(
      API_CONFIG.ENDPOINTS.SA_OPERATOR_DETAIL(tenantId),
      data
    );
    return res.data.operator;
  }

  /** DELETE /api/v1/tenant/operators/:tenantId — delete operator (PLATFORM_ADMIN) */
  async deleteOperator(tenantId: string): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.delete<{ success: boolean; message?: string }>(
      API_CONFIG.ENDPOINTS.SA_OPERATOR_DETAIL(tenantId)
    );
    return res.data;
  }

  // ============================================================
  // 2. Platform-Wide Staff Management
  //    Backend: apps/api/src/routes/operator.ts (staffGuards)
  //    PLATFORM_ADMIN may pass optional tenantId as query param
  // ============================================================

  /** GET /api/v1/operator/staff[?tenantId=&role=&search=] (PLATFORM_ADMIN) */
  async listStaff(query?: {
    tenantId?: string;
    role?: 'DRIVER' | 'CONDUCTOR';
    search?: string;
  }): Promise<PlatformStaffListResponse> {
    const params = new URLSearchParams();
    if (query?.tenantId) params.append('tenantId', query.tenantId);
    if (query?.role) params.append('role', query.role);
    if (query?.search?.trim()) params.append('search', query.search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<PlatformStaffListResponse>(
      `${API_CONFIG.ENDPOINTS.OPERATOR_STAFF}${qs}`
    );
    return res.data;
  }

  /** POST /api/v1/operator/staff (PLATFORM_ADMIN: tenantId required in body) */
  async createStaff(data: CreatePlatformStaffInput): Promise<PlatformStaffMember> {
    const res = await apiClient.post<{ staff: PlatformStaffMember }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF,
      data
    );
    return res.data.staff;
  }

  /** PUT /api/v1/operator/staff/:staffId (PLATFORM_ADMIN) */
  async updateStaff(staffId: string, data: UpdatePlatformStaffInput): Promise<PlatformStaffMember> {
    const res = await apiClient.put<{ staff: PlatformStaffMember }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_DETAIL(staffId),
      data
    );
    return res.data.staff;
  }

  /** PUT /api/v1/operator/staff/:staffId/status (PLATFORM_ADMIN) */
  async updateStaffStatus(
    staffId: string,
    isActive: boolean
  ): Promise<PlatformStaffMember> {
    const res = await apiClient.put<{ staff: PlatformStaffMember }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_STATUS(staffId),
      { isActive }
    );
    return res.data.staff;
  }

  /** DELETE /api/v1/operator/staff/:staffId (PLATFORM_ADMIN) */
  async deleteStaff(staffId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      API_CONFIG.ENDPOINTS.OPERATOR_STAFF_DETAIL(staffId)
    );
    return res.data;
  }

  // ============================================================
  // 3. Super Admin Profile
  //    Backend: apps/api/src/routes/auth.ts
  // ============================================================

  /** GET /api/v1/auth/me */
  async getProfile(): Promise<SuperAdminProfile> {
    const res = await apiClient.get<{ user: SuperAdminProfile }>(
      API_CONFIG.ENDPOINTS.ME
    );
    return res.data.user;
  }
}

export const superAdminService = new SuperAdminService();
