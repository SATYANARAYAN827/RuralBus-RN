import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';
import {
  BusService,
  CorridorRoute,
  TransitStop,
  Seat,
  PassengerTicket,
  LiveTripState,
} from '../types';

export const FALLBACK_STOPS: TransitStop[] = [
  { id: 'stop-1', code: 'AJM-CK', name: 'Ajmeri Gate Chowk', highwayMarkerKm: 0, lat: 20.2961, lon: 85.8245, distanceMeters: 90, district: 'Khordha' },
  { id: 'stop-2', code: 'BRM-ISBT', name: 'Baramunda ISBT', highwayMarkerKm: 8, lat: 20.2796, lon: 85.7951, distanceMeters: 450, district: 'Bhubaneswar' },
  { id: 'stop-3', code: 'MST-CNT', name: 'Master Canteen Hub', highwayMarkerKm: 15, lat: 20.2642, lon: 85.8415, distanceMeters: 1200, district: 'Bhubaneswar' },
  { id: 'stop-4', code: 'RSL-SQ', name: 'Rasulgarh Square', highwayMarkerKm: 22, lat: 20.3015, lon: 85.8647, distanceMeters: 2800, district: 'Khordha' },
  { id: 'stop-5', code: 'CTC-BDM', name: 'Cuttack Badambadi Stand', highwayMarkerKm: 42, lat: 20.4625, lon: 85.8830, distanceMeters: 5600, district: 'Cuttack' },
  { id: 'stop-6', code: 'PPL-TL', name: 'Pipili Toll Plaza', highwayMarkerKm: 58, lat: 20.1132, lon: 85.8322, distanceMeters: 7400, district: 'Puri' },
  { id: 'stop-7', code: 'SKG-CH', name: 'Sakshigopal Chowk', highwayMarkerKm: 76, lat: 19.9548, lon: 85.8251, distanceMeters: 12000, district: 'Puri' },
  { id: 'stop-8', code: 'PRI-BS', name: 'Puri Bus Stand (Bada Danda)', highwayMarkerKm: 94, lat: 19.8135, lon: 85.8312, distanceMeters: 18500, district: 'Puri' },
  { id: 'stop-9', code: 'ANG-BS', name: 'Angul Central Depot', highwayMarkerKm: 130, lat: 20.8400, lon: 85.1000, distanceMeters: 32000, district: 'Angul' },
  { id: 'stop-10', code: 'SBP-ISBT', name: 'Sambalpur Ainthapali ISBT', highwayMarkerKm: 280, lat: 21.4669, lon: 83.9812, distanceMeters: 64000, district: 'Sambalpur' },
];

export const POPULAR_CORRIDORS: CorridorRoute[] = [
  {
    id: 'corridor-1',
    code: 'OD-SH-02',
    name: 'Bhubaneswar ↔ Puri via Pipili',
    originStop: 'Baramunda ISBT',
    destinationStop: 'Puri Bus Stand (Bada Danda)',
    distanceKm: 65,
    stops: FALLBACK_STOPS.slice(1, 8),
  },
  {
    id: 'corridor-2',
    code: 'OD-NH-16',
    name: 'Bhubaneswar ↔ Cuttack Badambadi',
    originStop: 'Master Canteen Hub',
    destinationStop: 'Cuttack Badambadi Stand',
    distanceKm: 28,
    stops: [FALLBACK_STOPS[2], FALLBACK_STOPS[3], FALLBACK_STOPS[4]],
  },
  {
    id: 'corridor-3',
    code: 'OD-SH-65',
    name: 'Cuttack ↔ Angul Industrial Highway',
    originStop: 'Cuttack Badambadi Stand',
    destinationStop: 'Angul Central Depot',
    distanceKm: 115,
    stops: [FALLBACK_STOPS[4], FALLBACK_STOPS[8]],
  },
];

