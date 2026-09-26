/**
 * Conductor Experience Types & Authoritative Fastify Duty Contracts
 *
 * Mapped directly to Fastify backend in RURAL BUS/apps/api:
 * - GET  /api/v1/conductor/duty
 * - GET  /api/v1/conductor/manifest/:tripId
 * - PUT  /api/v1/conductor/manifest/:tripId/board/:ticketId
 * - GET  /api/v1/conductor/stats
 * - POST /api/v1/tickets/validate-qr
 * - GET  /api/v1/tickets/manifest/offline/:tripId
 * - POST /api/v1/conductor/cash-ticket
 * - POST /api/v1/conductor/offline-tickets/sync
 * - GET  /api/v1/conductor/cash-settlement/:tripId
 */

import { DriverDutyTrip } from './driver.types';

export interface ManifestPassenger {
  ticketId: string;
  bookingId: string;
  ticketNumber: string;
  seatNumber: string;
  passengerName: string;
  passengerPhone?: string | null;
  fromStopName: string;
  toStopName: string;
  fare: number;
  isBoarded: boolean;
  status: 'CONFIRMED' | 'BOARDED' | 'CANCELLED';
  paymentType?: 'ONLINE' | 'CASH';
}

export interface ConductorDutyResponse {
  activeTrip: DriverDutyTrip | null;
  totalBookedSeats: number;
  totalBoardedSeats: number;
  totalAwaitingSeats: number;
  totalSeats: number;
}

export interface ConductorManifestResponse {
  tripId: string;
  routeCode: string;
  origin: string;
  destination: string;
  busRegistrationNumber: string;
  totalSeats: number;
  totalBookedSeats: number;
  totalBoardedSeats: number;
  totalAwaitingSeats: number;
  passengers: ManifestPassenger[];
}

export interface BoardingUpdateResult {
  success: boolean;
  ticketId: string;
  isBoarded: boolean;
}

export interface ConductorStatsResponse {
  totalTripsHandled: number;
  totalPassengersBoarded: number;
  totalShiftCollections: number;
}

export interface DigitalTicketPayload {
  ticketId: string;
  bookingId: string;
  tripId: string;
  tenantId: string;
  passengerId: string;
  passengerName: string;
  seatNumber: number;
  origin: string;
  destination: string;
  departureTime: string;
  fareAmount: number;
  status: 'VALID' | 'BOARDED' | 'EXPIRED' | 'CANCELLED';
  qrSignature: string;
  boardedAt?: string | null;
}

export interface TicketValidationResult {
  valid: boolean;
  message: string;
  alreadyBoarded?: boolean;
  ticket?: DigitalTicketPayload;
}

export interface OfflineCashTicketPayload {
  ticketSequence: number;
  ticketCode: string;
  deviceId: string;
  tripId: string;
  boardingStopId: string;
  droppingStopId: string;
  passengerCount: number;
  fareAmount: number;
  paymentMethod: 'CASH';
  issuedAt: string;
  prevTicketHash: string;
  ticketHash: string;
}

export interface CashTicketIssueResponse {
  ticketId: string;
  synced: boolean;
  message: string;
}

export interface OfflineCashBatchSyncResponse {
  syncedCount: number;
  totalCashAmount: number;
  processedTickets: Array<{
    ticketCode: string;
    ticketId: string;
    status: 'SYNCED' | 'DUPLICATE' | 'INVALID';
  }>;
}

export interface ConductorCashSettlementReport {
  tripId: string;
  conductorId: string;
  conductorName: string;
  routeCode: string;
  busRegistration: string;
  digitalTicketCount: number;
  digitalRevenueAmount: number;
  cashTicketCount: number;
  cashRevenueAmount: number;
  totalPassengers: number;
  totalRevenue: number;
  generatedAt: string;
}

export interface IssuedCashReceipt {
  ticketId: string;
  ticketCode: string;
  fromStopName: string;
  toStopName: string;
  passengerCount: number;
  unitFare: number;
  fareAmount: number;
  issuedAt: string;
  synced: boolean;
}
