/**
 * Authoritative Type Definitions for Module 6 — Operator Admin / Fleet Owner
 * Matches Fastify backend routes:
 * - apps/api/src/routes/operator.ts
 * - apps/api/src/routes/fleet.ts
 * - apps/api/src/routes/telemetry.ts
 */

export type BusSeatingType = 'SEATER_2X2' | 'SEATER_3X2' | 'SLEEPER' | 'SEMI_SLEEPER';
export type BusStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export interface FleetBusStaffRef {
  id: string;
  userId: string;
  name: string;
  phone: string;
}

export interface FleetBus {
  id: string;
  tenantId: string;
  registrationNumber: string;
  model: string;
  totalSeats: number;
  seatingType: BusSeatingType;
  status: BusStatus;
  amenities: string[];
  createdBy?: string;
  operatorName?: string;
  assignedDriver?: FleetBusStaffRef | null;
  assignedConductor?: FleetBusStaffRef | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusListResponse {
  buses: FleetBus[];
  total: number;
  activeCount: number;
  maintenanceCount: number;
}

export interface CreateBusInput {
  registrationNumber?: string;
  model: string;
  totalSeats: number;
  seatingType?: BusSeatingType;
  status?: BusStatus;
  amenities?: string[];
}

export interface UpdateBusInput {
  registrationNumber?: string;
  model?: string;
  totalSeats?: number;
  seatingType?: BusSeatingType;
  status?: BusStatus;
  amenities?: string[];
  driverId?: string | null;
  conductorId?: string | null;
}

export interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'DRIVER' | 'CONDUCTOR';
  isActive: boolean;
  tenantId: string;
  busId?: string;
  busRegistrationNumber?: string;
  createdBy?: 'OWNER' | 'SUPER_ADMIN';
  createdAt?: string;
  updatedAt?: string;
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
  role: 'DRIVER' | 'CONDUCTOR';
  password: string;
  busId?: string | null;
}

export interface UpdateStaffInput {
  fullName?: string;
  busId?: string | null;
}

export interface RouteStopItem {
  id?: string;
  stopId: string;
  name?: string;
  sequenceNumber: number;
  distanceFromStartKm: number;
  estimatedMinutesFromStart: number;
  fareFromStart: number;
}

export interface FleetRoute {
  id: string;
  tenantId: string;
  routeCode: string;
  origin: string;
  destination: string;
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  isActive: boolean;
  stops: RouteStopItem[];
  polylineCoordinates?: Array<{ latitude: number; longitude: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteListResponse {
  routes: FleetRoute[];
  total: number;
}

export interface CreateRouteInput {
  routeCode: string;
  origin: string;
  destination: string;
  stops: Array<{
    stopId: string;
    sequenceNumber: number;
    distanceFromStartKm: number;
    estimatedMinutesFromStart: number;
    fareFromStart: number;
  }>;
  polylineCoordinates?: Array<{ latitude: number; longitude: number }>;
}

export interface UpdateRouteInput {
  routeCode?: string;
  origin?: string;
  destination?: string;
  stops?: Array<{
    stopId: string;
    sequenceNumber: number;
    distanceFromStartKm: number;
    estimatedMinutesFromStart: number;
    fareFromStart: number;
  }>;
  polylineCoordinates?: Array<{ latitude: number; longitude: number }>;
  isActive?: boolean;
}

export interface StopItem {
  id: string;
  tenantId?: string;
  name: string;
  code: string;
  location: { latitude: number; longitude: number };
  landmark?: string;
  isActive?: boolean;
}

export interface StopListResponse {
  stops: StopItem[];
  total: number;
}

export interface CreateStopInput {
  name: string;
  code: string;
  location: { latitude: number; longitude: number };
  landmark?: string;
}

export interface UpdateStopInput {
  name?: string;
  code?: string;
  location?: { latitude: number; longitude: number };
  landmark?: string;
}

export type TripStatus = 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';

export interface OperatorTrip {
  id: string;
  tenantId: string;
  routeId: string;
  busId: string;
  driverId?: string | null;
  conductorId?: string | null;
  departureTime: string;
  scheduledArrival: string;
  status: TripStatus;
  availableSeats?: number;
  totalSeats?: number;
  routeCode?: string;
  origin?: string;
  destination?: string;
  busReg?: string;
  busModel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripListResponse {
  trips: OperatorTrip[];
  total: number;
}

export interface DispatchTripInput {
  routeId: string;
  busId: string;
  driverId?: string;
  conductorId?: string;
  departureTime: string;
  scheduledArrival: string;
}

export interface OperatorRevenueReport {
  onlineRevenue: number;
  onlineTicketCount: number;
  cashRevenue: number;
  cashTicketCount: number;
  totalRevenue: number;
  totalPassengers: number;
  totalBuses: number;
  activeBuses: number;
  totalStaff: number;
  generatedAt: string;
}

export interface LiveFleetBus {
  busId: string;
  registrationNumber: string;
  tripId: string;
  routeCode: string;
  driverName?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  lastPingAt: string;
  status: string;
}

export interface LiveFleetRadarResponse {
  tenantId: string;
  buses: LiveFleetBus[];
  totalActive: number;
  lastUpdated: string;
}

export interface OperatorProfile {
  id: string;
  companyName: string;
  businessCode: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOperatorProfileInput {
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
