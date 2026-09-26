/**
 * Canonical Types for RuralBus Passenger Portal
 */

export interface TransitStop {
  id: string;
  code: string;
  name: string;
  highwayMarkerKm: number;
  lat: number;
  lon: number;
  distanceMeters?: number;
  district?: string;
}

export interface CorridorRoute {
  id: string;
  code: string;
  name: string;
  originStop: string;
  destinationStop: string;
  distanceKm: number;
  stops: TransitStop[];
}

export type BusType = 'AC Deluxe' | 'Express Seater' | 'Ordinary';

export interface BusService {
  id: string;
  tripId: string;
  routeCode: string;
  routeName: string;
  busRegistration: string;
  busModel: string;
  busType: BusType;
  operatorName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableSeats: number;
  totalSeats: number;
  fare: number;
  isLive: boolean;
  currentSpeedKmH?: number;
  nextStopName?: string;
  etaMinutes?: number;
  amenities: string[];
  stops: {
    stopName: string;
    arrivalTime: string;
    distanceKm: number;
  }[];
}

export type SeatState = 'AVAILABLE' | 'SELECTED' | 'BOOKED' | 'HELD';

export interface Seat {
  id: string;
  row: number;
  col: number;
  label: string;
  type: 'WINDOW' | 'AISLE' | 'MIDDLE';
  status: SeatState;
  price: number;
}

export type PaymentMethod = 'UPI' | 'WALLET' | 'CARD' | 'CASH';

export type TicketStatus = 'CONFIRMED' | 'BOARDED' | 'COMPLETED' | 'CANCELLED';

export interface PassengerTicket {
  id: string;
  pnr: string;
  tripId: string;
  routeCode: string;
  routeName: string;
  busRegistration: string;
  operatorName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  seatNumbers: string[];
  totalFare: number;
  passengerName: string;
  passengerPhone: string;
  status: TicketStatus;
  paymentMethod: PaymentMethod;
  qrPayload: string;
  signature: string;
  bookedAt: string;
}

export interface LiveTripState {
  tripId: string;
  busRegistration: string;
  routeName: string;
  operatorName: string;
  status: 'SCHEDULED' | 'RUNNING' | 'HALTED' | 'COMPLETED';
  currentSpeed: number;
  heading: number;
  lat: number;
  lon: number;
  approachingStop: string;
  nextStopEta: string;
  passedStops: string[];
  remainingStops: string[];
  lastPingTime: string;
  isGpsLive: boolean;
  isWsConnected: boolean;
}
