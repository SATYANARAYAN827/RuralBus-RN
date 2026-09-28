// ─────────────────────────────────────────────────────────────────────────────
// GPS Ping payload sent by the driver app
// ─────────────────────────────────────────────────────────────────────────────

export interface GpsPingPayload {
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// GPS freshness levels — computed at read time from receivedAt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LIVE    < 30 seconds since last ping
 * STALE   30 seconds – 3 minutes
 * OFFLINE > 3 minutes since last ping
 * NO_DATA no GPS ping ever received for this trip
 */
export type GpsFreshness = 'LIVE' | 'STALE' | 'OFFLINE' | 'NO_DATA';

// ─────────────────────────────────────────────────────────────────────────────
// Canonical LiveVehicleState — the single unified read model for ALL consumers
// (Driver app, Passenger app, Conductor app, Owner dashboard, SuperAdmin radar)
//
// Phase 2 will populate currentStop*/nextStop* once route-progress calculation
// is implemented. Fields are optional so Phase 1 is not blocked by Phase 2.
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveVehicleState {
  /** Trip identifier — primary key for this live state record */
  tripId: string;
  /** Bus identifier */
  busId: string;
  /** Tenant / Operator identifier (for multi-tenant access control) */
  operatorId: string;
  /** Route identifier */
  routeId: string;
  /** Route code (human-readable) */
  routeCode: string;

  // ── Position ──────────────────────────────────────────────────────────────
  latitude: number;
  longitude: number;
  speed: number;        // km/h
  heading: number;      // degrees 0–360

  // ── Timestamps ────────────────────────────────────────────────────────────
  /** GPS timestamp as reported by the driver device (Unix ms) */
  capturedAt: number;
  /** ISO-8601 string of when the server received the ping */
  receivedAt: string;
  /** ISO-8601 string alias of capturedAt for display convenience */
  lastUpdated: string;

  // ── Freshness ─────────────────────────────────────────────────────────────
  /** Computed at read time — reflects how recent the last GPS ping was */
  freshness: GpsFreshness;

  // ── Route Progress (populated by Phase 2) ─────────────────────────────────
  /** Sequence number of the stop the bus most recently departed or is at */
  currentStopSequence?: number;
  /** Stop ID of the current/most-recently-passed stop */
  currentStopId?: string;
  /** Sequence number of the stop the bus is heading towards */
  nextStopSequence?: number;
  /** Stop ID of the next stop */
  nextStopId?: string;
  /** ETA to next stop in whole minutes (Phase 3). Undefined if no next stop or speed unavailable. */
  etaMinutes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveTripLocation — legacy trip-scoped broadcast type (backward compat).
// Internal consumers should prefer LiveVehicleState going forward.
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveTripLocation {
  tripId: string;
  busId: string;
  routeCode: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  /** Unix ms GPS device timestamp */
  timestamp: number;
  /** ISO-8601 string of GPS timestamp */
  lastUpdated: string;
  nextStopName?: string;
  etaMinutes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveFleetBus — operator fleet radar entry
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveFleetBus {
  busId: string;
  registrationNumber: string;
  tripId: string;
  routeCode: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  lastPingAt: string;
  status: 'IN_TRANSIT' | 'BOARDING' | 'SCHEDULED' | 'IDLE';
}

export interface LiveFleetRadarResponse {
  tenantId: string;
  buses: LiveFleetBus[];
  totalActive: number;
  lastUpdated: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket message types
// ─────────────────────────────────────────────────────────────────────────────

export type WebSocketMessageType =
  | 'GPS_PING'
  | 'SUBSCRIBE_TRIP'
  | 'UNSUBSCRIBE_TRIP'
  | 'SUBSCRIBE_FLEET'
  | 'UNSUBSCRIBE_FLEET'
  | 'LIVE_VEHICLE_STATE'
  | 'TRIP_LOCATION_UPDATE'
  | 'FLEET_RADAR_UPDATE'
  | 'TRIP_ENDED'
  | 'PING'
  | 'PONG'
  | 'ERROR';

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload?: T;
  error?: string;
}