export const FALLBACK_BUSES: BusService[] = [
  {
    id: 'bus-srv-1',
    tripId: 'trip-901-od02',
    routeCode: 'OD-SH-02',
    routeName: 'Bhubaneswar to Puri Express',
    busRegistration: 'OD-02-AK-4412',
    busModel: 'Volvo Multi-Axle AC Deluxe',
    busType: 'AC Deluxe',
    operatorName: 'Odisha State Express (OSRTC)',
    departureTime: '07:30 AM',
    arrivalTime: '09:15 AM',
    duration: '1h 45m',
    availableSeats: 18,
    totalSeats: 40,
    fare: 140,
    isLive: true,
    currentSpeedKmH: 52,
    nextStopName: 'Pipili Toll Plaza',
    etaMinutes: 14,
    amenities: ['Air Conditioning', 'Live GPS Radar', 'CCTV Security', 'USB Mobile Charger'],
    stops: [
      { stopName: 'Baramunda ISBT', arrivalTime: '07:30 AM', distanceKm: 0 },
      { stopName: 'Master Canteen Hub', arrivalTime: '07:45 AM', distanceKm: 8 },
      { stopName: 'Pipili Toll Plaza', arrivalTime: '08:25 AM', distanceKm: 38 },
      { stopName: 'Sakshigopal Chowk', arrivalTime: '08:50 AM', distanceKm: 52 },
      { stopName: 'Puri Bus Stand (Bada Danda)', arrivalTime: '09:15 AM', distanceKm: 65 },
    ],
  },
  {
    id: 'bus-srv-2',
    tripId: 'trip-902-od02',
    routeCode: 'OD-SH-02',
    routeName: 'Jagannath Rural Fast Passenger',
    busRegistration: 'OD-02-B-8901',
    busModel: 'Tata Marcopolo 2x2 Seater',
    busType: 'Express Seater',
    operatorName: 'Maa Tarini Rural Lines',
    departureTime: '08:15 AM',
    arrivalTime: '10:05 AM',
    duration: '1h 50m',
    availableSeats: 9,
    totalSeats: 36,
    fare: 95,
    isLive: true,
    currentSpeedKmH: 46,
    nextStopName: 'Sakshigopal Chowk',
    etaMinutes: 22,
    amenities: ['GPS Tracking', 'Luggage Compartment', 'Emergency Exit'],
    stops: [
      { stopName: 'Baramunda ISBT', arrivalTime: '08:15 AM', distanceKm: 0 },
      { stopName: 'Pipili Toll Plaza', arrivalTime: '09:05 AM', distanceKm: 38 },
      { stopName: 'Sakshigopal Chowk', arrivalTime: '09:35 AM', distanceKm: 52 },
      { stopName: 'Puri Bus Stand (Bada Danda)', arrivalTime: '10:05 AM', distanceKm: 65 },
    ],
  },
  {
    id: 'bus-srv-3',
    tripId: 'trip-903-nh16',
    routeCode: 'OD-NH-16',
    routeName: 'Twin City Shuttle',
    busRegistration: 'OD-05-C-1123',
    busModel: 'Ashok Leyland Viking City',
    busType: 'Ordinary',
    operatorName: 'Capital Region Rural Transit',
    departureTime: '09:00 AM',
    arrivalTime: '09:50 AM',
    duration: '50m',
    availableSeats: 24,
    totalSeats: 44,
    fare: 45,
    isLive: false,
    amenities: ['Conductor Ticketing', 'Handrails', 'First Aid'],
    stops: [
      { stopName: 'Master Canteen Hub', arrivalTime: '09:00 AM', distanceKm: 0 },
      { stopName: 'Rasulgarh Square', arrivalTime: '09:15 AM', distanceKm: 7 },
      { stopName: 'Cuttack Badambadi Stand', arrivalTime: '09:50 AM', distanceKm: 28 },
    ],
  },
];

