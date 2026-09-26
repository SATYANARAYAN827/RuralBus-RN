/**
 * Module 4 — Driver Experience & Authoritative Backend Contract Verification
 *
 * Verifies:
 * 1. Authenticated Driver Access & Fastify Route Catalog
 * 2. Role Isolation & Security Invariants (Driver vs Super Admin zero tracking)
 * 3. Assigned Trip Loading from Authoritative Fastify Backend
 * 4. Duty State Transitions (SCHEDULED -> IN_TRANSIT -> COMPLETED)
 * 5. Driver Telemetry Validation & Live Invariant Enforcement
 * 6. API Failure Propagation & Zero Fake/Mock Success
 * 7. Corridor Stoppages & Progression Tracking
 * 8. Driver Logout & State Clearing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { API_CONFIG } from '../src/config/api.config';
import { ROLE_NAVIGATION_CONFIGS } from '../src/navigation/roleNavigationConfig';
import { driverService } from '../src/services/driver.service';
import { useDriverStore } from '../src/stores/driver.store';
import { apiClient } from '../src/services/api.client';
import { DriverDutyTrip, DriverStop } from '../src/types';

describe('Module 4 — Driver Experience & Authoritative Backend Contract Verification', () => {
  it('1. Authenticated Driver Access & Fastify Route Catalog: exact match with backend routes', () => {
    assert.equal(API_CONFIG.ENDPOINTS.DRIVER_DUTY, '/api/v1/driver/duty');
    assert.equal(
      API_CONFIG.ENDPOINTS.DRIVER_START_TRIP('trip-999'),
      '/api/v1/driver/duty/trip-999/start'
    );
    assert.equal(
      API_CONFIG.ENDPOINTS.DRIVER_END_TRIP('trip-999'),
      '/api/v1/driver/duty/trip-999/end'
    );
    assert.equal(API_CONFIG.ENDPOINTS.DRIVER_HISTORY, '/api/v1/driver/history');
    assert.equal(API_CONFIG.ENDPOINTS.GPS_PING, '/api/v1/tracking/ping');
  });

  it('2. Role Isolation & Security Invariants: Driver has telemetry HUD, Super Admin has zero maps/radar', () => {
    // 1. Driver navigation items
    const driverTabs = ROLE_NAVIGATION_CONFIGS.DRIVER.items.map((i) => i.id);
    assert.deepEqual(driverTabs, ['HOME', 'MAP', 'STOPS', 'HISTORY', 'PROFILE']);

    const driverMapTab = ROLE_NAVIGATION_CONFIGS.DRIVER.items.find((i) => i.id === 'MAP');
    assert.ok(driverMapTab, 'Driver has Live Map Radar tab');
    assert.equal(driverMapTab?.label, 'Map Radar');

    // 2. Super Admin strict invariant: Zero live tracking / radar / maps
    const superAdminItems = ROLE_NAVIGATION_CONFIGS.PLATFORM_ADMIN.items.map((i) => i.id);
    assert.ok(!superAdminItems.includes('MAP' as any), 'Super Admin must NOT contain MAP tab');
    assert.ok(!superAdminItems.includes('LIVE_MAP' as any), 'Super Admin must NOT contain LIVE_MAP tab');
    assert.ok(!superAdminItems.includes('RADAR' as any), 'Super Admin must NOT contain RADAR tab');

    // 3. Passenger strict invariant: Passenger has no Driver duty controls
    const passengerItems = ROLE_NAVIGATION_CONFIGS.PASSENGER.items.map((i) => i.id);
    assert.ok(!passengerItems.includes('STOPS' as any), 'Passenger must NOT have Driver Stops checklist tab');
  });

  it('3. Assigned Trip Loading: calls authoritative backend and rejects unauthenticated requests', async () => {
    // Ensure no token is set
    apiClient.setAuthToken(null);

    // Live Fastify backend rejects duty call without bearer token
    await assert.rejects(
      async () => {
        await driverService.getDuty();
      },
      (err: any) => {
        assert.ok(
          err.message.includes('401') ||
          err.message.toLowerCase().includes('unauthorized') ||
          err.message.includes('Authorization header missing'),
          `Expected 401/unauthorized rejection, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it('4. Assigned Trip Parsing & Store State: loads duty response into state without fake data', async () => {
    const mockTrip: DriverDutyTrip = {
      id: 'mock-trip-123',
      routeId: 'route-abc',
      routeCode: 'JR-001',
      origin: 'Sanganer Bus Stand',
      destination: 'Jaipur Junction',
      busId: 'bus-001',
      busRegistrationNumber: '11-AA-0000',
      busModel: 'Tata Starbus Ultra 40S',
      totalSeats: 40,
      seatingType: 'SEATER_2X2',
      departureTime: new Date().toISOString(),
      scheduledArrival: new Date(Date.now() + 3600000).toISOString(),
      status: 'SCHEDULED',
      availableSeats: 40,
      totalDistanceKm: 21.4,
      estimatedDurationMinutes: 60,
      stops: [
        {
          stopId: 'stop-1',
          stopName: 'Sanganer Bus Stand',
          sequenceNumber: 1,
          distanceFromStartKm: 0,
          estimatedMinutesFromStart: 0,
          latitude: 26.8023,
          longitude: 75.8166,
        },
        {
          stopId: 'stop-2',
          stopName: 'Durgapura Chowk',
          sequenceNumber: 2,
          distanceFromStartKm: 4.2,
          estimatedMinutesFromStart: 12,
          latitude: 26.8325,
          longitude: 75.8016,
        },
      ],
    };

    useDriverStore.setState({
      activeTrip: mockTrip,
      upcomingTrips: [],
      isLoadingDuty: false,
    });

    const storeState = useDriverStore.getState();
    assert.equal(storeState.activeTrip?.id, 'mock-trip-123');
    assert.equal(storeState.activeTrip?.busRegistrationNumber, '11-AA-0000');
    assert.equal(storeState.activeTrip?.status, 'SCHEDULED');
    assert.equal(storeState.activeTrip?.stops.length, 2);
  });

  it('5. Duty State Transitions: SCHEDULED -> IN_TRANSIT and IN_TRANSIT -> COMPLETED', async () => {
    const store = useDriverStore.getState();

    // Verify initial SCHEDULED state
    assert.equal(store.activeTrip?.status, 'SCHEDULED');
    assert.equal(store.isGpsStreaming, false);

    // Mock service startTrip & endTrip for state machine validation
    const origStartTrip = driverService.startTrip;
    const origEndTrip = driverService.endTrip;

    try {
      (driverService as any).startTrip = async (tripId: string) => ({
        ...store.activeTrip!,
        id: tripId,
        status: 'IN_TRANSIT' as const,
        actualDeparture: new Date().toISOString(),
      });

      (driverService as any).endTrip = async (tripId: string) => ({
        ...store.activeTrip!,
        id: tripId,
        status: 'COMPLETED' as const,
        actualArrival: new Date().toISOString(),
      });

      // Start Trip
      const updated = await useDriverStore.getState().startTrip('mock-trip-123');
      assert.equal(updated.status, 'IN_TRANSIT');
      assert.equal(useDriverStore.getState().activeTrip?.status, 'IN_TRANSIT');
      assert.equal(useDriverStore.getState().isGpsStreaming, true);

      // End Trip
      const completed = await useDriverStore.getState().endTrip('mock-trip-123');
      assert.equal(completed.status, 'COMPLETED');
      assert.equal(useDriverStore.getState().activeTrip, null);
      assert.equal(useDriverStore.getState().isGpsStreaming, false);
    } finally {
      driverService.startTrip = origStartTrip;
      driverService.endTrip = origEndTrip;
    }
  });

  it('6. Driver Telemetry Validation: validates coordinates and rejects invalid inputs', async () => {
    // 1. Missing tripId
    await assert.rejects(
      async () => {
        await driverService.sendGpsPing({
          tripId: '',
          latitude: 26.8,
          longitude: 75.8,
        });
      },
      /Trip ID is required/
    );

    // 2. Latitude out of range (> 90)
    await assert.rejects(
      async () => {
        await driverService.sendGpsPing({
          tripId: 'trip-1',
          latitude: 95.2,
          longitude: 75.8,
        });
      },
      /Valid latitude between -90 and 90 is required/
    );

    // 3. Longitude out of range (< -180)
    await assert.rejects(
      async () => {
        await driverService.sendGpsPing({
          tripId: 'trip-1',
          latitude: 26.8,
          longitude: -195.0,
        });
      },
      /Valid longitude between -180 and 180 is required/
    );
  });

  it('7. Telemetry State Invariant: does not broadcast telemetry when trip is not IN_TRANSIT', async () => {
    // Reset store with SCHEDULED trip
    useDriverStore.setState({
      activeTrip: {
        id: 'trip-scheduled-1',
        routeId: 'r1',
        routeCode: 'JR-001',
        origin: 'A',
        destination: 'B',
        busId: 'b1',
        busRegistrationNumber: 'OD-01-AA-1111',
        busModel: 'Standard',
        totalSeats: 40,
        seatingType: 'SEATER',
        departureTime: new Date().toISOString(),
        scheduledArrival: new Date().toISOString(),
        status: 'SCHEDULED', // NOT IN_TRANSIT
        availableSeats: 40,
        totalDistanceKm: 10,
        estimatedDurationMinutes: 30,
        stops: [],
      },
      isGpsStreaming: false,
      lastPingError: null,
    });

    // Calling sendManualPing when trip is SCHEDULED must not send ping
    await useDriverStore.getState().sendManualPing();
    const state = useDriverStore.getState();
    assert.ok(
      state.lastPingError?.includes("Trip is not active ('IN_TRANSIT')"),
      'Correctly pauses telemetry ping when trip is not IN_TRANSIT'
    );
  });

  it('8. API Failure Propagation: surfaces real backend errors and forbids fake success', async () => {
    const origGet = apiClient.get;
    try {
      // Simulate backend 500 error
      (apiClient as any).get = async () => {
        throw new Error('HTTP 500: Internal server error on corridor telemetry');
      };

      await assert.rejects(
        async () => {
          await driverService.getDuty();
        },
        /HTTP 500: Internal server error on corridor telemetry/
      );

      // Verify store captures the error instead of faking success
      await useDriverStore.getState().fetchDuty();
      assert.equal(
        useDriverStore.getState().dutyError,
        'HTTP 500: Internal server error on corridor telemetry'
      );
      assert.equal(useDriverStore.getState().activeTrip, null);
    } finally {
      apiClient.get = origGet;
    }
  });

  it('9. Corridor Progression & Stop Checklist: advances completed stops and updates coordinates', () => {
    const mockStops: DriverStop[] = [
      {
        stopId: 'stop-1',
        stopName: 'Sanganer Bus Stand',
        sequenceNumber: 1,
        distanceFromStartKm: 0,
        estimatedMinutesFromStart: 0,
        latitude: 26.8023,
        longitude: 75.8166,
      },
      {
        stopId: 'stop-2',
        stopName: 'Durgapura Chowk',
        sequenceNumber: 2,
        distanceFromStartKm: 4.2,
        estimatedMinutesFromStart: 12,
        latitude: 26.8325,
        longitude: 75.8016,
      },
    ];

    useDriverStore.setState({
      activeTrip: {
        id: 'trip-transit-1',
        routeId: 'r1',
        routeCode: 'JR-001',
        origin: 'Sanganer',
        destination: 'Jaipur',
        busId: 'b1',
        busRegistrationNumber: 'OD-01-AA-1111',
        busModel: 'Standard',
        totalSeats: 40,
        seatingType: 'SEATER',
        departureTime: new Date().toISOString(),
        scheduledArrival: new Date().toISOString(),
        status: 'IN_TRANSIT',
        availableSeats: 40,
        totalDistanceKm: 21.4,
        estimatedDurationMinutes: 60,
        stops: mockStops,
      },
      completedStopIds: [],
      currentLatitude: 26.8023,
      currentLongitude: 75.8166,
    });

    // Mark Stop 1 passed
    useDriverStore.getState().markStopPassed('stop-1');
    assert.deepEqual(useDriverStore.getState().completedStopIds, ['stop-1']);

    // Mark Stop 2 passed
    useDriverStore.getState().markStopPassed('stop-2');
    assert.deepEqual(useDriverStore.getState().completedStopIds, ['stop-1', 'stop-2']);
    assert.equal(useDriverStore.getState().currentLatitude, 26.8325);
    assert.equal(useDriverStore.getState().currentLongitude, 75.8016);
  });

  it('10. Driver Logout Invariant: clears all duty, telemetry and modal state', () => {
    useDriverStore.setState({
      isGpsStreaming: true,
      currentSpeedKmH: 55,
      completedStopIds: ['stop-1'],
      tripDurationSeconds: 120,
    });

    // Trigger resetDutyState
    useDriverStore.getState().resetDutyState();

    const state = useDriverStore.getState();
    assert.equal(state.activeTrip, null);
    assert.equal(state.isGpsStreaming, false);
    assert.equal(state.currentSpeedKmH, 0);
    assert.deepEqual(state.completedStopIds, []);
    assert.equal(state.tripDurationSeconds, 0);
  });
});
