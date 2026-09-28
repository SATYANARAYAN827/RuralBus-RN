import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import {
  db,
  withSystemContext,
  users,
  operators,
  operatorMembers,
  buses,
  stops,
  routes,
  trips,
} from '@ruralbus/database';
import { sql, eq } from 'drizzle-orm';
import { hashPassword } from '../src/services/password.service.js';
import { clearLiveTripCache, getTripSubscriberCount } from '../src/services/telemetry.service.js';

describe('Phase 11: Real-Time GPS Telemetry & WebSockets Hub Integration Tests', () => {
  let app: FastifyInstance;

  // Tenant A Fixtures
  let operatorAId: string;
  let adminAToken: string;
  let driverAId: string;
  let driverAToken: string;
  let tripAId: string;
  let busAId: string;
  let stop1Id: string;
  let stop2Id: string;
  let routeAId: string;

  // Tenant B Fixtures
  let operatorBId: string;
  let driverBId: string;
  let driverBToken: string;

  // Passenger
  let passengerToken: string;

  // Phase 2/3 shared fixtures (hoisted for cross-describe access)
  let stop3Id: string;
  let multiStopRouteId: string;
  let multiStopTripId: string;
  let reverseRouteId: string;
  let reverseTripId: string;

  // Phase 4 WebSocket and additional role fixtures
  let wsPort: number;
  let conductorAId: string;
  let conductorAToken: string;
  let adminBToken: string;
  let conductorBToken: string;
  let platformAdminToken: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
    await app.listen({ port: 0, host: '127.0.0.1' });
    wsPort = (app.server.address() as any).port;

    await withSystemContext(async (tx) => {
      const passwordHash = await hashPassword('Secret123!');

      // 1. Create Operator A
      const [opA] = await tx
        .insert(operators)
        .values({
          companyName: 'KSRTC South Telemetry',
          businessCode: `ksrtc-tel-${Date.now()}`,
          contactEmail: 'telemetry@ksrtc.gov.in',
          contactPhone: '9876543501',
          status: 'ACTIVE',
        })
        .returning();
      operatorAId = opA.id;

      // 2. Create Admin A
      const [adminA] = await tx
        .insert(users)
        .values({
          fullName: 'Admin A Telemetry',
          phone: `98711${Math.floor(10000 + Math.random() * 90000)}`,
          email: `admin-tel-${Date.now()}@ksrtc.gov.in`,
          passwordHash,
          isActive: true,
        })
        .returning();

      await tx.insert(operatorMembers).values({
        userId: adminA.id,
        tenantId: operatorAId,
        role: 'OPERATOR_ADMIN',
        isActive: true,
      });

      // 3. Create Driver A
      const [drA] = await tx
        .insert(users)
        .values({
          fullName: 'Driver A GPS',
          phone: `98722${Math.floor(10000 + Math.random() * 90000)}`,
          email: `driver-tel-${Date.now()}@ksrtc.gov.in`,
          passwordHash,
          isActive: true,
        })
        .returning();
      driverAId = drA.id;

      await tx.insert(operatorMembers).values({
        userId: drA.id,
        tenantId: operatorAId,
        role: 'DRIVER',
        isActive: true,
      });

      // 4. Create Bus A & Stops for Tenant A
      const [busA] = await tx
        .insert(buses)
        .values({
          tenantId: operatorAId,
          registrationNumber: `KA-09-TR-${Math.floor(1000 + Math.random() * 9000)}`,
          model: 'Tata Starbus GPS',
          totalSeats: 35,
          seatingType: 'SEATER_2X2',
          status: 'ACTIVE',
        })
        .returning();
      busAId = busA.id;

      const [stop1] = await tx
        .insert(stops)
        .values({
          tenantId: operatorAId,
          name: 'Mysore Bus Stand',
          code: `MYS-T-${Math.floor(100 + Math.random() * 900)}`,
          latitude: 12.3082,
          longitude: 76.6554,
          location: sql`ST_SetSRID(ST_MakePoint(76.6554, 12.3082), 4326)`,
        })
        .returning();

      const [stop2] = await tx
        .insert(stops)
        .values({
          tenantId: operatorAId,
          name: 'Mandya Highway',
          code: `MDY-T-${Math.floor(100 + Math.random() * 900)}`,
          latitude: 12.5242,
          longitude: 76.8958,
          location: sql`ST_SetSRID(ST_MakePoint(76.8958, 12.5242), 4326)`,
        })
        .returning();

      const [routeA] = await tx
        .insert(routes)
        .values({
          tenantId: operatorAId,
          routeCode: `RT-GPS-${Date.now().toString().slice(-4)}`,
          origin: 'Mysore Bus Stand',
          destination: 'Mandya Highway',
          totalDistanceKm: 42,
          estimatedDurationMinutes: 50,
          stopsData: [
            {
              stopId: stop1.id,
              stopName: stop1.name,
              sequenceNumber: 1,
              distanceFromStartKm: 0,
              estimatedMinutesFromStart: 0,
              fareFromStart: 0,
            },
            {
              stopId: stop2.id,
              stopName: stop2.name,
              sequenceNumber: 2,
              distanceFromStartKm: 42,
              estimatedMinutesFromStart: 50,
              fareFromStart: 50,
            },
          ],
          isActive: true,
        })
        .returning();
      stop1Id = stop1.id;
      stop2Id = stop2.id;
      routeAId = routeA.id;

      // 5. Create Trip A
      const [tripA] = await tx
        .insert(trips)
        .values({
          tenantId: operatorAId,
          routeId: routeA.id,
          busId: busA.id,
          driverId: driverAId,
          departureTime: new Date(Date.now() + 3600 * 1000),
          scheduledArrival: new Date(Date.now() + 7200 * 1000),
          status: 'IN_TRANSIT',
          availableSeats: 35,
          totalSeats: 35,
        })
        .returning();
      tripAId = tripA.id;

      // 6. Create Tenant B with Driver B
      const [opB] = await tx
        .insert(operators)
        .values({
          companyName: 'NWKRTC Belgaum',
          businessCode: `nwkrtc-tel-${Date.now()}`,
          contactEmail: 'belgaum@nwkrtc.gov.in',
          contactPhone: '9876543502',
          status: 'ACTIVE',
        })
        .returning();
      operatorBId = opB.id;

      const [drB] = await tx
        .insert(users)
        .values({
          fullName: 'Driver B NWKRTC',
          phone: `98733${Math.floor(10000 + Math.random() * 90000)}`,
          email: `driver-nw-${Date.now()}@nwkrtc.gov.in`,
          passwordHash,
          isActive: true,
        })
        .returning();
      driverBId = drB.id;

      await tx.insert(operatorMembers).values({
        userId: drB.id,
        tenantId: operatorBId,
        role: 'DRIVER',
        isActive: true,
      });

      // Passenger User
      const [pass] = await tx
        .insert(users)
        .values({
          fullName: 'Passenger Telemetry',
          phone: `98744${Math.floor(10000 + Math.random() * 90000)}`,
          email: `passenger-tel-${Date.now()}@gmail.com`,
          passwordHash,
          isActive: true,
        })
        .returning();

      // Conductor A User (for Conductor authorization testing)
      const [condA] = await tx
        .insert(users)
        .values({
          fullName: 'Conductor A GPS',
          phone: `98755${Math.floor(10000 + Math.random() * 90000)}`,
          email: `conductor-tel-${Date.now()}@ksrtc.gov.in`,
          passwordHash,
          isActive: true,
        })
        .returning();
      conductorAId = condA.id;

      await tx.insert(operatorMembers).values({
        userId: condA.id,
        tenantId: operatorAId,
        role: 'CONDUCTOR',
        isActive: true,
      });

      // Assign conductor A to trip A
      await tx
        .update(trips)
        .set({ conductorId: conductorAId })
        .where(eq(trips.id, tripAId));

      // Sign JWTs
      adminAToken = app.jwt.sign({
        sub: adminA.id,
        role: 'OPERATOR_ADMIN',
        tenantId: operatorAId,
      });

      adminBToken = app.jwt.sign({
        sub: `admin-b-${Date.now()}`,
        role: 'OPERATOR_ADMIN',
        tenantId: operatorBId,
      });

      driverAToken = app.jwt.sign({
        sub: driverAId,
        role: 'DRIVER',
        tenantId: operatorAId,
      });

      driverBToken = app.jwt.sign({
        sub: driverBId,
        role: 'DRIVER',
        tenantId: operatorBId,
      });

      conductorAToken = app.jwt.sign({
        sub: conductorAId,
        role: 'CONDUCTOR',
        tenantId: operatorAId,
      });

      conductorBToken = app.jwt.sign({
        sub: `conductor-b-${Date.now()}`,
        role: 'CONDUCTOR',
        tenantId: operatorBId,
      });

      platformAdminToken = app.jwt.sign({
        sub: `platform-admin-${Date.now()}`,
        role: 'PLATFORM_ADMIN',
        tenantId: null,
      });

      passengerToken = app.jwt.sign({
        sub: pass.id,
        role: 'PASSENGER',
        tenantId: null,
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GPS Ingestion & Live Querying', () => {
    it('Driver A successfully ingests valid GPS coordinates for assigned Trip A', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3500,
          longitude: 76.7000,
          speed: 48,
          heading: 65,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.tripLocation.latitude).toBe(12.35);
      expect(json.data.tripLocation.longitude).toBe(76.7);
      expect(json.data.tripLocation.speed).toBe(48);
    });

    it('Passenger queries public live GPS tracking for Trip A', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.location).toBeDefined();
      expect(json.data.location.latitude).toBe(12.35);
      expect(json.data.location.longitude).toBe(76.7);
      expect(json.data.location.speed).toBe(48);
    });

    it('Operator Admin receives updated Live Fleet Radar snapshot', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tracking/fleet',
        headers: { authorization: `Bearer ${adminAToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.buses.length).toBeGreaterThanOrEqual(1);
      const myBus = json.data.buses.find((b: any) => b.tripId === tripAId);
      expect(myBus).toBeDefined();
      expect(myBus.speed).toBe(48);
    });

    it('Driver B (unassigned / wrong tenant) is rejected from sending GPS ping for Trip A', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverBToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3500,
          longitude: 76.7000,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('Passenger is forbidden from sending Driver GPS pings (403)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${passengerToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3500,
          longitude: 76.7000,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('Driver A successfully ingests GPS coordinates with ISO string timestamp', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3550,
          longitude: 76.7050,
          speed: 52,
          heading: 70,
          timestamp: new Date().toISOString(),
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(typeof json.data.tripLocation.timestamp).toBe('number');
    });

    it('Driver A successfully ingests GPS ping with nullish/omitted optional speed/heading fields (200 OK)', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3560,
          longitude: 76.7060,
          speed: null,
          heading: null,
          accuracy: null,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.tripLocation.speed).toBe(0);
      expect(json.data.tripLocation.heading).toBe(0);
    });

    it('Rejects invalid non-UUID tripId with 400 validation error', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: 'invalid-non-uuid-trip-id',
          latitude: 12.3500,
          longitude: 76.7000,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.details[0].field).toBe('tripId');
    });

    it('Rejects invalid latitude/longitude exceeding geographical bounds', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 120.5, // Invalid > 90
          longitude: 76.7000,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('Rejects future timestamp > 5 minutes with 400 validation error', async () => {
      const futureTime = Date.now() + 10 * 60 * 1000;
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3500,
          longitude: 76.7000,
          timestamp: futureTime,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects past timestamp > 24 hours with 400 validation error', async () => {
      const pastTime = Date.now() - 48 * 60 * 60 * 1000;
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3500,
          longitude: 76.7000,
          timestamp: pastTime,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('Passenger / Public query GET /api/v1/tracking/trip/:tripId returns 200 with freshness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.location).toBeDefined();
      expect(['LIVE', 'STALE', 'OFFLINE', 'NO_DATA']).toContain(json.data.freshness);
    });

    it('Rejects GPS ping when trip status is COMPLETED', async () => {
      await withSystemContext(async (tx) => {
        await tx.update(trips).set({ status: 'COMPLETED' }).where(sql`id = ${tripAId}`);
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3500,
          longitude: 76.7000,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error.message).toContain('GPS ping rejected');

      await withSystemContext(async (tx) => {
        await tx.update(trips).set({ status: 'IN_TRANSIT' }).where(sql`id = ${tripAId}`);
      });
    });

    it('Ignores out-of-order GPS ping (timestamp older than current location)', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const tNow = Date.now();

      // Send recent ping
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.4000,
          longitude: 76.7500,
          speed: 60,
          heading: 90,
          timestamp: tNow,
        },
      });
      expect(res1.statusCode).toBe(200);
      expect(res1.json().data.tripLocation.latitude).toBe(12.4);

      // Send older ping (1 minute before tNow)
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.1111,
          longitude: 76.2222,
          speed: 20,
          heading: 10,
          timestamp: tNow - 60000,
        },
      });
      expect(res2.statusCode).toBe(200);
      // Location should NOT be overwritten by the older ping
      expect(res2.json().data.tripLocation.latitude).toBe(12.4);
      expect(res2.json().data.tripLocation.longitude).toBe(76.75);
    });

    it('Evicts live location cache when clearLiveTripCache is called', async () => {
      const { clearLiveTripCache } = await import('../src/services/telemetry.service.js');
      clearLiveTripCache(tripAId);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.location).toBeNull();
      expect(json.data.freshness).toBe('NO_DATA');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Phase 1: Canonical LiveVehicleState tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('Phase 1: Canonical LiveVehicleState', () => {
    // Restore trip to IN_TRANSIT and prime the cache before Phase 1 tests
    beforeAll(async () => {
      await withSystemContext(async (tx) => {
        await tx.update(trips).set({ status: 'IN_TRANSIT' }).where(sql`id = ${tripAId}`);
      });

      // Prime the cache with a fresh ping so Phase 1 tests have state to query
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.4500,
          longitude: 76.7800,
          speed: 55,
          heading: 120,
        },
      });
    });

    it('GET /state returns canonical LiveVehicleState with all required Phase 1 fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);

      const { state, freshness } = json.data;

      // freshness must be one of the canonical values
      expect(['LIVE', 'STALE', 'OFFLINE', 'NO_DATA']).toContain(freshness);

      // state must be present (trip was just pinged)
      expect(state).not.toBeNull();

      // Required canonical fields
      expect(typeof state.tripId).toBe('string');
      expect(typeof state.busId).toBe('string');
      expect(typeof state.operatorId).toBe('string');   // Phase 1 addition
      expect(typeof state.routeId).toBe('string');      // Phase 1 addition
      expect(typeof state.routeCode).toBe('string');

      // Coordinates
      expect(state.latitude).toBe(12.45);
      expect(state.longitude).toBe(76.78);
      expect(state.speed).toBe(55);
      expect(state.heading).toBe(120);

      // Timestamps — capturedAt is Unix ms, receivedAt is ISO string
      expect(typeof state.capturedAt).toBe('number');   // Phase 1 addition
      expect(typeof state.receivedAt).toBe('string');   // Phase 1 addition (ISO)
      expect(typeof state.lastUpdated).toBe('string');  // ISO string

      // ISO string sanity
      expect(() => new Date(state.receivedAt).toISOString()).not.toThrow();
      expect(() => new Date(state.lastUpdated).toISOString()).not.toThrow();

      // capturedAt must be a reasonable Unix ms timestamp (after 2024-01-01)
      expect(state.capturedAt).toBeGreaterThan(1704067200000);

      // freshness on state object must match outer freshness field
      expect(state.freshness).toBe(freshness);
    });

    it('GET /state — No_DATA freshness when trip has no pings yet (unknown trip UUID)', async () => {
      const unknownTripId = '00000000-0000-0000-0000-000000000001';
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${unknownTripId}/state`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.freshness).toBe('NO_DATA');
      expect(json.data.state).toBeNull();
    });

    it('Rejects GPS ping with (0, 0) null-island coordinates with 400', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 0,
          longitude: 0,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.error.message).toContain('(0, 0)');
    });

    it('Canonical state includes operatorId matching the operator of the trip', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });

      expect(response.statusCode).toBe(200);
      const { state } = response.json().data;
      expect(state).not.toBeNull();
      // operatorId must be the tenantId of the operator (not a different tenant's id)
      expect(state.operatorId).toBe(operatorAId);
    });

    it('Canonical state is null and freshness is NO_DATA after clearLiveTripCache', async () => {
      const { getLiveVehicleState, clearLiveTripCache } = await import('../src/services/telemetry.service.js');

      // Ensure there IS state first
      const before = getLiveVehicleState(tripAId);
      expect(before.state).not.toBeNull();

      clearLiveTripCache(tripAId);

      // After eviction — both canonical and legacy should return nothing
      const after = getLiveVehicleState(tripAId);
      expect(after.state).toBeNull();
      expect(after.freshness).toBe('NO_DATA');

      // HTTP endpoint should also reflect this
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data.state).toBeNull();
      expect(json.data.freshness).toBe('NO_DATA');
    });

    it('Canonical state does not contain NaN or Infinity coordinates', async () => {
      // Restore trip and re-prime cache
      await withSystemContext(async (tx) => {
        await tx.update(trips).set({ status: 'IN_TRANSIT' }).where(sql`id = ${tripAId}`);
      });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.4600,
          longitude: 76.7900,
          speed: 42,
          heading: 45,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });

      expect(response.statusCode).toBe(200);
      const { state } = response.json().data;
      expect(state).not.toBeNull();

      // Coordinates must be finite real numbers
      expect(isFinite(state.latitude)).toBe(true);
      expect(isFinite(state.longitude)).toBe(true);
      expect(isNaN(state.latitude)).toBe(false);
      expect(isNaN(state.longitude)).toBe(false);
    });

    it('Rejects invalid non-UUID tripId on canonical state endpoint (400)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tracking/trip/not-a-uuid/state',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 2: Route Progress & Current/Next Stop Tests
  // ─────────────────────────────────────────────────────────────────────────
  describe('Phase 2: Route Progress & Current/Next Stop', () => {
    // Fixtures are hoisted to outer describe so Phase 3 tests can also access them

    beforeAll(async () => {
      await withSystemContext(async (tx) => {
        // Create Stop 3 on the Mysore-Bangalore corridor (Ramanagara Junction)
        const [stop3] = await tx
          .insert(stops)
          .values({
            tenantId: operatorAId,
            name: 'Ramanagara Junction',
            code: `RMN-T-${Math.floor(100 + Math.random() * 900)}`,
            latitude: 12.7150,
            longitude: 77.2810,
            location: sql`ST_SetSRID(ST_MakePoint(77.2810, 12.7150), 4326)`,
          })
          .returning();
        stop3Id = stop3.id;

        // Create 3-stop Forward Route: Mysore (seq 1) -> Mandya (seq 2) -> Ramanagara (seq 3)
        const [mRoute] = await tx
          .insert(routes)
          .values({
            tenantId: operatorAId,
            routeCode: `RT-FWD-3STP-${Date.now().toString().slice(-4)}`,
            origin: 'Mysore Bus Stand',
            destination: 'Ramanagara Junction',
            totalDistanceKm: 90,
            estimatedDurationMinutes: 110,
            stopsData: [
              {
                stopId: stop1Id,
                stopName: 'Mysore Bus Stand',
                sequenceNumber: 1,
                distanceFromStartKm: 0,
                estimatedMinutesFromStart: 0,
                fareFromStart: 0,
              },
              {
                stopId: stop2Id,
                stopName: 'Mandya Highway',
                sequenceNumber: 2,
                distanceFromStartKm: 42,
                estimatedMinutesFromStart: 50,
                fareFromStart: 50,
              },
              {
                stopId: stop3Id,
                stopName: 'Ramanagara Junction',
                sequenceNumber: 3,
                distanceFromStartKm: 90,
                estimatedMinutesFromStart: 110,
                fareFromStart: 100,
              },
            ],
            isActive: true,
          })
          .returning();
        multiStopRouteId = mRoute.id;

        const [mTrip] = await tx
          .insert(trips)
          .values({
            tenantId: operatorAId,
            routeId: multiStopRouteId,
            busId: busAId,
            driverId: driverAId,
            departureTime: new Date(Date.now() + 3600 * 1000),
            scheduledArrival: new Date(Date.now() + 7200 * 1000),
            status: 'IN_TRANSIT',
            availableSeats: 35,
            totalSeats: 35,
          })
          .returning();
        multiStopTripId = mTrip.id;

        // Create Reverse Route: Ramanagara (seq 1) -> Mandya (seq 2) -> Mysore (seq 3)
        const [rRoute] = await tx
          .insert(routes)
          .values({
            tenantId: operatorAId,
            routeCode: `RT-REV-3STP-${Date.now().toString().slice(-4)}`,
            origin: 'Ramanagara Junction',
            destination: 'Mysore Bus Stand',
            totalDistanceKm: 90,
            estimatedDurationMinutes: 110,
            stopsData: [
              {
                stopId: stop3Id,
                stopName: 'Ramanagara Junction',
                sequenceNumber: 1,
                distanceFromStartKm: 0,
                estimatedMinutesFromStart: 0,
                fareFromStart: 0,
              },
              {
                stopId: stop2Id,
                stopName: 'Mandya Highway',
                sequenceNumber: 2,
                distanceFromStartKm: 48,
                estimatedMinutesFromStart: 60,
                fareFromStart: 50,
              },
              {
                stopId: stop1Id,
                stopName: 'Mysore Bus Stand',
                sequenceNumber: 3,
                distanceFromStartKm: 90,
                estimatedMinutesFromStart: 110,
                fareFromStart: 100,
              },
            ],
            isActive: true,
          })
          .returning();
        reverseRouteId = rRoute.id;

        const [rTrip] = await tx
          .insert(trips)
          .values({
            tenantId: operatorAId,
            routeId: reverseRouteId,
            busId: busAId,
            driverId: driverAId,
            departureTime: new Date(Date.now() + 3600 * 1000),
            scheduledArrival: new Date(Date.now() + 7200 * 1000),
            status: 'IN_TRANSIT',
            availableSeats: 35,
            totalSeats: 35,
          })
          .returning();
        reverseTripId = rTrip.id;
      });
    });

    it('GPS near the first stop populates currentStop=1 and nextStop=2', async () => {
      // Send ping at Mysore Bus Stand (12.3082, 76.6554)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const postRes = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.3082,
          longitude: 76.6554,
          speed: 10,
          heading: 45,
        },
      });
      expect(postRes.statusCode).toBe(200);

      // Verify canonical state endpoint exposes currentStop and nextStop
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });
      expect(getRes.statusCode).toBe(200);
      const { state } = getRes.json().data;

      expect(state).not.toBeNull();
      expect(state.currentStopSequence).toBe(1);
      expect(state.currentStopId).toBe(stop1Id);
      expect(state.nextStopSequence).toBe(2);
      expect(state.nextStopId).toBe(stop2Id);
    });

    it('GPS between two stops retains currentStop=1 and nextStop=2', async () => {
      // Send ping along highway between Mysore and Mandya (12.4000, 76.7500)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const postRes = await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: tripAId,
          latitude: 12.4000,
          longitude: 76.7500,
          speed: 55,
          heading: 48,
        },
      });
      expect(postRes.statusCode).toBe(200);

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });
      expect(getRes.statusCode).toBe(200);
      const { state } = getRes.json().data;

      // Bus is en route between stop 1 and stop 2
      expect(state.currentStopSequence).toBe(1);
      expect(state.currentStopId).toBe(stop1Id);
      expect(state.nextStopSequence).toBe(2);
      expect(state.nextStopId).toBe(stop2Id);
    });

    it('Sequential progression through multiple stops (3-stop route)', async () => {
      // 1. Ping near Stop 1 (Mysore Bus Stand)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: multiStopTripId,
          latitude: 12.3082,
          longitude: 76.6554,
          speed: 5,
          heading: 30,
        },
      });

      let res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      let state = res.json().data.state;
      expect(state.currentStopSequence).toBe(1);
      expect(state.currentStopId).toBe(stop1Id);
      expect(state.nextStopSequence).toBe(2);
      expect(state.nextStopId).toBe(stop2Id);

      // 2. Ping between Stop 1 and Stop 2 (highway)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: multiStopTripId,
          latitude: 12.4000,
          longitude: 76.7500,
          speed: 60,
          heading: 40,
        },
      });

      res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      state = res.json().data.state;
      expect(state.currentStopSequence).toBe(1);
      expect(state.nextStopSequence).toBe(2);

      // 3. Ping arriving at Stop 2 (Mandya Highway: 12.5242, 76.8958)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: multiStopTripId,
          latitude: 12.5242,
          longitude: 76.8958,
          speed: 15,
          heading: 42,
        },
      });

      res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      state = res.json().data.state;
      expect(state.currentStopSequence).toBe(2);
      expect(state.currentStopId).toBe(stop2Id);
      expect(state.nextStopSequence).toBe(3);
      expect(state.nextStopId).toBe(stop3Id);

      // 4. Ping between Stop 2 and Stop 3 (near Maddur: 12.6200, 77.0800)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: multiStopTripId,
          latitude: 12.6200,
          longitude: 77.0800,
          speed: 65,
          heading: 50,
        },
      });

      res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      state = res.json().data.state;
      expect(state.currentStopSequence).toBe(2);
      expect(state.nextStopSequence).toBe(3);

      // 5. Ping arriving at final Stop 3 (Ramanagara Junction: 12.7150, 77.2810)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: multiStopTripId,
          latitude: 12.7150,
          longitude: 77.2810,
          speed: 0,
          heading: 55,
        },
      });

      res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      state = res.json().data.state;
      expect(state.currentStopSequence).toBe(3);
      expect(state.currentStopId).toBe(stop3Id);
      // Final stop: no fake next stop!
      expect(state.nextStopSequence).toBeUndefined();
      expect(state.nextStopId).toBeUndefined();
    }, 15000);

    it('Previous-stop GPS noise does NOT move progress backward', async () => {
      // The multiStopTripId is currently at stop sequence 3 (final stop Ramanagara).
      // A noisy GPS ping arrives reporting coordinates back near Stop 1 (Mysore).
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: multiStopTripId,
          latitude: 12.3082,
          longitude: 76.6554,
          speed: 0,
          heading: 0,
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      const state = res.json().data.state;

      // Monotonic guard: sequence must NOT revert to 1!
      expect(state.currentStopSequence).toBe(3);
      expect(state.currentStopId).toBe(stop3Id);
    });

    it('Final stop has no fake next stop (fields undefined)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
      });
      const state = res.json().data.state;

      expect(state.currentStopSequence).toBe(3);
      expect(state.nextStopSequence).toBeUndefined();
      expect(state.nextStopId).toBeUndefined();
    });

    it('Forward and reverse routes work independently using their own stop sequence', async () => {
      // Reverse Route: Ramanagara (seq 1) -> Mandya (seq 2) -> Mysore (seq 3)
      // 1. Ping near Ramanagara (reverse origin)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: reverseTripId,
          latitude: 12.7150,
          longitude: 77.2810,
          speed: 10,
          heading: 220,
        },
      });

      let res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${reverseTripId}/state`,
      });
      let state = res.json().data.state;
      expect(state.currentStopSequence).toBe(1);
      expect(state.currentStopId).toBe(stop3Id); // Ramanagara is stop 1 in reverse!
      expect(state.nextStopSequence).toBe(2);
      expect(state.nextStopId).toBe(stop2Id); // Mandya is stop 2 in reverse

      // 2. Ping near Mandya
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: reverseTripId,
          latitude: 12.5242,
          longitude: 76.8958,
          speed: 20,
          heading: 225,
        },
      });

      res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${reverseTripId}/state`,
      });
      state = res.json().data.state;
      expect(state.currentStopSequence).toBe(2);
      expect(state.currentStopId).toBe(stop2Id);
      expect(state.nextStopSequence).toBe(3);
      expect(state.nextStopId).toBe(stop1Id); // Mysore is final stop (seq 3) in reverse

      // 3. Ping arriving at Mysore (reverse destination)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await app.inject({
        method: 'POST',
        url: '/api/v1/tracking/ping',
        headers: { authorization: `Bearer ${driverAToken}` },
        payload: {
          tripId: reverseTripId,
          latitude: 12.3082,
          longitude: 76.6554,
          speed: 0,
          heading: 230,
        },
      });

      res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${reverseTripId}/state`,
      });
      state = res.json().data.state;
      expect(state.currentStopSequence).toBe(3);
      expect(state.currentStopId).toBe(stop1Id);
      expect(state.nextStopSequence).toBeUndefined();
      expect(state.nextStopId).toBeUndefined();
    }, 15000);

    it('Unit tests: computeRouteProgress edge cases and guards', async () => {
      const { computeRouteProgress, haversineDistanceKm } = await import(
        '../src/services/telemetry.service.js'
      );

      // 1. Empty stops returns empty object
      expect(computeRouteProgress(12.3082, 76.6554, [])).toEqual({});

      // 2. Single stop route
      const singleStop = [
        { stopId: 's1', sequenceNumber: 1, stopName: 'Solo', latitude: 12.3, longitude: 76.6 },
      ];
      const singleRes = computeRouteProgress(12.3, 76.6, singleStop);
      expect(singleRes.currentStopSequence).toBe(1);
      expect(singleRes.currentStopId).toBe('s1');
      expect(singleRes.nextStopSequence).toBeUndefined();

      // 3. Distance calculation accuracy: Mysore to Mandya ~35-42km
      const dist = haversineDistanceKm(12.3082, 76.6554, 12.5242, 76.8958);
      expect(dist).toBeGreaterThan(35);
      expect(dist).toBeLessThan(45);

      // 4. Vehicle before first stop: does not invent stop, uses stop 1 and stop 2
      const threeStops = [
        { stopId: 's1', sequenceNumber: 1, stopName: 'Stop 1', latitude: 12.3082, longitude: 76.6554 },
        { stopId: 's2', sequenceNumber: 2, stopName: 'Stop 2', latitude: 12.5242, longitude: 76.8958 },
        { stopId: 's3', sequenceNumber: 3, stopName: 'Stop 3', latitude: 12.7150, longitude: 77.2810 },
      ];
      // Point 2km before Stop 1
      const beforeFirstRes = computeRouteProgress(12.2900, 76.6400, threeStops, 0);
      expect(beforeFirstRes.currentStopSequence).toBe(1);
      expect(beforeFirstRes.nextStopSequence).toBe(2);

      // 5. Strict monotonic guard prevents backward jump even if noise is closer to previous stop
      const noiseRes = computeRouteProgress(12.3082, 76.6554, threeStops, 2);
      expect(noiseRes.currentStopSequence).toBe(2); // Cannot regress to 1
      expect(noiseRes.nextStopSequence).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 3: ETA Engine Tests
  // ─────────────────────────────────────────────────────────────────────────
  describe('Phase 3: ETA Engine', () => {
    // ── Unit Tests for computeEtaMinutes ────────────────────────────────────
    describe('Unit: computeEtaMinutes', () => {
      it('calculates correct ETA from valid speed and distance', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        // Mysore Bus Stand to Mandya Highway: ~39km at Haversine
        // At 60 km/h => ~39 minutes
        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        const eta = computeEtaMinutes(12.3082, 76.6554, nextStop, 60);
        expect(eta).toBeDefined();
        expect(typeof eta).toBe('number');
        expect(eta).toBeGreaterThan(30);
        expect(eta).toBeLessThan(60);
      });

      it('different speeds produce different ETAs — higher speed means lower ETA', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        const etaSlow = computeEtaMinutes(12.3082, 76.6554, nextStop, 30);
        const etaFast = computeEtaMinutes(12.3082, 76.6554, nextStop, 90);

        expect(etaSlow).toBeDefined();
        expect(etaFast).toBeDefined();
        expect(etaSlow!).toBeGreaterThan(etaFast!);
      });

      it('returns undefined when speed is zero — never invents speed', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        expect(computeEtaMinutes(12.3082, 76.6554, nextStop, 0)).toBeUndefined();
      });

      it('returns undefined when speed is negative — invalid speed', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        expect(computeEtaMinutes(12.3082, 76.6554, nextStop, -10)).toBeUndefined();
      });

      it('returns undefined when speed is NaN — invalid speed', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        expect(computeEtaMinutes(12.3082, 76.6554, nextStop, NaN)).toBeUndefined();
      });

      it('returns undefined when speed is Infinity — invalid speed', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        expect(computeEtaMinutes(12.3082, 76.6554, nextStop, Infinity)).toBeUndefined();
      });

      it('returns undefined when nextStop is undefined — no next stop', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        expect(computeEtaMinutes(12.3082, 76.6554, undefined, 60)).toBeUndefined();
      });

      it('returns undefined when vehicle coordinates are (0, 0) — null-island guard', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        expect(computeEtaMinutes(0, 0, nextStop, 60)).toBeUndefined();
      });

      it('returns undefined when next stop coordinates are (0, 0) — null-island guard', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const badStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Bad Stop',
          latitude: 0, longitude: 0,
        };
        expect(computeEtaMinutes(12.3082, 76.6554, badStop, 60)).toBeUndefined();
      });

      it('ETA result is a non-negative whole number (integer)', async () => {
        const { computeEtaMinutes } = await import('../src/services/telemetry.service.js');

        const nextStop = {
          stopId: 's2', sequenceNumber: 2, stopName: 'Mandya Highway',
          latitude: 12.5242, longitude: 76.8958,
        };
        const eta = computeEtaMinutes(12.3082, 76.6554, nextStop, 45);
        expect(eta).toBeDefined();
        expect(eta! % 1).toBe(0); // whole number
        expect(eta!).toBeGreaterThanOrEqual(0);
      });
    });

    // ── Integration Tests: ETA on canonical state endpoint ──────────────────
    describe('Integration: ETA in canonical LiveVehicleState', () => {
      // Fresh trips for Phase 3 that have NOT been driven to a final stop —
      // created in Phase 3 beforeAll so the monotonic guard doesn't interfere.
      let etaForwardTripId: string;
      let etaReverseTripId: string;

      beforeAll(async () => {
        await withSystemContext(async (tx) => {
          // Fresh forward-route trip (uses multiStopRouteId: Mysore→Mandya→Ramanagara)
          const [fwd] = await tx
            .insert(trips)
            .values({
              tenantId: operatorAId,
              routeId: multiStopRouteId,
              busId: busAId,
              driverId: driverAId,
              departureTime: new Date(Date.now() + 3600 * 1000),
              scheduledArrival: new Date(Date.now() + 7200 * 1000),
              status: 'IN_TRANSIT',
              availableSeats: 35,
              totalSeats: 35,
            })
            .returning();
          etaForwardTripId = fwd.id;

          // Fresh reverse-route trip (uses reverseRouteId: Ramanagara→Mandya→Mysore)
          const [rev] = await tx
            .insert(trips)
            .values({
              tenantId: operatorAId,
              routeId: reverseRouteId,
              busId: busAId,
              driverId: driverAId,
              departureTime: new Date(Date.now() + 3600 * 1000),
              scheduledArrival: new Date(Date.now() + 7200 * 1000),
              status: 'IN_TRANSIT',
              availableSeats: 35,
              totalSeats: 35,
            })
            .returning();
          etaReverseTripId = rev.id;
        });
      });

      it('GPS ping with valid speed near first stop — state.etaMinutes is defined and positive', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3082,  // Mysore Bus Stand
            longitude: 76.6554,
            speed: 60,
            heading: 45,
          },
        });

        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${tripAId}/state`,
        });
        expect(res.statusCode).toBe(200);
        const { state } = res.json().data;

        expect(state).not.toBeNull();
        // There IS a next stop (stop 2) so ETA must be defined
        expect(state.nextStopSequence).toBeDefined();
        expect(state.etaMinutes).toBeDefined();
        expect(typeof state.etaMinutes).toBe('number');
        expect(state.etaMinutes).toBeGreaterThan(0);
      });

      it('GPS ping with zero speed — etaMinutes is undefined (no fake ETA)', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3082,
            longitude: 76.6554,
            speed: 0,
            heading: 0,
          },
        });

        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${tripAId}/state`,
        });
        const { state } = res.json().data;
        expect(state).not.toBeNull();
        // Zero speed → no fake ETA
        expect(state.etaMinutes).toBeUndefined();
      });

      it('GPS ping with null/omitted speed — etaMinutes is undefined (no fake ETA)', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3082,
            longitude: 76.6554,
            speed: null,
            heading: null,
          },
        });

        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${tripAId}/state`,
        });
        const { state } = res.json().data;
        expect(state).not.toBeNull();
        // Null speed defaults to 0 → no fake ETA
        expect(state.etaMinutes).toBeUndefined();
      });

      it('Higher speed produces lower ETA than lower speed for same position', async () => {
        // Send fast ping
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3082,
            longitude: 76.6554,
            speed: 80,
            heading: 45,
          },
        });
        const fastRes = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${tripAId}/state`,
        });
        const etaFast = fastRes.json().data.state?.etaMinutes;

        // Send slow ping
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3082,
            longitude: 76.6554,
            speed: 20,
            heading: 45,
          },
        });
        const slowRes = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${tripAId}/state`,
        });
        const etaSlow = slowRes.json().data.state?.etaMinutes;

        expect(etaFast).toBeDefined();
        expect(etaSlow).toBeDefined();
        expect(etaSlow!).toBeGreaterThan(etaFast!);
      }, 10000);

      it('Forward route — etaMinutes present when between stops on a fresh trip', async () => {
        // etaForwardTripId is a fresh 3-stop forward trip (no prior pings → no monotonic lock)
        // Ping between Stop 1 (Mysore) and Stop 2 (Mandya) with real speed
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: etaForwardTripId,
            latitude: 12.4000,
            longitude: 76.7500,
            speed: 55,
            heading: 40,
          },
        });

        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${etaForwardTripId}/state`,
        });
        const { state } = res.json().data;
        expect(state).not.toBeNull();
        // Between stop 1 and stop 2: nextStopSequence must exist
        expect(state.nextStopSequence).toBeDefined();
        expect(state.etaMinutes).toBeDefined();
        expect(typeof state.etaMinutes).toBe('number');
        expect(state.etaMinutes).toBeGreaterThanOrEqual(0);
      });

      it('Final stop — etaMinutes is undefined when no next stop', async () => {
        // multiStopTripId is already at the final stop from Phase 2 tests → etaMinutes must be absent
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${multiStopTripId}/state`,
        });
        const { state } = res.json().data;
        expect(state).not.toBeNull();
        // Verify it is indeed at the final stop (seq 3, no next)
        expect(state.nextStopSequence).toBeUndefined();
        expect(state.etaMinutes).toBeUndefined();
      });

      it('Reverse route — etaMinutes present on a fresh reverse-route trip with valid speed', async () => {
        // etaReverseTripId is a fresh trip on reverseRouteId (Ramanagara→Mandya→Mysore)
        // Ping near Ramanagara (reverse Stop 1) with real speed
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: etaReverseTripId,
            latitude: 12.7150,
            longitude: 77.2810,
            speed: 45,
            heading: 225,
          },
        });

        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${etaReverseTripId}/state`,
        });
        const { state } = res.json().data;
        expect(state).not.toBeNull();
        // Reverse route at stop 1 → next stop is Mandya (seq 2)
        expect(state.currentStopSequence).toBe(1);
        expect(state.nextStopSequence).toBe(2);
        expect(state.etaMinutes).toBeDefined();
        expect(typeof state.etaMinutes).toBe('number');
        expect(state.etaMinutes).toBeGreaterThanOrEqual(0);
      });

      it('etaMinutes field is absent (undefined) when no GPS data — NO_DATA state', async () => {
        const unknownTripId = '00000000-0000-0000-0000-000000000099';
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${unknownTripId}/state`,
        });
        expect(res.statusCode).toBe(200);
        const json = res.json();
        expect(json.data.state).toBeNull();
        expect(json.data.freshness).toBe('NO_DATA');
        // No state → no etaMinutes
      });

      it('Phase 1 + Phase 2 + Phase 3 regression: all canonical fields present with valid speed', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3700,
            longitude: 76.7100,
            speed: 50,
            heading: 48,
          },
        });

        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/tracking/trip/${tripAId}/state`,
        });
        const json = res.json();
        const { state, freshness } = json.data;

        // Phase 1 fields
        expect(typeof state.tripId).toBe('string');
        expect(typeof state.busId).toBe('string');
        expect(typeof state.operatorId).toBe('string');
        expect(typeof state.routeId).toBe('string');
        expect(typeof state.routeCode).toBe('string');
        expect(typeof state.capturedAt).toBe('number');
        expect(typeof state.receivedAt).toBe('string');
        expect(typeof state.lastUpdated).toBe('string');
        expect(['LIVE', 'STALE', 'OFFLINE', 'NO_DATA']).toContain(freshness);
        expect(state.freshness).toBe(freshness);

        // Phase 2 fields
        expect(state.currentStopSequence).toBeDefined();
        expect(state.currentStopId).toBeDefined();

        // Phase 3: etaMinutes present when there is a next stop and speed > 0
        if (state.nextStopSequence !== undefined) {
          expect(state.etaMinutes).toBeDefined();
          expect(typeof state.etaMinutes).toBe('number');
          expect(state.etaMinutes).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 4: Realtime WebSocket Distribution
  // Distributes canonical LiveVehicleState updates to authorized clients in realtime.
  // ─────────────────────────────────────────────────────────────────────────
  describe('Phase 4: Realtime WebSocket Distribution', () => {
    let wsTripEndedId: string;

    function createWsClient(token?: string): Promise<WebSocket> {
      return new Promise((resolve, reject) => {
        const url = token
          ? `ws://127.0.0.1:${wsPort}/ws/tracking?token=${token}`
          : `ws://127.0.0.1:${wsPort}/ws/tracking`;
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
        ws.onopen = () => {
          clearTimeout(timeout);
          resolve(ws);
        };
        ws.onerror = (err) => {
          clearTimeout(timeout);
          reject(err);
        };
      });
    }

    function waitForMessage(
      ws: WebSocket,
      filter?: (msg: any) => boolean,
      timeoutMs = 5000
    ): Promise<any> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          ws.removeEventListener('message', handler);
          reject(new Error(`Timed out waiting for WebSocket message after ${timeoutMs}ms`));
        }, timeoutMs);

        const handler = (event: any) => {
          try {
            const data = JSON.parse(event.data.toString());
            if (!filter || filter(data)) {
              ws.removeEventListener('message', handler);
              clearTimeout(timer);
              resolve(data);
            }
          } catch {
            // Ignore parse errors
          }
        };
        ws.addEventListener('message', handler);
      });
    }

    beforeAll(async () => {
      // Create a dedicated trip for the trip-ended test
      await withSystemContext(async (tx) => {
        const [endTrip] = await tx
          .insert(trips)
          .values({
            tenantId: operatorAId,
            routeId: routeAId,
            busId: busAId,
            driverId: driverAId,
            conductorId: conductorAId,
            departureTime: new Date(Date.now() + 3600 * 1000),
            scheduledArrival: new Date(Date.now() + 7200 * 1000),
            status: 'IN_TRANSIT',
            availableSeats: 30,
            totalSeats: 30,
          })
          .returning();
        wsTripEndedId = endTrip.id;
      });
    });

    it('Valid GPS update reaches authorized WebSocket subscriber with canonical LiveVehicleState', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        // Subscribe to tripAId
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        const ack = await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');
        expect(ack.payload?.subscribedTripId).toBe(tripAId);

        // Driver sends a valid GPS ping with speed & heading
        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3150,
            longitude: 76.6620,
            speed: 48,
            heading: 60,
          },
        });

        // Subscriber receives canonical LIVE_VEHICLE_STATE broadcast
        const broadcast = await waitForMessage(ws, (m) => m.type === 'LIVE_VEHICLE_STATE');
        expect(broadcast.type).toBe('LIVE_VEHICLE_STATE');
        expect(broadcast.payload).toBeDefined();

        const state = broadcast.payload;
        // Verify all 18 canonical LiveVehicleState fields
        expect(state.tripId).toBe(tripAId);
        expect(state.busId).toBe(busAId);
        expect(state.operatorId).toBe(operatorAId);
        expect(state.routeId).toBe(routeAId);
        expect(typeof state.routeCode).toBe('string');
        expect(state.latitude).toBeCloseTo(12.3150, 4);
        expect(state.longitude).toBeCloseTo(76.6620, 4);
        expect(state.speed).toBe(48);
        expect(state.heading).toBe(60);
        expect(typeof state.capturedAt).toBe('number');
        expect(typeof state.receivedAt).toBe('string');
        expect(typeof state.lastUpdated).toBe('string');
        expect(state.freshness).toBe('LIVE');
      } finally {
        ws.close();
      }
    });

    it('WebSocket broadcast preserves route-progress currentStop and nextStop fields', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');

        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3200,
            longitude: 76.6700,
            speed: 52,
            heading: 55,
          },
        });

        const broadcast = await waitForMessage(ws, (m) => m.type === 'LIVE_VEHICLE_STATE');
        const state = broadcast.payload;
        expect(state.currentStopSequence).toBeDefined();
        expect(state.currentStopId).toBeDefined();
        expect(state.nextStopSequence).toBeDefined();
        expect(state.nextStopId).toBeDefined();
      } finally {
        ws.close();
      }
    });

    it('WebSocket broadcast preserves etaMinutes as a valid positive integer', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');

        await new Promise((resolve) => setTimeout(resolve, 1100));
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3400,
            longitude: 76.6900,
            speed: 60,
            heading: 45,
          },
        });

        const broadcast = await waitForMessage(ws, (m) => m.type === 'LIVE_VEHICLE_STATE');
        const state = broadcast.payload;
        expect(state.etaMinutes).toBeDefined();
        expect(typeof state.etaMinutes).toBe('number');
        expect(state.etaMinutes).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(state.etaMinutes)).toBe(true);
      } finally {
        ws.close();
      }
    });

    it('Trip-ended event is broadcast when trip lifecycle clears live tracking', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: wsTripEndedId } }));
        await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');

        // Prime the cache with a ping
        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: wsTripEndedId,
            latitude: 12.3082,
            longitude: 76.6554,
            speed: 25,
            heading: 90,
          },
        });

        // Trigger lifecycle clear
        clearLiveTripCache(wsTripEndedId);

        // Subscriber must receive TRIP_ENDED message
        const endedMsg = await waitForMessage(ws, (m) => m.type === 'TRIP_ENDED');
        expect(endedMsg.type).toBe('TRIP_ENDED');
        expect(endedMsg.payload.tripId).toBe(wsTripEndedId);
        expect(endedMsg.payload.endedAt).toBeDefined();
      } finally {
        ws.close();
      }
    });

    it('Unauthorized trip subscription is rejected for non-existent trip UUID', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        const nonExistentTripId = '00000000-0000-0000-0000-000000000099';
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: nonExistentTripId } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/Trip not found or unauthorized/i);
      } finally {
        ws.close();
      }
    });

    it('Unauthorized trip subscription is rejected for malformed tripId', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: 'not-a-valid-uuid' } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/Invalid or missing tripId/i);
      } finally {
        ws.close();
      }
    });

    it('Cross-tenant subscription rejected: Owner of Operator B cannot subscribe to Operator A trip', async () => {
      const ws = await createWsClient(adminBToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/cannot subscribe to cross-tenant trip/i);
      } finally {
        ws.close();
      }
    });

    it('Passenger cannot subscribe to private/foreign fleet state', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_FLEET', payload: { tenantId: operatorAId } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/Passenger cannot subscribe to fleet radar/i);
      } finally {
        ws.close();
      }
    });

    it('Owner cannot receive another operator fleet state (cross-tenant fleet rejected)', async () => {
      const ws = await createWsClient(adminBToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_FLEET', payload: { tenantId: operatorAId } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/cross-tenant fleet subscription rejected/i);
      } finally {
        ws.close();
      }
    });

    it('Driver cannot subscribe to another driver trip', async () => {
      const ws = await createWsClient(driverBToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/driver can only subscribe to their assigned trip/i);
      } finally {
        ws.close();
      }
    });

    it('Conductor cannot subscribe to an unassigned trip', async () => {
      const ws = await createWsClient(conductorBToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));

        const errMsg = await waitForMessage(ws, (m) => m.type === 'ERROR');
        expect(errMsg.type).toBe('ERROR');
        expect(errMsg.error).toMatch(/conductor can only subscribe to their assigned trip/i);
      } finally {
        ws.close();
      }
    });

    it('Conductor CAN subscribe to their assigned trip', async () => {
      const ws = await createWsClient(conductorAToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));

        const ack = await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');
        expect(ack.payload?.subscribedTripId).toBe(tripAId);
        expect(ack.payload?.status).toBe('SUBSCRIBED');
      } finally {
        ws.close();
      }
    });

    it('Super Admin (PLATFORM_ADMIN) is authorized to subscribe to any trip and fleet', async () => {
      const ws = await createWsClient(platformAdminToken);
      try {
        // Subscribe to trip
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        const ackTrip = await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');
        expect(ackTrip.payload?.subscribedTripId).toBe(tripAId);

        // Subscribe to fleet
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_FLEET', payload: { tenantId: operatorAId } }));
        const ackFleet = await waitForMessage(ws, (m) => m.type === 'FLEET_RADAR_UPDATE');
        expect(ackFleet.payload?.status).toBe('SUBSCRIBED');
      } finally {
        ws.close();
      }
    });

    it('Reconnect / re-subscribing does not create duplicate subscriptions', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        // First subscription
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');

        const count1 = getTripSubscriberCount(tripAId);

        // Duplicate subscription on same socket
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');

        const count2 = getTripSubscriberCount(tripAId);
        expect(count2).toBe(count1);

        // Broadcast count check: send GPS ping and collect messages for 500ms
        await new Promise((resolve) => setTimeout(resolve, 1100));
        let messageCount = 0;
        const countHandler = (event: any) => {
          try {
            const data = JSON.parse(event.data.toString());
            if (data.type === 'LIVE_VEHICLE_STATE') {
              messageCount++;
            }
          } catch {
            // Ignore
          }
        };
        ws.addEventListener('message', countHandler);

        await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 12.3450,
            longitude: 76.6950,
            speed: 45,
            heading: 50,
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
        ws.removeEventListener('message', countHandler);
        expect(messageCount).toBe(1);
      } finally {
        ws.close();
      }
    });

    it('Invalid GPS coordinates (0, 0) are rejected and NOT broadcast to subscribers', async () => {
      const ws = await createWsClient(passengerToken);
      try {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_TRIP', payload: { tripId: tripAId } }));
        await waitForMessage(ws, (m) => m.type === 'TRIP_LOCATION_UPDATE');

        let receivedInvalidBroadcast = false;
        const invalidHandler = (event: any) => {
          try {
            const data = JSON.parse(event.data.toString());
            if (data.type === 'LIVE_VEHICLE_STATE' && data.payload?.latitude === 0 && data.payload?.longitude === 0) {
              receivedInvalidBroadcast = true;
            }
          } catch {
            // Ignore
          }
        };
        ws.addEventListener('message', invalidHandler);

        await new Promise((resolve) => setTimeout(resolve, 1100));
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/tracking/ping',
          headers: { authorization: `Bearer ${driverAToken}` },
          payload: {
            tripId: tripAId,
            latitude: 0,
            longitude: 0,
            speed: 50,
            heading: 0,
          },
        });
        expect(res.statusCode).toBe(400);

        await new Promise((resolve) => setTimeout(resolve, 400));
        ws.removeEventListener('message', invalidHandler);
        expect(receivedInvalidBroadcast).toBe(false);
      } finally {
        ws.close();
      }
    });

    it('Fallback REST endpoint GET /api/v1/tracking/trip/:tripId/state remains functional', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tracking/trip/${tripAId}/state`,
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.state).not.toBeNull();
      expect(json.data.state.tripId).toBe(tripAId);
      expect(json.data.freshness).toBe('LIVE');
    });
  });
});
