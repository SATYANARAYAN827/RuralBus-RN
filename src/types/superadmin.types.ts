/**
 * Authoritative Type Definitions for Module 7 — Super Admin / Platform Admin
 *
 * Derived exclusively from the Fastify backend contracts:
 * - apps/api/src/routes/tenant.ts   (PLATFORM_ADMIN routes)
 * - apps/api/src/routes/operator.ts  (staffGuards: PLATFORM_ADMIN + OPERATOR_ADMIN)
 * - apps/api/src/routes/auth.ts      (profile)
 * - packages/shared-types/src/tenant.ts
 *
 * ABSOLUTE INVARIANTS:
 * - Zero maps, GPS, tracking, telemetry, radar, or location types.
 * - PLATFORM_ADMIN authorization only for write operations.
 */

// ============================================================
// Operator / Tenant management (tenant.ts backend)
// ============================================================

export type OperatorStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface PlatformOperator {
  id: string;
  companyName: string;
  businessCode: string;
  contactEmail: string;
  contactPhone: string;
  corridor?: string;
  status: OperatorStatus;
  createdAt: string;
  updatedAt: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  busesCount: number;
  staffCount: number;
}

export interface OperatorListResponse {
  operators: PlatformOperator[];
}

/** POST /api/v1/tenant/operators */
export interface CreateOperatorInput {
  companyName: string;
  ownerName: string;
  phone: string;
  email?: string;
  password: string;
  businessCode?: string;
}

/** PUT /api/v1/tenant/operators/:tenantId */
export interface UpdateOperatorInput {
  companyName?: string;
  ownerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  corridor?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface CreateOperatorResult {
  operator: {
    id: string;
    companyName: string;
    businessCode: string;
    contactEmail: string;
    contactPhone: string;
    status: OperatorStatus;
    createdAt: string;
  };
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: 'OPERATOR_ADMIN';
  };
  sms: {
    sent: boolean;
    provider: string;
    maskedPhone: string;
    message: string;
    error?: string;
  };
}

// ============================================================
// Platform staff (operator.ts backend — staffGuards)
// ============================================================

export interface PlatformStaffMember {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'DRIVER' | 'CONDUCTOR';
  isActive: boolean;
  tenantId: string;
  tenantName?: string;
  busId?: string;
  busRegistrationNumber?: string;
  createdBy?: 'OWNER' | 'SUPER_ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformStaffListResponse {
  staff: PlatformStaffMember[];
  total: number;
  activeDrivers: number;
  activeConductors: number;
}

/** POST /api/v1/operator/staff (PLATFORM_ADMIN: tenantId required in body) */
export interface CreatePlatformStaffInput {
  fullName: string;
  phone: string;
  email?: string;
  role: 'DRIVER' | 'CONDUCTOR';
  password: string;
  tenantId: string;
}

/** PUT /api/v1/operator/staff/:staffId */
export interface UpdatePlatformStaffInput {
  fullName?: string;
  busId?: string | null;
}

// ============================================================
// Super Admin Profile (auth.ts backend)
// ============================================================

export interface SuperAdminProfile {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: 'PLATFORM_ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Platform Dashboard aggregates (derived from operator list)
// ============================================================

export interface PlatformDashboardSummary {
  totalOperators: number;
  activeOperators: number;
  suspendedOperators: number;
  totalBuses: number;
  totalStaff: number;
}
