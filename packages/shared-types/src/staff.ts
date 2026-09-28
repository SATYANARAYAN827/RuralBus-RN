export type StaffRole = 'DRIVER' | 'CONDUCTOR';

export interface StaffMember {
  id: string; // operator_members.id
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: StaffRole;
  isActive: boolean;
  tenantId: string;
  busId?: string | null;
  busRegistrationNumber?: string | null;
  createdBy?: 'OWNER' | 'SUPER_ADMIN' | string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponse {
  staff: StaffMember[];
  total: number;
  activeDrivers: number;
  activeConductors: number;
}

export interface CreateStaffInput {
  fullName: string;
  phone: string;
  email?: string;
  role: StaffRole;
  password: string;
  tenantId?: string;
  busId?: string;
  bus?: string;
  createdBy?: 'OWNER' | 'SUPER_ADMIN' | string;
}

export interface UpdateStaffStatusInput {
  isActive: boolean;
}

export interface UpdateStaffMemberInput {
  fullName?: string;
  busId?: string | null;
}

export interface ResetStaffPasswordInput {
  newPassword: string;
}

export interface OperatorProfile {
  id: string;
  companyName: string;
  businessCode: string;
  contactEmail: string;
  contactPhone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOperatorProfileInput {
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
