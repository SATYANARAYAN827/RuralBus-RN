/**
 * RuralBus React Native Frontend - API Connection Configuration
 *
 * CRITICAL ARCHITECTURAL RULE:
 * This new React Native project is FRONTEND ONLY.
 * It connects directly to the EXISTING Fastify backend server in:
 * c:\Users\admin\OneDrive\Documents\RURAL BUS\apps\api (port 4000).
 *
 * DO NOT copy, rewrite, duplicate, or modify the backend.
 */

const getEnvVar = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Production Render backend URL — used when EXPO_PUBLIC_API_URL env var is not set.
 * On Vercel, if the env var is not configured in the Vercel dashboard, this ensures
 * the app still works correctly in production.
 */
const PRODUCTION_API_URL = 'https://ruralbus-rn.onrender.com';

const rawBaseUrl =
  getEnvVar('EXPO_PUBLIC_API_URL') ||
  getEnvVar('REACT_APP_API_URL') ||
  PRODUCTION_API_URL;

const derivedWsUrl = rawBaseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws/tracking';


export const API_CONFIG = {
  /**
   * HTTP Base URL for Fastify REST endpoints.
   * On Android Emulator use 'http://10.0.2.2:4000'
   * On Web / Localhost use 'http://localhost:4000'
   * On Cloud / Production use 'https://<your-render-url>.onrender.com'
   */
  BASE_URL: rawBaseUrl,

  /**
   * WebSocket URL for live GPS telemetry and real-time tracking room subscriptions.
   */
  WS_URL: getEnvVar('EXPO_PUBLIC_WS_URL') || getEnvVar('REACT_APP_WS_URL') || derivedWsUrl,

  /** Request timeout in milliseconds (60s to gracefully accommodate Render cold-starts) */
  TIMEOUT_MS: 60000,

  /** API Endpoints Catalog (Authoritative Backend in RURAL BUS/apps/api) */
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    OTP_REQUEST: '/api/v1/auth/otp/request',
    OTP_VERIFY: '/api/v1/auth/otp/verify',
    PASSWORD_RESET: '/api/v1/auth/password-reset',
    FORCE_CHANGE_PASSWORD: '/api/v1/auth/force-change-password',

    // Discovery (Fastify: apps/api/src/routes/discovery.ts)
    SEARCH_ROUTES: '/api/v1/discovery/routes',
    STOPS: '/api/v1/discovery/stops',
    TRIP_DETAIL: (tripId: string) => `/api/v1/discovery/trips/${tripId}`,

    // Bookings & Payments (Fastify: apps/api/src/routes/booking.ts & payment.ts)
    TRIP_SEATS: (tripId: string) => `/api/v1/bookings/trips/${tripId}/seats`,
    HOLD_SEAT: '/api/v1/bookings/hold',
    RELEASE_HOLD: (bookingId: string) => `/api/v1/bookings/${bookingId}/hold`,
    MY_BOOKINGS: '/api/v1/bookings/my-bookings',
    CREATE_PAYMENT_ORDER: '/api/v1/payments/create-order',
    VERIFY_PAYMENT: '/api/v1/payments/verify',
    TICKET_DETAIL: (id: string) => `/api/v1/tickets/${id}`,

    // Driver & Conductor Duty (Fastify: apps/api/src/routes/duty.ts)
    DRIVER_DUTY: '/api/v1/driver/duty',
    DRIVER_START_TRIP: (tripId: string) => `/api/v1/driver/duty/${tripId}/start`,
    DRIVER_END_TRIP: (tripId: string) => `/api/v1/driver/duty/${tripId}/end`,
    DRIVER_HISTORY: '/api/v1/driver/history',
    START_TRIP: '/api/v1/duty/trips/start',
    COMPLETE_TRIP: '/api/v1/duty/trips/complete',
    ASSIGNED_TRIPS: '/api/v1/duty/trips/assigned',
    MANIFEST: (tripId: string) => `/api/v1/tickets/manifest/offline/${tripId}`,
    OFFLINE_CASH_SYNC: '/api/v1/conductor/offline-tickets/sync',

    // Conductor Endpoints (Fastify: apps/api/src/routes/duty.ts, ticket.ts, offline-cash-ticket.ts)
    CONDUCTOR_DUTY: '/api/v1/conductor/duty',
    CONDUCTOR_MANIFEST: (tripId: string) => `/api/v1/conductor/manifest/${tripId}`,
    CONDUCTOR_BOARD_PASSENGER: (tripId: string, ticketId: string) =>
      `/api/v1/conductor/manifest/${tripId}/board/${ticketId}`,
    CONDUCTOR_STATS: '/api/v1/conductor/stats',
    VALIDATE_QR_TICKET: '/api/v1/tickets/validate-qr',
    OFFLINE_MANIFEST: (tripId: string) => `/api/v1/tickets/manifest/offline/${tripId}`,
    CONDUCTOR_CASH_TICKET: '/api/v1/conductor/cash-ticket',
    CONDUCTOR_OFFLINE_CASH_SYNC: '/api/v1/conductor/offline-tickets/sync',
    CONDUCTOR_CASH_SETTLEMENT: (tripId: string) => `/api/v1/conductor/cash-settlement/${tripId}`,

    // Live Telemetry (Fastify: apps/api/src/routes/telemetry.ts & trajectory.ts)
    GPS_PING: '/api/v1/tracking/ping',
    TRIP_STATE: (tripId: string) => `/api/v1/tracking/trip/${tripId}/state`,
    TRIP_LOCATION: (tripId: string) => `/api/v1/tracking/trip/${tripId}`,
    TRIP_TRAJECTORY: (tripId: string) => `/api/v1/trips/${tripId}/trajectory`,
    FLEET_RADAR: '/api/v1/tracking/fleet',

    // Operator Management (Fastify: apps/api/src/routes/operator.ts & fleet.ts)
    OPERATOR_PROFILE: '/api/v1/operator/profile',
    OPERATOR_BUSES: '/api/v1/operator/buses',
    OPERATOR_BUS_DETAIL: (busId: string) => `/api/v1/operator/buses/${busId}`,
    OPERATOR_STAFF: '/api/v1/operator/staff',
    OPERATOR_STAFF_DETAIL: (staffId: string) => `/api/v1/operator/staff/${staffId}`,
    OPERATOR_STAFF_STATUS: (staffId: string) => `/api/v1/operator/staff/${staffId}/status`,
    OPERATOR_STAFF_RESET_PASSWORD: (staffId: string) => `/api/v1/operator/staff/${staffId}/reset-password`,
    OPERATOR_STOPS: '/api/v1/operator/stops',
    OPERATOR_STOP_DETAIL: (stopId: string) => `/api/v1/operator/stops/${stopId}`,
    OPERATOR_ROUTES: '/api/v1/operator/routes',
    OPERATOR_ROUTE_DETAIL: (routeId: string) => `/api/v1/operator/routes/${routeId}`,
    OPERATOR_SCHEDULES: '/api/v1/operator/schedules',
    OPERATOR_SCHEDULE_DETAIL: (scheduleId: string) => `/api/v1/operator/schedules/${scheduleId}`,
    OPERATOR_TRIPS: '/api/v1/operator/trips',
    OPERATOR_DISPATCH_TRIP: '/api/v1/operator/trips/dispatch',
    OPERATOR_TRIP_STATUS: (tripId: string) => `/api/v1/operator/trips/${tripId}/status`,
    OPERATOR_REVENUE: '/api/v1/operator/revenue',
    OPERATOR_STATS: '/api/v1/operator/stats',
    FLEET_BUSES: '/api/v1/operator/buses',
    FLEET_STAFF: '/api/v1/operator/staff',
    ROUTES: '/api/v1/operator/routes',
    SCHEDULES: '/api/v1/operator/schedules',
    REVENUE: '/api/v1/operator/revenue',

    // Super Admin / Platform Admin Management (Zero GPS/tracking)
    // Backend: apps/api/src/routes/tenant.ts (PLATFORM_ADMIN gated)
    SA_LIST_OPERATORS: '/api/v1/tenant/operators',
    SA_OPERATOR_DETAIL: (tenantId: string) => `/api/v1/tenant/operators/${tenantId}`,
    SA_OPERATOR_BUSES: (tenantId: string) => `/api/v1/tenant/operators/${tenantId}/buses`,
    // Staff management for Super Admin uses the same operator staff endpoints
    // with optional tenantId query (PLATFORM_ADMIN reads all; body for write)
    // See: API_CONFIG.ENDPOINTS.OPERATOR_STAFF, OPERATOR_STAFF_DETAIL, OPERATOR_STAFF_STATUS
  },
} as const;
