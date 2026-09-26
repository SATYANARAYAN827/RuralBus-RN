/**
 * Driver Experience Types & Authoritative Fastify Duty Contracts
 *
 * Mapped directly to Fastify backend in RURAL BUS/apps/api:
 * - GET  /api/v1/driver/duty
 * - POST /api/v1/driver/duty/:tripId/start
 * - POST /api/v1/driver/duty/:tripId/end
 * - GET  /api/v1/driver/history
 * - POST /api/v1/tracking/ping
 */

export interface DriverStop {
  stopId: string;
  stopName: string;
  sequenceNumber: number;
  distanceFromStartKm: number;
  estimatedMinutesFromStart: number;
  latitude: number;
  longitude: number;
}

export type TripLifecycleStatus =
  | 'SCHEDULED'
  | 'BOARDING'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DriverDutyTrip {
  id: string;
  routeId: string;
  routeCode: string;
  origin: string;
  destination: string;
  busId: string;
  busRegistrationNumber: string;
  busModel: string;
  totalSeats: number;
  seatingType: string;
  conductorId?: string | null;
  conductorName?: string | null;
  conductorPhone?: string | null;
  departureTime: string;
  scheduledArrival: string;
  actualDeparture?: string | null;
  actualArrival?: string | null;
  status: TripLifecycleStatus;
  availableSeats: number;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  stops: DriverStop[];
}

export interface DriverDutyResponse {
  activeTrip: DriverDutyTrip | null;
  upcomingTrips: DriverDutyTrip[];
}

export interface DriverHistoryTrip {
  id: string;
  routeId?: string;
  routeCode: string;
  origin: string;
  destination: string;
  busRegistrationNumber: string;
  departureTime: string;
  completedAt?: string | null;
  distanceKm: number;
  passengerCount?: number;
  status: string;
}

export interface DriverHistoryResponse {
  trips: DriverHistoryTrip[];
  totalCompleted: number;
  totalDistanceDrivenKm: number;
}

export interface GpsPingInput {
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: string;
}

export interface GpsPingResponse {
  success: boolean;
  message?: string;
  tripId?: string;
  recordedAt?: string;
}
