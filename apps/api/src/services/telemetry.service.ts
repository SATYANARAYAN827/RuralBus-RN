import { and, eq, inArray } from 'drizzle-orm';
import { withTenant, withSystemContext, trips, buses, routes, users, stops } from '@ruralbus/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError.js';
import { updateFleetGeo } from './redis.service.js';
import { recordTrajectoryPoint } from './trajectory.service.js';
import type {
  GpsPingPayload,
  LiveTripLocation,
  LiveFleetBus,
  LiveFleetRadarResponse,
  LiveVehicleState,
  GpsFreshness,
  WebSocketMessage,
} from '@ruralbus/shared-types';

// GPS ping validation constants
const MAX_FUTURE_TIMESTAMP_MS = 5 * 60 * 1000;      // 5 minutes ahead
const MAX_PAST_TIMESTAMP_MS   = 24 * 60 * 60 * 1000; // 24 hours behind

// Passenger freshness thresholds
const LIVE_THRESHOLD_MS  = 30 * 1000;      // < 30s = LIVE
const STALE_THRESHOLD_MS = 3 * 60 * 1000;  // 30s-3m = STALE, >3m = OFFLINE

// ─────────────────────────────────────────────────────────────────────────────
// Canonical in-memory live vehicle state cache: tripId -> CanonicalCacheEntry
// ─────────────────────────────────────────────────────────────────────────────

interface CanonicalCacheEntry {
  // Identity
  tripId: string;
  busId: string;
  operatorId: string;  // tenantId
  routeId: string;
  routeCode: string;

  // Position
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;

  // Timestamps
  capturedAt: number;   // driver GPS device timestamp (Unix ms)
  receivedAt: number;   // server receipt timestamp (Unix ms)
  lastUpdated: string;  // ISO-8601 of capturedAt

  // Legacy backward-compat alias
  timestamp: number;    // same as capturedAt

  // Route Progress (Phase 2)
  currentStopSequence?: number;
  currentStopId?: string;
  nextStopSequence?: number;
  nextStopId?: string;

  // ETA (Phase 3)
  etaMinutes?: number;
}

const liveVehicleCache = new Map<string, CanonicalCacheEntry>();

// Last ping server timestamps for rate limiting: tripId -> server timestamp
const lastPingTimestamps = new Map<string, number>();

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket subscriber rooms
// ─────────────────────────────────────────────────────────────────────────────

// tripId -> Set of WebSocket clients
const tripSubscribers = new Map<string, Set<any>>();
// tenantId -> Set of WebSocket clients
const fleetSubscribers = new Map<string, Set<any>>();

export function subscribeToTrip(tripId: string, socket: any): void {
  if (!tripSubscribers.has(tripId)) {
    tripSubscribers.set(tripId, new Set());
  }
  // Set.add is idempotent — safe against duplicate subscriptions
  tripSubscribers.get(tripId)!.add(socket);
}

export function unsubscribeFromTrip(tripId: string, socket: any): void {
  const subs = tripSubscribers.get(tripId);
  if (subs) {
    subs.delete(socket);
    if (subs.size === 0) {
      tripSubscribers.delete(tripId);
    }
  }
}

export function getTripSubscriberCount(tripId: string): number {
  return tripSubscribers.get(tripId)?.size ?? 0;
}

export function subscribeToFleet(tenantId: string, socket: any): void {
  if (!fleetSubscribers.has(tenantId)) {
    fleetSubscribers.set(tenantId, new Set());
  }
  fleetSubscribers.get(tenantId)!.add(socket);
}

export function unsubscribeFromFleet(tenantId: string, socket: any): void {
  const subs = fleetSubscribers.get(tenantId);
  if (subs) {
    subs.delete(socket);
    if (subs.size === 0) {
      fleetSubscribers.delete(tenantId);
    }
  }
}

export function cleanupSocket(socket: any): void {
  for (const [tripId, subs] of tripSubscribers.entries()) {
    subs.delete(socket);
    if (subs.size === 0) tripSubscribers.delete(tripId);
  }
  for (const [tenantId, subs] of fleetSubscribers.entries()) {
    subs.delete(socket);
    if (subs.size === 0) fleetSubscribers.delete(tenantId);
  }
}

/**
 * Evicts a completed/cancelled trip from the live cache and notifies all
 * trip WebSocket subscribers with a TRIP_ENDED event.
 * Must be called from endDriverTrip in duty.service.ts.
 */
