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

export const API_CONFIG = {
  /**
   * HTTP Base URL for Fastify REST endpoints.
   * On Android Emulator use 'http://10.0.2.2:4000'
   * On Web / Localhost use 'http://localhost:4000'
   * On Physical Device use LAN IP (e.g. 'http://192.168.1.x:4000')
   */
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:4000',

  /**
   * WebSocket URL for live GPS telemetry and real-time tracking room subscriptions.
   */
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws/tracking',

  /** Request timeout in milliseconds */
  TIMEOUT_MS: 15000,

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

    // Driver & Conductor Duty
    START_TRIP: '/api/v1/duty/trips/start',
    COMPLETE_TRIP: '/api/v1/duty/trips/complete',
    ASSIGNED_TRIPS: '/api/v1/duty/trips/assigned',
    MANIFEST: (tripId: string) => `/api/v1/tickets/manifest/offline/${tripId}`,
    OFFLINE_CASH_SYNC: '/api/v1/conductor/offline-tickets/sync',

    // Live Telemetry (Fastify: apps/api/src/routes/telemetry.ts)
    GPS_PING: '/api/v1/tracking/ping',
    TRIP_STATE: (tripId: string) => `/api/v1/tracking/trip/${tripId}/state`,
    TRIP_LOCATION: (tripId: string) => `/api/v1/tracking/trip/${tripId}`,
    FLEET_RADAR: '/api/v1/tracking/fleet',

    // Operator Management
    FLEET_BUSES: '/api/v1/operator/buses',
    FLEET_STAFF: '/api/v1/operator/staff',
    ROUTES: '/api/v1/operator/routes',
    SCHEDULES: '/api/v1/operator/schedules',
    REVENUE: '/api/v1/operator/revenue',

    // Super Admin Management (Zero GPS/tracking)
    TENANTS: '/api/v1/admin/tenants',
    ALL_BUSES: '/api/v1/admin/buses',
    ALL_STAFF: '/api/v1/admin/staff',
    AUDIT_LOGS: '/api/v1/admin/audit-logs',
  },
} as const;
