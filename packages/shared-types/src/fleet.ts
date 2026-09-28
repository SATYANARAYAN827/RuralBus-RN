export type BusStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export type SeatingType = 'SEATER_2X2' | 'SEATER_3X2' | 'SLEEPER' | 'SEMI_SLEEPER';

export interface Bus {
  id: string;
  tenantId: string;
  operatorName?: string;
  registrationNumber: string;
  model: string;
  totalSeats: number;
  seatingType: SeatingType;
  status: BusStatus;
  amenities: string[];
  driver?: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  driverUserId?: string;
  conductor?: string;
  conductorName?: string;
  conductorPhone?: string;
  conductorId?: string;
  conductorUserId?: string;
  route?: string;
  routeCode?: string;
  createdBy?: 'OWNER' | 'SUPER_ADMIN' | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusInput {
  tenantId?: string;
  registrationNumber?: string;
  model: string;
  totalSeats: number;
  status?: BusStatus;
  seatingType?: SeatingType;
  amenities?: string[];
  createdBy?: 'OWNER' | 'SUPER_ADMIN' | string;
}

export interface UpdateBusInput {
  tenantId?: string;
  registrationNumber?: string;
  model?: string;
  totalSeats?: number;
  seatingType?: SeatingType;
  status?: BusStatus;
  amenities?: string[];
  driverId?: string | null;
  conductorId?: string | null;
}

export interface BusListResponse {
  buses: Bus[];
  total: number;
  activeCount: number;
  maintenanceCount: number;
}

export interface DriverProfile {
  id: string;
  userId: string;
  tenantId: string;
  licenseNumber: string;
  licenseExpiry: string;
  isActive: boolean;
}

export interface ConductorProfile {
  id: string;
  userId: string;
  tenantId: string;
  employeeCode: string;
  isActive: boolean;
}