export function generateDefaultSeats(busType: string): Seat[] {
  const seats: Seat[] = [];
  const rows = 10;
  const cols = ['A', 'B', 'C', 'D'];
  const basePrice = busType === 'AC Deluxe' ? 140 : 95;

  let idCounter = 1;
  for (let r = 1; r <= rows; r++) {
    for (const c of cols) {
      const label = `${r}${c}`;
      const isBooked = (r === 2 && c === 'B') || (r === 3 && c === 'A') || (r === 5 && c === 'D') || (r === 7 && c === 'C');
      const isHeld = r === 4 && c === 'B';
      const type = c === 'A' || c === 'D' ? 'WINDOW' : 'AISLE';

      seats.push({
        id: `seat-${idCounter++}`,
        row: r,
        col: c.charCodeAt(0) - 64,
        label,
        type,
        status: isBooked ? 'BOOKED' : isHeld ? 'HELD' : 'AVAILABLE',
        price: basePrice,
      });
    }
  }

  return seats;
}

/**
 * Maps Fastify AvailableTripResult to React Native BusService model
 */
export function mapTripResultToBusService(trip: any): BusService {
  const stops = Array.isArray(trip.stops)
    ? trip.stops.map((s: any) => ({
        stopName: s.stopName || 'Stop',
        arrivalTime: s.estimatedMinutesFromStart ? `+${s.estimatedMinutesFromStart}m` : 'On Route',
        distanceKm: s.distanceFromStartKm || 0,
      }))
    : [];

  const depDate = trip.departureTime ? new Date(trip.departureTime) : new Date();
  const arrDate = trip.scheduledArrival ? new Date(trip.scheduledArrival) : new Date(depDate.getTime() + 7200000);

  const depTimeStr = !isNaN(depDate.getTime())
    ? depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '08:00 AM';
  const arrTimeStr = !isNaN(arrDate.getTime())
    ? arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '10:00 AM';
  const diffMinutes = !isNaN(arrDate.getTime()) && !isNaN(depDate.getTime())
    ? Math.max(15, Math.round((arrDate.getTime() - depDate.getTime()) / 60000))
    : 120;
  const durationStr = `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;

  return {
    id: trip.tripId,
    tripId: trip.tripId,
    routeCode: trip.routeCode || 'RB-ROUTE',
    routeName: `${trip.origin || trip.originStop?.stopName || 'Origin'} to ${trip.destination || trip.destinationStop?.stopName || 'Destination'}`,
    busRegistration: trip.busRegistrationNumber || 'OD-BUS',
    busModel: trip.busModel || 'Standard Rural Bus',
    busType: trip.seatingType === 'AC_DELUXE' ? 'AC Deluxe' : trip.seatingType === 'EXPRESS' ? 'Express Seater' : 'Ordinary',
    operatorName: trip.operatorName || 'Rural Transit Operator',
    departureTime: depTimeStr,
    arrivalTime: arrTimeStr,
    duration: durationStr,
    availableSeats: typeof trip.availableSeats === 'number' ? trip.availableSeats : 20,
    totalSeats: typeof trip.totalSeats === 'number' ? trip.totalSeats : 40,
    fare: trip.fareAmount || 50,
    isLive: Boolean(trip.hasLiveGps),
    currentSpeedKmH: trip.liveLocation?.speed,
    nextStopName: trip.destinationStop?.stopName,
    etaMinutes: trip.liveLocation?.etaMinutesToNextStop,
    amenities: ['GPS Tracking', 'Rural Transit Authority', 'Conductor Onboard'],
    stops,
  };
}

class PassengerService {
  /**
   * Search available bus trips via authoritative Fastify backend (/api/v1/discovery/routes)
   */
  async searchRoutes(origin?: string, destination?: string, date?: string): Promise<BusService[]> {
    const queryParams = new URLSearchParams();
    if (origin) queryParams.append('origin', origin);
    if (destination) queryParams.append('destination', destination);
    if (date) queryParams.append('date', date);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_CONFIG.ENDPOINTS.SEARCH_ROUTES}?${queryString}`
      : API_CONFIG.ENDPOINTS.SEARCH_ROUTES;

    const res = await apiClient.get<{ trips?: any[]; totalCount?: number }>(endpoint);
    if (res && res.data && Array.isArray(res.data.trips)) {
      return res.data.trips.map(mapTripResultToBusService);
    }
    return [];
  }

  /**
   * Fetch approved state highway corridors.
   * Note: Fastify backend does not implement a dedicated /discovery/corridors route.
   * In production, corridor definitions are derived from active routes via /api/v1/discovery/routes.
   */
  async getCorridors(): Promise<CorridorRoute[]> {
    try {
      const res = await apiClient.get<{ trips?: any[]; totalCount?: number }>(API_CONFIG.ENDPOINTS.SEARCH_ROUTES);
      if (res && res.data && Array.isArray(res.data.trips) && res.data.trips.length > 0) {
        const corridorMap = new Map<string, CorridorRoute>();
        for (const trip of res.data.trips) {
          const code = trip.routeCode || 'CORRIDOR';
          if (!corridorMap.has(code)) {
            corridorMap.set(code, {
              id: trip.routeId || trip.tripId,
              code,
              name: `${trip.origin || 'Origin'} ↔ ${trip.destination || 'Destination'}`,
              originStop: trip.originStop?.stopName || trip.origin || 'Origin',
              destinationStop: trip.destinationStop?.stopName || trip.destination || 'Destination',
              distanceKm: 50,
              stops: [],
            });
          }
        }
        return Array.from(corridorMap.values());
      }
    } catch {
      // Backend routes query failed or empty
    }
    return [];
  }

  /**
   * Fetch transit stops from authoritative Fastify backend (/api/v1/discovery/stops)
   */
  async getNearbyStops(q?: string): Promise<TransitStop[]> {
    const endpoint = q
      ? `${API_CONFIG.ENDPOINTS.STOPS}?q=${encodeURIComponent(q)}`
      : API_CONFIG.ENDPOINTS.STOPS;

    const res = await apiClient.get<{ stops?: any[] }>(endpoint);
    if (res && res.data && Array.isArray(res.data.stops)) {
      return res.data.stops.map((s: any, idx: number) => ({
        id: s.id,
        code: s.code || `STP-${idx + 1}`,
        name: s.name,
        highwayMarkerKm: typeof s.highwayMarkerKm === 'number' ? s.highwayMarkerKm : idx * 10,
        lat: typeof s.latitude === 'number' ? s.latitude : 20.2961,
        lon: typeof s.longitude === 'number' ? s.longitude : 85.8245,
        district: s.district || 'Odisha',
      }));
    }
    return [];
  }

  /**
   * Authoritative Seat Hold on Fastify backend (/api/v1/bookings/hold)
   */
  async holdSeat(params: {
    tripId: string;
    seatNumber: number;
    boardingStopId: string;
    droppingStopId: string;
  }): Promise<{
    bookingId: string;
    tripId: string;
    seatNumber: number;
    fareAmount: number;
    status: 'HELD';
    lockedUntil: string;
    expiresInSeconds: number;
  }> {
    const res = await apiClient.post<{
      bookingId: string;
      tripId: string;
      seatNumber: number;
      fareAmount: number;
      status: 'HELD';
      lockedUntil: string;
      expiresInSeconds: number;
    }>(API_CONFIG.ENDPOINTS.HOLD_SEAT, {
      tripId: params.tripId,
      seatNumber: params.seatNumber,
      boardingStopId: params.boardingStopId,
      droppingStopId: params.droppingStopId,
    });
    return res.data;
  }

  /**
   * Create Razorpay payment order on Fastify backend (/api/v1/payments/create-order)
   */
  async createPaymentOrder(bookingId: string): Promise<{
    orderId: string;
    amountInPaise: number;
    currency: string;
    bookingId: string;
    keyId: string;
  }> {
    const res = await apiClient.post<{
      orderId: string;
      amountInPaise: number;
      currency: string;
      bookingId: string;
      keyId: string;
    }>(API_CONFIG.ENDPOINTS.CREATE_PAYMENT_ORDER, {
      bookingId,
    });
    return res.data;
  }

  /**
   * Verify Razorpay payment and issue ticket on Fastify backend (/api/v1/payments/verify)
   */
  async verifyPayment(params: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{
    success: boolean;
    bookingId: string;
    ticketId: string;
    status: 'CONFIRMED';
    qrSignature: string;
  }> {
    const res = await apiClient.post<{
      success: boolean;
      bookingId: string;
      ticketId: string;
      status: 'CONFIRMED';
      qrSignature: string;
    }>(API_CONFIG.ENDPOINTS.VERIFY_PAYMENT, params);
    return res.data;
  }

  /**
   * Fetch passenger's authoritative digital bookings (/api/v1/bookings/my-bookings)
   */
  async getTickets(): Promise<PassengerTicket[]> {
    try {
      const res = await apiClient.get<{ bookings?: any[]; totalCount?: number }>(API_CONFIG.ENDPOINTS.MY_BOOKINGS);
      if (res && res.data && Array.isArray(res.data.bookings)) {
        return res.data.bookings.map((b: any) => ({
          id: b.ticketId || b.id,
          pnr: `RB-${(b.id || '').substring(0, 8).toUpperCase()}`,
          tripId: b.tripId,
          routeCode: b.routeCode || 'OD-ROUTE',
          routeName: `${b.origin || 'Origin'} to ${b.destination || 'Destination'}`,
          busRegistration: b.busRegistrationNumber || 'OD-BUS',
          operatorName: b.operatorName || 'Rural Transit Operator',
          origin: b.origin || 'Origin',
          destination: b.destination || 'Destination',
          departureTime: b.departureTime ? new Date(b.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
          arrivalTime: '--',
          journeyDate: b.departureTime ? new Date(b.departureTime).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          seatNumbers: [String(b.seatNumber)],
          totalFare: b.fareAmount || 0,
          passengerName: 'Passenger',
          passengerPhone: '',
          status: (b.status === 'CONFIRMED' || b.status === 'BOARDED' || b.status === 'CANCELLED') ? b.status : 'CONFIRMED',
          paymentMethod: 'UPI' as const,
          qrPayload: b.qrSignature || JSON.stringify({ bookingId: b.id, ticketId: b.ticketId, tripId: b.tripId, seat: b.seatNumber }),
          signature: b.qrSignature || `SIG:${b.id}`,
          bookedAt: b.createdAt || new Date().toISOString(),
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch live vehicle state from authoritative Fastify backend (/api/v1/tracking/trip/:tripId/state)
   */
  async getTripLiveState(tripId: string): Promise<LiveTripState | null> {
    const endpoint = API_CONFIG.ENDPOINTS.TRIP_STATE(tripId);
    const res = await apiClient.get<{ state: any | null; freshness: string }>(endpoint);
    if (!res || !res.data || !res.data.state) {
      return null;
    }

    const state = res.data.state;
    return {
      tripId: state.tripId,
      busRegistration: state.busId || 'BUS-LIVE',
      routeName: state.routeCode || 'Live Route',
      operatorName: state.operatorId || 'Operator',
      status: 'RUNNING',
      currentSpeed: typeof state.speed === 'number' ? state.speed : 0,
      heading: typeof state.heading === 'number' ? state.heading : 0,
      lat: state.latitude,
      lon: state.longitude,
      approachingStop: state.nextStopName || 'En route',
      nextStopEta: state.etaMinutes ? `${state.etaMinutes} mins` : 'Live',
      passedStops: [],
      remainingStops: [],
      lastPingTime: state.receivedAt || new Date().toISOString(),
      isGpsLive: res.data.freshness === 'LIVE',
      isWsConnected: true,
    };
  }
}

export const passengerService = new PassengerService();
