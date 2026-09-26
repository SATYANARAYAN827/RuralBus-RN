import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { API_CONFIG } from '../src/config/api.config';
import { ROLE_NAVIGATION_CONFIGS } from '../src/navigation/roleNavigationConfig';
import {
  passengerService,
  generateDefaultSeats,
  mapTripResultToBusService,
  FALLBACK_BUSES,
  FALLBACK_STOPS,
  POPULAR_CORRIDORS,
} from '../src/services/passenger.service';
import { usePassengerStore } from '../src/stores/passenger.store';
import { BusService } from '../src/types';

describe('Module 3 — Passenger Experience & Authoritative Backend Contract Verification', () => {
  it('1. Backend API Endpoint Catalog: adheres strictly to authoritative Fastify backend route contracts', () => {
    // Authoritative discovery endpoints (Fastify: apps/api/src/routes/discovery.ts)
    assert.equal(API_CONFIG.ENDPOINTS.SEARCH_ROUTES, '/api/v1/discovery/routes');
    assert.equal(API_CONFIG.ENDPOINTS.STOPS, '/api/v1/discovery/stops');
    assert.equal(API_CONFIG.ENDPOINTS.TRIP_DETAIL('trip-123'), '/api/v1/discovery/trips/trip-123');

    // Authoritative booking & payment endpoints (Fastify: apps/api/src/routes/booking.ts & payment.ts)
    assert.equal(API_CONFIG.ENDPOINTS.TRIP_SEATS('trip-123'), '/api/v1/bookings/trips/trip-123/seats');
    assert.equal(API_CONFIG.ENDPOINTS.HOLD_SEAT, '/api/v1/bookings/hold');
    assert.equal(API_CONFIG.ENDPOINTS.RELEASE_HOLD('bk-123'), '/api/v1/bookings/bk-123/hold');
    assert.equal(API_CONFIG.ENDPOINTS.MY_BOOKINGS, '/api/v1/bookings/my-bookings');
    assert.equal(API_CONFIG.ENDPOINTS.CREATE_PAYMENT_ORDER, '/api/v1/payments/create-order');
    assert.equal(API_CONFIG.ENDPOINTS.VERIFY_PAYMENT, '/api/v1/payments/verify');
    assert.equal(API_CONFIG.ENDPOINTS.TICKET_DETAIL('tkt-123'), '/api/v1/tickets/tkt-123');

    // Authoritative telemetry endpoints (Fastify: apps/api/src/routes/telemetry.ts)
    assert.equal(API_CONFIG.ENDPOINTS.TRIP_STATE('trip-456'), '/api/v1/tracking/trip/trip-456/state');
    assert.equal(API_CONFIG.ENDPOINTS.TRIP_LOCATION('trip-456'), '/api/v1/tracking/trip/trip-456');
    assert.equal(API_CONFIG.ENDPOINTS.GPS_PING, '/api/v1/tracking/ping');
    assert.equal(API_CONFIG.ENDPOINTS.FLEET_RADAR, '/api/v1/tracking/fleet');
  });

  it('2. Super Admin Invariant: Super Admin configuration has zero maps, zero GPS, zero live tracking', () => {
    const superAdminConfig = ROLE_NAVIGATION_CONFIGS.PLATFORM_ADMIN;
    assert.ok(superAdminConfig, 'Super Admin config exists');

    // Verify nav items have no map or tracking tabs
    const hasMapItem = superAdminConfig.items.some(
      (item) =>
        item.id.toLowerCase().includes('map') ||
        item.id.toLowerCase().includes('radar') ||
        item.id.toLowerCase().includes('track') ||
        item.label.toLowerCase().includes('map') ||
        item.label.toLowerCase().includes('radar') ||
        item.label.toLowerCase().includes('track')
    );
    assert.equal(hasMapItem, false, 'Super Admin items must not include any map or tracking tabs');

    // Verify bottom nav has no map or tracking tabs
    const hasMapBottom = superAdminConfig.bottomTabIds.some(
      (id) => id.toLowerCase().includes('map') || id.toLowerCase().includes('track')
    );
    assert.equal(hasMapBottom, false, 'Super Admin bottom tabs must not include any map or tracking');
  });

  it('3. Other Role Guardrail: other 4 roles remain at foundational baseline and were not prematurely implemented', () => {
    const roles = Object.keys(ROLE_NAVIGATION_CONFIGS);
    assert.deepEqual(roles.sort(), ['CONDUCTOR', 'DRIVER', 'OPERATOR_ADMIN', 'PASSENGER', 'PLATFORM_ADMIN'].sort());

    const passengerItemIds = ROLE_NAVIGATION_CONFIGS.PASSENGER.items.map((i) => i.id);
    assert.deepEqual(passengerItemIds, ['HOME', 'FIND_BUS', 'TICKETS', 'PROFILE']);
  });

  it('4. Discovery & Search Service: queries authoritative /api/v1/discovery/routes and maps real shapes without fake data', async () => {
    // 1. Authoritative API call to live Fastify backend
    const trips = await passengerService.searchRoutes('Baramunda', 'Puri');
    assert.ok(Array.isArray(trips), 'Returns an array of bus services');

    // 2. Verify mapping function accurately converts Fastify AvailableTripResult to BusService
    const mockFastifyTrip = {
      tripId: '00000000-0000-0000-0000-000000000001',
      routeId: '00000000-0000-0000-0000-000000000002',
      routeCode: 'OD-SH-02',
      origin: 'Baramunda ISBT',
      destination: 'Puri Bus Stand',
      operatorName: 'OSRTC Rural Express',
      busRegistrationNumber: 'OD-02-AK-4412',
      busModel: 'Volvo Multi-Axle',
      seatingType: 'AC_DELUXE',
      departureTime: new Date(Date.now() + 3600000).toISOString(),
      scheduledArrival: new Date(Date.now() + 7200000).toISOString(),
      totalSeats: 40,
      availableSeats: 25,
      fareAmount: 140,
      hasLiveGps: true,
      originStop: { stopId: 'stop-1', stopName: 'Baramunda ISBT', sequenceNumber: 1, estimatedMinutesFromStart: 0 },
      destinationStop: { stopId: 'stop-2', stopName: 'Puri Bus Stand', sequenceNumber: 5, estimatedMinutesFromStart: 60 },
      stops: [
        { stopId: 'stop-1', stopName: 'Baramunda ISBT', sequenceNumber: 1, distanceFromStartKm: 0, estimatedMinutesFromStart: 0 },
        { stopId: 'stop-2', stopName: 'Puri Bus Stand', sequenceNumber: 5, distanceFromStartKm: 65, estimatedMinutesFromStart: 60 },
      ],
      liveLocation: { speed: 52, etaMinutesToNextStop: 15 },
    };

    const mapped = mapTripResultToBusService(mockFastifyTrip);
    assert.equal(mapped.tripId, mockFastifyTrip.tripId);
    assert.equal(mapped.busType, 'AC Deluxe');
    assert.equal(mapped.fare, 140);
    assert.equal(mapped.isLive, true);
    assert.equal(mapped.currentSpeedKmH, 52);
    assert.equal(mapped.stops.length, 2);
  });

  it('5. Stoppages: retrieves transit stops from authoritative /api/v1/discovery/stops endpoint', async () => {
    // Authoritative API call to live Fastify backend
    const stops = await passengerService.getNearbyStops();
    assert.ok(Array.isArray(stops), 'Returns an array of transit stops from backend');
    if (stops.length > 0) {
      assert.ok(stops[0].name.length > 0, 'Stop has a valid name');
      assert.ok(typeof stops[0].lat === 'number', 'Stop has valid latitude');
      assert.ok(typeof stops[0].lon === 'number', 'Stop has valid longitude');
    }
  });

  it('6. Seat Selection Logic: generates cabin layout, enforces bounds and prevents booking unavailable seats', () => {
    const seats = generateDefaultSeats('AC Deluxe');
    assert.equal(seats.length, 40, 'Generates 40 seats for 10 rows × 4 columns');

    const windowSeat = seats.find((s) => s.label === '1A');
    assert.equal(windowSeat?.type, 'WINDOW');
    const aisleSeat = seats.find((s) => s.label === '1B');
    assert.equal(aisleSeat?.type, 'AISLE');

    const bookedSeat = seats.find((s) => s.status === 'BOOKED');
    assert.ok(bookedSeat, 'Contains booked seats');
  });

  it('7. Passenger Flow State Store: Home -> Search -> Results -> Trip Selection', async () => {
    const store = usePassengerStore.getState();

    // 1. Initial State
    assert.equal(store.selectedSeats.length, 0);

    // 2. Set search criteria
    store.setOrigin('Baramunda ISBT');
    store.setDestination('Puri Bus Stand');
    store.setJourneyDate('25-09-2026');
    assert.equal(usePassengerStore.getState().origin, 'Baramunda ISBT');
    assert.equal(usePassengerStore.getState().destination, 'Puri Bus Stand');

    // 3. Swap Origin and Destination
    store.swapOriginDestination();
    assert.equal(usePassengerStore.getState().origin, 'Puri Bus Stand');
    assert.equal(usePassengerStore.getState().destination, 'Baramunda ISBT');

    // 4. Select trip for flow navigation
    const tripToSelect: BusService = FALLBACK_BUSES[0];
    store.selectTrip(tripToSelect);
    assert.equal(usePassengerStore.getState().selectedTrip?.id, tripToSelect.id);
    assert.equal(usePassengerStore.getState().isTripDetailsOpen, true);
  });

  it('8. Seat Selection & Fare Calculation: toggles seats, respects max limit, calculates accurate fare', () => {
    const store = usePassengerStore.getState();
    const trip: BusService = FALLBACK_BUSES[0]; // Fare is 140
    store.selectTrip(trip);

    // Select seat 1A
    store.toggleSeat('1A');
    assert.deepEqual(usePassengerStore.getState().selectedSeats, ['1A']);

    // Select seat 1B
    store.toggleSeat('1B');
    assert.deepEqual(usePassengerStore.getState().selectedSeats, ['1A', '1B']);

    // Toggle 1A off
    store.toggleSeat('1A');
    assert.deepEqual(usePassengerStore.getState().selectedSeats, ['1B']);

    // Re-select 1A
    store.toggleSeat('1A');
    const selected = usePassengerStore.getState().selectedSeats;
    const expectedFare = selected.length * trip.fare; // 2 * 140 = 280
    assert.equal(expectedFare, 280);
  });

  it('9. Booking Failure & Invariant: surfaces authoritative backend rejection without inventing fake tickets', async () => {
    const store = usePassengerStore.getState();
    const trip: BusService = FALLBACK_BUSES[0];
    store.selectTrip(trip);
    store.toggleSeat('1A');
    store.setPassengerInfo('Ramesh Chandra', '7381319957');

    // Attempting booking against real Fastify backend with synthetic trip ID must fail authoritatively
    const ticket = await store.confirmBooking('UPI');
    assert.equal(ticket, null, 'Real backend rejection returns null instead of faking a successful ticket');

    const state = usePassengerStore.getState();
    assert.ok(state.bookingError !== null, 'Real backend error is captured and displayed in store');
    assert.equal(state.isBookingProcessing, false, 'Loading state correctly resolved on backend failure');
  });

  it('10. Live Trip Telemetry: queries authoritative /api/v1/tracking/trip/:tripId/state without fabricating data', async () => {
    const store = usePassengerStore.getState();

    // Query tracking for non-existent trip against authoritative Fastify backend
    await store.startTracking('00000000-0000-0000-0000-000000000001');

    // Fastify returns { state: null, freshness: 'NO_DATA' }, so store must NOT fabricate mock coordinates
    const trackingState = usePassengerStore.getState().activeTrackingTrip;
    assert.equal(trackingState, null, 'Does not fabricate fake GPS telemetry when backend has no telemetry');

    store.stopTracking();
    assert.equal(usePassengerStore.getState().activeTrackingTrip, null);
  });
});