export function clearLiveTripCache(tripId: string): void {
  liveVehicleCache.delete(tripId);
  lastPingTimestamps.delete(tripId);

  // Notify all trip subscribers that the trip has ended
  broadcastToTripSubscribers(tripId, {
    type: 'TRIP_ENDED',
    payload: { tripId, endedAt: new Date().toISOString() },
  });
}

export function broadcastToTripSubscribers(tripId: string, message: WebSocketMessage): void {
  const subs = tripSubscribers.get(tripId);
  if (subs) {
    const raw = JSON.stringify(message);
    const deadSockets: any[] = [];
    for (const socket of subs) {
      try {
        if (socket.readyState === 1 /* OPEN */) {
          socket.send(raw);
        } else if (socket.readyState === 2 /* CLOSING */ || socket.readyState === 3 /* CLOSED */) {
          deadSockets.push(socket);
        }
      } catch {
        deadSockets.push(socket);
      }
    }
    for (const dead of deadSockets) {
      subs.delete(dead);
    }
    if (subs.size === 0) {
      tripSubscribers.delete(tripId);
    }
  }
}

export function broadcastToFleetSubscribers(tenantId: string, message: WebSocketMessage): void {
  const targets = [tenantId];
  if (fleetSubscribers.has('*')) targets.push('*');
  if (fleetSubscribers.has('SYSTEM_WIDE')) targets.push('SYSTEM_WIDE');

  const raw = JSON.stringify(message);
  for (const tid of targets) {
    const subs = fleetSubscribers.get(tid);
    if (subs) {
      const deadSockets: any[] = [];
      for (const socket of subs) {
        try {
          if (socket.readyState === 1 /* OPEN */) {
            socket.send(raw);
          } else if (socket.readyState === 2 /* CLOSING */ || socket.readyState === 3 /* CLOSED */) {
            deadSockets.push(socket);
          }
        } catch {
          deadSockets.push(socket);
        }
      }
      for (const dead of deadSockets) {
        subs.delete(dead);
      }
      if (subs.size === 0) {
        fleetSubscribers.delete(tid);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: Server-Side WebSocket Subscription Authorization
// Never trust client-supplied tenantId, operatorId, busId, or tripId.
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionAuthUser {
  sub: string;
  role: string;
  tenantId: string | null;
}

export interface ValidateTripSubscriptionResult {
  authorized: boolean;
  reason?: string;
  trip?: {
    id: string;
    tenantId: string;
    driverId: string | null;
    conductorId: string | null;
    status: string;
    routeId: string;
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function validateTripSubscription(
  tripId: string,
  authUser: SubscriptionAuthUser | null
): Promise<ValidateTripSubscriptionResult> {
  if (!tripId || !UUID_REGEX.test(tripId)) {
    return { authorized: false, reason: 'Invalid or missing tripId UUID' };
  }

  const [trip] = await withSystemContext(async (tx) => {
    return tx
      .select({
        id: trips.id,
        tenantId: trips.tenantId,
        driverId: trips.driverId,
        conductorId: trips.conductorId,
        status: trips.status,
        routeId: trips.routeId,
      })
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);
  });

  if (!trip) {
    return { authorized: false, reason: 'Trip not found or unauthorized' };
  }

  // Super Admin: platform-wide access
  if (authUser?.role === 'PLATFORM_ADMIN') {
    return { authorized: true, trip };
  }

  // Operator Admin (Owner): only trips belonging to their operator
  if (authUser?.role === 'OPERATOR_ADMIN') {
    if (!authUser.tenantId || trip.tenantId !== authUser.tenantId) {
      return { authorized: false, reason: 'Unauthorized: cannot subscribe to cross-tenant trip' };
    }
    return { authorized: true, trip };
  }

  // Driver: only their assigned trip
  if (authUser?.role === 'DRIVER') {
    if (trip.driverId !== authUser.sub || trip.tenantId !== authUser.tenantId) {
      return { authorized: false, reason: 'Unauthorized: driver can only subscribe to their assigned trip' };
    }
    return { authorized: true, trip };
  }

  // Conductor: only their assigned trip
  if (authUser?.role === 'CONDUCTOR') {
    if (trip.conductorId !== authUser.sub || trip.tenantId !== authUser.tenantId) {
      return { authorized: false, reason: 'Unauthorized: conductor can only subscribe to their assigned trip' };
    }
    return { authorized: true, trip };
  }

  // Passenger or Guest: publicly discoverable trip (route must be active)
  if (!authUser || authUser.role === 'PASSENGER') {
    const [route] = await withSystemContext(async (tx) => {
      return tx
        .select({ isActive: routes.isActive })
        .from(routes)
        .where(eq(routes.id, trip.routeId))
        .limit(1);
    });

    if (route && route.isActive === false) {
      return { authorized: false, reason: 'Unauthorized: trip route is not active' };
    }

    return { authorized: true, trip };
  }

  return { authorized: false, reason: 'Unauthorized: unknown role' };
}

export interface ValidateFleetSubscriptionResult {
  authorized: boolean;
  reason?: string;
  targetTenantId?: string;
}

export function validateFleetSubscription(
  clientRequestedTenantId: string | undefined,
  authUser: SubscriptionAuthUser | null
): ValidateFleetSubscriptionResult {
  if (!authUser) {
    return {
      authorized: false,
      reason: 'Authentication required: must be an authenticated tenant member to subscribe to fleet radar',
    };
  }

  if (authUser.role === 'PASSENGER') {
    return { authorized: false, reason: 'Unauthorized: Passenger cannot subscribe to fleet radar' };
  }

  if (authUser.role === 'DRIVER' || authUser.role === 'CONDUCTOR') {
    return {
      authorized: false,
      reason: 'Unauthorized: Driver or Conductor cannot subscribe to fleet radar',
    };
  }

  if (authUser.role === 'OPERATOR_ADMIN') {
    if (!authUser.tenantId) {
      return { authorized: false, reason: 'Unauthorized: Operator admin has no tenant context' };
    }
    // Cross-tenant guard: client cannot override with a different tenantId
    if (clientRequestedTenantId && clientRequestedTenantId !== authUser.tenantId) {
      return { authorized: false, reason: 'Unauthorized: cross-tenant fleet subscription rejected' };
    }
    return { authorized: true, targetTenantId: authUser.tenantId };
  }

  if (authUser.role === 'PLATFORM_ADMIN') {
    return { authorized: true, targetTenantId: clientRequestedTenantId || 'SYSTEM_WIDE' };
  }

  return { authorized: false, reason: 'Unauthorized role for fleet subscription' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service-layer coordinate guard (belt-and-suspenders after schema validation)
// ─────────────────────────────────────────────────────────────────────────────

function assertValidCoordinates(latitude: number, longitude: number): void {
  if (!isFinite(latitude) || isNaN(latitude)) {
    throw new BadRequestError('GPS ping rejected: latitude is NaN or Infinity');
  }
  if (!isFinite(longitude) || isNaN(longitude)) {
    throw new BadRequestError('GPS ping rejected: longitude is NaN or Infinity');
  }
  // Reject null-island: (0, 0) is a common GPS hardware error/sentinel
  if (latitude === 0 && longitude === 0) {
    throw new BadRequestError(
      'GPS ping rejected: (0, 0) coordinates are not a valid real-world location'
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Compute freshness from a receivedAt timestamp (Unix ms)
// ─────────────────────────────────────────────────────────────────────────────

function computeFreshness(receivedAtMs: number): GpsFreshness {
  const ageMs = Date.now() - receivedAtMs;
  if (ageMs < LIVE_THRESHOLD_MS)  return 'LIVE';
  if (ageMs < STALE_THRESHOLD_MS) return 'STALE';
  return 'OFFLINE';
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Progress & Geodesic Calculation (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteStopWithCoords {
  stopId: string;
  sequenceNumber: number;
  stopName: string;
  latitude: number;
  longitude: number;
  distanceFromStartKm?: number;
}

export interface RouteProgressResult {
  currentStopSequence?: number;
  currentStopId?: string;
  nextStopSequence?: number;
  nextStopId?: string;
}

// In-memory cache of route stops with coordinates: routeId -> RouteStopWithCoords[]
const routeStopsCache = new Map<string, RouteStopWithCoords[]>();

export function clearRouteStopsCache(routeId?: string): void {
  if (routeId) {
    routeStopsCache.delete(routeId);
  } else {
    routeStopsCache.clear();
  }
}

/**
 * Calculates geodesic distance between two points in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determines current sequential position on the trip route.
 *
 * Rules:
 *  - current stop sequence must NEVER jump backward (monotonic guard)
 *  - next stop must always be the next stop in the route direction
 *  - before first stop: current = stop[0], next = stop[1]
 *  - between stops: current = departed stop, next = upcoming stop
 *  - at/past final stop: current = stop[last], next = undefined
 */
export function computeRouteProgress(
  lat: number,
  lon: number,
  orderedStops: RouteStopWithCoords[],
  lastKnownSequence: number = 0,
  arrivalThresholdKm: number = 0.5
): RouteProgressResult {
  if (!orderedStops || orderedStops.length === 0) {
    return {};
  }

  // Ensure stops are strictly ordered by sequenceNumber ascending
  const stops = [...orderedStops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const numStops = stops.length;

  if (numStops === 1) {
    return {
      currentStopSequence: stops[0].sequenceNumber,
      currentStopId: stops[0].stopId,
    };
  }

  const distances = stops.map((s) => haversineDistanceKm(lat, lon, s.latitude, s.longitude));

  let lastKnownIdx = 0;
  let hasPriorState = false;
  if (lastKnownSequence > 0) {
    const foundIdx = stops.findIndex((s) => s.sequenceNumber === lastKnownSequence);
    if (foundIdx !== -1) {
      lastKnownIdx = foundIdx;
      hasPriorState = true;
    } else {
      for (let i = numStops - 1; i >= 0; i--) {
        if (stops[i].sequenceNumber <= lastKnownSequence) {
          lastKnownIdx = i;
          hasPriorState = true;
          break;
        }
      }
    }
  }

  let currentIdx = lastKnownIdx;

  if (!hasPriorState) {
    // Initial ping: find nearest stop overall
    let minD = Infinity;
    let nearestIdx = 0;
    for (let i = 0; i < numStops; i++) {
      if (distances[i] < minD) {
        minD = distances[i];
        nearestIdx = i;
      }
    }

    if (nearestIdx === 0) {
      currentIdx = 0;
    } else if (minD <= arrivalThresholdKm) {
      currentIdx = nearestIdx;
    } else {
      // Vehicle is en route between (nearestIdx - 1) and nearestIdx
      currentIdx = nearestIdx - 1;
    }
  } else {
    // Progress check: advance to any forward stop reached
    for (let nextCandidate = lastKnownIdx + 1; nextCandidate < numStops; nextCandidate++) {
      const distToCandidate = distances[nextCandidate];
      if (distToCandidate <= arrivalThresholdKm) {
        currentIdx = nextCandidate;
      } else if (nextCandidate < numStops - 1 && distances[nextCandidate + 1] < distToCandidate) {
        currentIdx = nextCandidate;
      }
    }
  }

  // Monotonic progression guard: sequence must never move backward
  if (currentIdx < lastKnownIdx) {
    currentIdx = lastKnownIdx;
  }

  const currentStop = stops[currentIdx];
  const nextStop = currentIdx < numStops - 1 ? stops[currentIdx + 1] : undefined;

  return {
    currentStopSequence: currentStop.sequenceNumber,
    currentStopId: currentStop.stopId,
    nextStopSequence: nextStop ? nextStop.sequenceNumber : undefined,
    nextStopId: nextStop ? nextStop.stopId : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ETA Calculation (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes ETA in whole minutes from current GPS position to the next stop.
 *
 * Rules enforced:
 *  - Returns undefined if there is no next stop.
 *  - Returns undefined if vehicle speed is zero, invalid, or non-finite.
 *    Never invents or hardcodes a fallback speed.
 *  - Returns undefined if vehicle or next-stop coordinates are invalid or (0,0).
 *  - Returns undefined if computed ETA is negative or non-finite.
 *  - Rounds to the nearest whole minute (minimum 0 minutes when essentially arrived).
 *
 * Formula: etaMinutes = (distanceKm / speedKmh) * 60
 */
export function computeEtaMinutes(
  vehicleLat: number,
  vehicleLon: number,
  nextStop: RouteStopWithCoords | undefined,
  speedKmh: number
): number | undefined {
  // Guard: no next stop
  if (!nextStop) return undefined;

  // Guard: invalid vehicle coordinates
  if (
    !isFinite(vehicleLat) || isNaN(vehicleLat) ||
    !isFinite(vehicleLon) || isNaN(vehicleLon) ||
    (vehicleLat === 0 && vehicleLon === 0)
  ) {
    return undefined;
  }

  // Guard: invalid next-stop coordinates
  if (
    !isFinite(nextStop.latitude) || isNaN(nextStop.latitude) ||
    !isFinite(nextStop.longitude) || isNaN(nextStop.longitude) ||
    (nextStop.latitude === 0 && nextStop.longitude === 0)
  ) {
    return undefined;
  }

  // Guard: speed unavailable, zero, or non-finite — do NOT invent a fallback
  if (!isFinite(speedKmh) || isNaN(speedKmh) || speedKmh <= 0) {
    return undefined;
  }

  const distanceKm = haversineDistanceKm(vehicleLat, vehicleLon, nextStop.latitude, nextStop.longitude);

  // Guard: non-finite distance (should not happen with valid coords, but be safe)
  if (!isFinite(distanceKm) || isNaN(distanceKm) || distanceKm < 0) {
    return undefined;
  }

  const etaRaw = (distanceKm / speedKmh) * 60; // minutes

  // Guard: non-finite or negative result
  if (!isFinite(etaRaw) || isNaN(etaRaw) || etaRaw < 0) {
    return undefined;
  }

  return Math.round(etaRaw);
}

/**
 * Ingests a high-frequency GPS ping from a driver.
 *
 * Auth rules:
 *  - tenantId from JWT must own the trip (cross-tenant isolation via withTenant)
 *  - driverUserId from JWT must be the designated driver of the trip
 *  - trip must be IN_TRANSIT
 */
export async function processGpsPing(
  tenantId: string,
  driverUserId: string,
  payload: GpsPingPayload
): Promise<{ tripLocation: LiveTripLocation; fleetBus: LiveFleetBus; liveVehicleState: LiveVehicleState }> {
  // 1. Service-layer coordinate guard (belt-and-suspenders; schema validates too)
  assertValidCoordinates(payload.latitude, payload.longitude);

  // 2. Authoritative verification of trip and tenant ownership FIRST
  const [trip] = await withTenant(tenantId, async (tx) => {
    return tx
      .select({
        id: trips.id,
        busId: trips.busId,
        routeId: trips.routeId,
        driverId: trips.driverId,
        status: trips.status,
        busRegistration: buses.registrationNumber,
        routeCode: routes.routeCode,
        driverName: users.fullName,
        stopsData: routes.stopsData,
      })
      .from(trips)
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(users, eq(trips.driverId, users.id))
      .where(and(eq(trips.id, payload.tripId), eq(trips.tenantId, tenantId)));
  });

  if (!trip) {
    throw new NotFoundError('Trip not found or does not belong to your tenant');
  }

  if (trip.driverId !== driverUserId) {
    throw new ForbiddenError('You are not the designated driver for this trip');
  }

  // Trip status gate — only active trips may receive GPS pings (BOARDING is pre-departure)
  if (trip.status !== 'IN_TRANSIT') {
    throw new BadRequestError(
      `GPS ping rejected: trip status is '${trip.status}'. Only IN_TRANSIT trips accept GPS pings.`
    );
  }

  const now = Date.now();
  const capturedAt = payload.timestamp ?? now;

  if (capturedAt > now + MAX_FUTURE_TIMESTAMP_MS) {
    throw new BadRequestError('GPS ping timestamp is too far in the future (> 5m)');
  }
  if (capturedAt < now - MAX_PAST_TIMESTAMP_MS) {
    throw new BadRequestError('GPS ping timestamp is too far in the past (> 24h)');
  }

  const cached = liveVehicleCache.get(payload.tripId);

  // Out-of-order ping check: if an incoming ping is older than the current cached
  // capturedAt, ignore it to prevent reverting to an older position
  if (cached && payload.timestamp && payload.timestamp < cached.capturedAt) {
    const tripLocation: LiveTripLocation = {
      tripId:      cached.tripId,
      busId:       cached.busId,
      routeCode:   cached.routeCode,
      latitude:    cached.latitude,
      longitude:   cached.longitude,
      speed:       cached.speed,
      heading:     cached.heading,
      timestamp:   cached.capturedAt,
      lastUpdated: cached.lastUpdated,
      etaMinutes:  cached.etaMinutes,
    };
    const liveVehicleState: LiveVehicleState = {
      tripId:              cached.tripId,
      busId:               cached.busId,
      operatorId:          cached.operatorId,
      routeId:             cached.routeId,
      routeCode:           cached.routeCode,
      latitude:            cached.latitude,
      longitude:           cached.longitude,
      speed:               cached.speed,
      heading:             cached.heading,
      capturedAt:          cached.capturedAt,
      receivedAt:          new Date(cached.receivedAt).toISOString(),
      lastUpdated:         cached.lastUpdated,
      freshness:           computeFreshness(cached.receivedAt),
      currentStopSequence: cached.currentStopSequence,
      currentStopId:       cached.currentStopId,
      nextStopSequence:    cached.nextStopSequence,
      nextStopId:          cached.nextStopId,
      etaMinutes:          cached.etaMinutes,
    };
    return {
      tripLocation,
      fleetBus: {
        busId:              cached.busId,
        registrationNumber: trip.busRegistration,
        tripId:             cached.tripId,
        routeCode:          cached.routeCode,
        driverName:         trip.driverName,
        latitude:           cached.latitude,
        longitude:          cached.longitude,
        speed:              cached.speed,
        heading:            cached.heading,
        lastPingAt:         cached.lastUpdated,
        status:             trip.status as any,
      },
      liveVehicleState,
    };
  }

  const lastPing = lastPingTimestamps.get(payload.tripId) || 0;

  // Rate limit check after verification (1 ping per second max)
  if (now - lastPing < 1000) {
    if (cached) {
      const tripLocation: LiveTripLocation = {
        tripId:      cached.tripId,
        busId:       cached.busId,
        routeCode:   cached.routeCode,
        latitude:    cached.latitude,
        longitude:   cached.longitude,
        speed:       cached.speed,
        heading:     cached.heading,
        timestamp:   cached.capturedAt,
        lastUpdated: cached.lastUpdated,
        etaMinutes:  cached.etaMinutes,
      };
      const liveVehicleState: LiveVehicleState = {
        tripId:              cached.tripId,
        busId:               cached.busId,
        operatorId:          cached.operatorId,
        routeId:             cached.routeId,
        routeCode:           cached.routeCode,
        latitude:            cached.latitude,
        longitude:           cached.longitude,
        speed:               cached.speed,
        heading:             cached.heading,
        capturedAt:          cached.capturedAt,
        receivedAt:          new Date(cached.receivedAt).toISOString(),
        lastUpdated:         cached.lastUpdated,
        freshness:           computeFreshness(cached.receivedAt),
        currentStopSequence: cached.currentStopSequence,
        currentStopId:       cached.currentStopId,
        nextStopSequence:    cached.nextStopSequence,
        nextStopId:          cached.nextStopId,
        etaMinutes:          cached.etaMinutes,
      };
      return {
        tripLocation,
        fleetBus: {
          busId:              cached.busId,
          registrationNumber: trip.busRegistration,
          tripId:             cached.tripId,
          routeCode:          cached.routeCode,
          driverName:         trip.driverName,
          latitude:           cached.latitude,
          longitude:          cached.longitude,
          speed:              cached.speed,
          heading:            cached.heading,
          lastPingAt:         cached.lastUpdated,
          status:             'IN_TRANSIT',
        },
        liveVehicleState,
      };
    }
  }

  lastPingTimestamps.set(payload.tripId, now);

  const speed      = payload.speed ?? 0;
  const heading    = payload.heading ?? 0;
  const lastUpdated = new Date(capturedAt).toISOString();

  // Load and cache route stops with geographic coordinates
  let routeStops = routeStopsCache.get(trip.routeId);
  if (!routeStops && trip.stopsData && trip.stopsData.length > 0) {
    try {
      const stopIds = trip.stopsData.map((s: any) => s.stopId).filter(Boolean);
      if (stopIds.length > 0) {
        const stopRows = await withSystemContext(async (tx) => {
          return tx
            .select({
              id: stops.id,
              latitude: stops.latitude,
              longitude: stops.longitude,
            })
            .from(stops)
            .where(inArray(stops.id, stopIds));
        });

        const coordMap = new Map(stopRows.map((r) => [r.id, r]));
        const resolved: RouteStopWithCoords[] = [];
        for (const s of trip.stopsData) {
          const coord = coordMap.get(s.stopId);
          if (coord) {
            resolved.push({
              stopId: s.stopId,
              sequenceNumber: Number(s.sequenceNumber),
              stopName: s.stopName,
              latitude: Number(coord.latitude),
              longitude: Number(coord.longitude),
              distanceFromStartKm: Number(s.distanceFromStartKm || 0),
            });
          }
        }
        resolved.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        routeStops = resolved;
        routeStopsCache.set(trip.routeId, resolved);
      }
    } catch (err) {
      // Non-fatal if stops resolution fails
    }
  }

  const lastKnownSeq = cached?.currentStopSequence ?? 0;
  const progress = routeStops && routeStops.length > 0
    ? computeRouteProgress(payload.latitude, payload.longitude, routeStops, lastKnownSeq)
    : {};

  // Phase 3: Compute ETA to next stop using real GPS speed and Haversine distance.
  // Never invents speed; returns undefined if speed is zero/invalid or no next stop.
  const nextStopForEta = progress.nextStopSequence != null && routeStops
    ? routeStops.find((s) => s.sequenceNumber === progress.nextStopSequence)
    : undefined;
  const etaMinutes = computeEtaMinutes(
    payload.latitude,
    payload.longitude,
    nextStopForEta,
    speed
  );

  // Write canonical cache entry
  const cacheEntry: CanonicalCacheEntry = {
    tripId:      trip.id,
    busId:       trip.busId,
    operatorId:  tenantId,
    routeId:     trip.routeId,
    routeCode:   trip.routeCode,
    latitude:    payload.latitude,
    longitude:   payload.longitude,
    speed,
    heading,
    capturedAt,
    receivedAt:  now,
    lastUpdated,
    timestamp:   capturedAt, // backward-compat alias
    currentStopSequence: progress.currentStopSequence,
    currentStopId:       progress.currentStopId,
    nextStopSequence:    progress.nextStopSequence,
    nextStopId:          progress.nextStopId,
    etaMinutes,
  };
  liveVehicleCache.set(payload.tripId, cacheEntry);

  const nextStopName = progress.nextStopSequence != null && routeStops
    ? routeStops.find((s) => s.sequenceNumber === progress.nextStopSequence)?.stopName
    : undefined;

  // Build canonical LiveVehicleState (Phase 1–4 primary model)
  const liveVehicleState: LiveVehicleState = {
    tripId:              trip.id,
    busId:               trip.busId,
    operatorId:          tenantId,
    routeId:             trip.routeId,
    routeCode:           trip.routeCode,
    latitude:            payload.latitude,
    longitude:           payload.longitude,
    speed,
    heading,
    capturedAt,
    receivedAt:          new Date(now).toISOString(),
    lastUpdated,
    freshness:           'LIVE',
    currentStopSequence: progress.currentStopSequence,
    currentStopId:       progress.currentStopId,
    nextStopSequence:    progress.nextStopSequence,
    nextStopId:          progress.nextStopId,
    etaMinutes,
  };

  // Build legacy broadcast shapes (preserved for backward compat with existing WS consumers)
  const tripLocation: LiveTripLocation = {
    tripId:      trip.id,
    busId:       trip.busId,
    routeCode:   trip.routeCode,
    latitude:    payload.latitude,
    longitude:   payload.longitude,
    speed,
    heading,
    timestamp:   capturedAt,
    lastUpdated,
    nextStopName,
    etaMinutes,
  };

  const fleetBus: LiveFleetBus = {
    busId:              trip.busId,
    registrationNumber: trip.busRegistration,
    tripId:             trip.id,
    routeCode:          trip.routeCode,
    driverName:         trip.driverName,
    latitude:           payload.latitude,
    longitude:          payload.longitude,
    speed,
    heading,
    lastPingAt:         lastUpdated,
    status:             trip.status as any,
  };

  // Buffer in live trajectory for post-trip PostGIS RDP compression
  recordTrajectoryPoint(payload.tripId, {
    latitude:  payload.latitude,
    longitude: payload.longitude,
    speed,
    heading,
    timestamp: capturedAt,
  });

  // Update Redis Geospatial Index for fleet radar
  await updateFleetGeo(tenantId, trip.busId, payload.longitude, payload.latitude);

  // Real-time broadcast:
  // 1. Broadcast canonical LiveVehicleState to authorized trip subscribers
  broadcastToTripSubscribers(payload.tripId, {
    type: 'LIVE_VEHICLE_STATE',
    payload: liveVehicleState,
  });

  // 2. To operator dispatchers subscribed to tenant fleet radar
  broadcastToFleetSubscribers(tenantId, {
    type: 'FLEET_RADAR_UPDATE',
    payload: fleetBus,
  });

  return { tripLocation, fleetBus, liveVehicleState };
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical read model: getLiveVehicleState
// Phase 1 canonical endpoint consumed by all future map consumers.
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveVehicleStateResponse {
  state: LiveVehicleState | null;
  freshness: GpsFreshness;
}

/**
 * Returns the canonical LiveVehicleState for a trip with freshness computed
 * at read time. This is the primary read model for all Phase 1+ map consumers.
 *
 * - NO_DATA: no GPS ping ever received, or trip has ended (cache evicted)
 * - OFFLINE:  last ping > 3 minutes ago
 * - STALE:    last ping 30s – 3m ago
 * - LIVE:     last ping < 30s ago
 */
export function getLiveVehicleState(tripId: string): LiveVehicleStateResponse {
  const cached = liveVehicleCache.get(tripId);
  if (!cached) {
    return { state: null, freshness: 'NO_DATA' };
  }

  const freshness = computeFreshness(cached.receivedAt);

  const state: LiveVehicleState = {
    tripId:              cached.tripId,
    busId:               cached.busId,
    operatorId:          cached.operatorId,
    routeId:             cached.routeId,
    routeCode:           cached.routeCode,
    latitude:            cached.latitude,
    longitude:           cached.longitude,
    speed:               cached.speed,
    heading:             cached.heading,
    capturedAt:          cached.capturedAt,
    receivedAt:          new Date(cached.receivedAt).toISOString(),
    lastUpdated:         cached.lastUpdated,
    freshness,
    currentStopSequence: cached.currentStopSequence,
    currentStopId:       cached.currentStopId,
    nextStopSequence:    cached.nextStopSequence,
    nextStopId:          cached.nextStopId,
    etaMinutes:          cached.etaMinutes,
  };

  return { state, freshness };
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy read model: getTripLiveLocation (preserved for backward compat)
// New consumers should use getLiveVehicleState() instead.
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveLocationResponse {
  location: LiveTripLocation | null;
  freshness: GpsFreshness;
  receivedAt: string | null;
}

/**
 * Returns the latest cached GPS location for a trip WITH a freshness status.
 * LIVE    < 30 seconds since last ping
 * STALE   30 seconds – 3 minutes
 * OFFLINE > 3 minutes
 * NO_DATA no ping ever received
 *
 * @deprecated New consumers should use getLiveVehicleState().
 */
export function getTripLiveLocation(tripId: string): LiveLocationResponse {
  const cached = liveVehicleCache.get(tripId);
  if (!cached) {
    return { location: null, freshness: 'NO_DATA', receivedAt: null };
  }

  const freshness = computeFreshness(cached.receivedAt);

  const location: LiveTripLocation = {
    tripId:      cached.tripId,
    busId:       cached.busId,
    routeCode:   cached.routeCode,
    latitude:    cached.latitude,
    longitude:   cached.longitude,
    speed:       cached.speed,
    heading:     cached.heading,
    timestamp:   cached.capturedAt,
    lastUpdated: cached.lastUpdated,
    etaMinutes:  cached.etaMinutes,
  };

  return {
    location,
    freshness,
    receivedAt: new Date(cached.receivedAt).toISOString(),
  };
}

/**
 * Returns active live fleet positions for a transport operator.
 */
export async function getFleetRadar(tenantId: string): Promise<LiveFleetRadarResponse> {
  const activeTrips = await withTenant(tenantId, async (tx) => {
    return tx
      .select({
        id: trips.id,
        busId: trips.busId,
        busRegistration: buses.registrationNumber,
        routeCode: routes.routeCode,
        driverName: users.fullName,
        status: trips.status,
      })
      .from(trips)
      .innerJoin(buses, eq(trips.busId, buses.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(users, eq(trips.driverId, users.id))
      .where(
        and(
          eq(trips.tenantId, tenantId),
          eq(trips.status, 'IN_TRANSIT')
        )
      );
  });

  const fleetBuses: LiveFleetBus[] = [];

  for (const t of activeTrips) {
    const cachedLoc = liveVehicleCache.get(t.id);
    if (cachedLoc) {
      fleetBuses.push({
        busId:              t.busId,
        registrationNumber: t.busRegistration,
        tripId:             t.id,
        routeCode:          t.routeCode,
        driverName:         t.driverName,
        latitude:           cachedLoc.latitude,
        longitude:          cachedLoc.longitude,
        speed:              cachedLoc.speed,
        heading:            cachedLoc.heading,
        lastPingAt:         cachedLoc.lastUpdated,
        status:             'IN_TRANSIT',
      });
    }
  }

  return {
    tenantId,
    buses:       fleetBuses,
    totalActive: fleetBuses.length,
    lastUpdated: new Date().toISOString(),
  };
}