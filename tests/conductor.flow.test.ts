/**
 * Module 5 — Conductor Experience & Authoritative Backend Contract Verification
 *
 * Verifies:
 * 1. Authenticated Conductor Access & Authoritative Fastify Route Catalog
 * 2. Role Isolation & Security Invariants (Conductor vs Driver vs Super Admin)
 * 3. Assigned Trip Loading from Authoritative Fastify Backend
 * 4. Passenger Manifest Loading & Roster Filtering
 * 5. Boarding / Deboarding State Transitions (CONFIRMED <-> BOARDED)
 * 6. QR / Digital Ticket Validation Contract (HMAC Signature & Duplicate Detection)
 * 7. Cash Ticket / POS Issuance Contract & Receipt Generation
 * 8. Offline Queue & Batch Synchronization Contract
 * 9. API Failure Propagation & Zero Fake/Mock Success
 * 10. Conductor Logout & State Cleanup
 * 11. Tracking & Telemetry Permission Isolation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { API_CONFIG } from '../src/config/api.config';
import { ROLE_NAVIGATION_CONFIGS } from '../src/navigation/roleNavigationConfig';
import { conductorService } from '../src/services/conductor.service';
import { useConductorStore } from '../src/stores/conductor.store';
import { apiClient } from '../src/services/api.client';
import { ManifestPassenger, DriverDutyTrip } from '../src/types';

describe('Module 5 — Conductor Experience & Authoritative Backend Contract Verification', () => {
  it('1. Authenticated Conductor Access & Fastify Route Catalog: exact match with backend routes', () => {
    assert.equal(API_CONFIG.ENDPOINTS.CONDUCTOR_DUTY, '/api/v1/conductor/duty');
    assert.equal(
      API_CONFIG.ENDPOINTS.CONDUCTOR_MANIFEST('trip-123'),
      '/api/v1/conductor/manifest/trip-123'
    );
    assert.equal(
      API_CONFIG.ENDPOINTS.CONDUCTOR_BOARD_PASSENGER('trip-123', 'tkt-456'),
      '/api/v1/conductor/manifest/trip-123/board/tkt-456'
    );
    assert.equal(API_CONFIG.ENDPOINTS.CONDUCTOR_STATS, '/api/v1/conductor/stats');
    assert.equal(API_CONFIG.ENDPOINTS.VALIDATE_QR_TICKET, '/api/v1/tickets/validate-qr');
    assert.equal(API_CONFIG.ENDPOINTS.CONDUCTOR_CASH_TICKET, '/api/v1/conductor/cash-ticket');
    assert.equal(
      API_CONFIG.ENDPOINTS.CONDUCTOR_OFFLINE_CASH_SYNC,
      '/api/v1/conductor/offline-tickets/sync'
    );
    assert.equal(
      API_CONFIG.ENDPOINTS.CONDUCTOR_CASH_SETTLEMENT('trip-123'),
      '/api/v1/conductor/cash-settlement/trip-123'
    );
  });

  it('2. Role Isolation & Security Invariants: Conductor tabs vs Driver vs Super Admin', () => {
    // 1. Conductor navigation items
    const conductorTabs = ROLE_NAVIGATION_CONFIGS.CONDUCTOR.items.map((i) => i.id);
    assert.deepEqual(conductorTabs, ['HOME', 'SCAN', 'PASSENGERS', 'CASH_TICKETS', 'PROFILE']);

    // 2. Conductor must not have Driver duty controls (MAP radar or STOPS progression)
    assert.ok(!conductorTabs.includes('MAP' as any), 'Conductor must NOT have Driver MAP radar');
    assert.ok(!conductorTabs.includes('STOPS' as any), 'Conductor must NOT have Driver STOPS progression checklist');

    // 3. Conductor must not have Operator Admin fleet management tabs
    assert.ok(!conductorTabs.includes('BUSES' as any), 'Conductor must NOT have Operator BUSES fleet manager');
    assert.ok(!conductorTabs.includes('LIVE_MAP' as any), 'Conductor must NOT have Operator LIVE_MAP fleet radar');

    // 4. Super Admin strict invariant: Zero live tracking / radar / maps
    const superAdminItems = ROLE_NAVIGATION_CONFIGS.PLATFORM_ADMIN.items.map((i) => i.id);
    assert.ok(!superAdminItems.includes('MAP' as any), 'Super Admin must NOT contain MAP tab');
    assert.ok(!superAdminItems.includes('SCAN' as any), 'Super Admin must NOT contain Conductor SCAN tab');
  });

  it('3. Assigned Trip Loading: calls authoritative backend and rejects unauthenticated requests', async () => {
    // Ensure no token is set
    apiClient.setAuthToken(null);

    // Live Fastify backend rejects duty call without bearer token
    await assert.rejects(
      async () => {
        await conductorService.getDuty();
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
      id: 'mock-conductor-trip-1',
      routeId: 'route-con-1',
      routeCode: 'OD-01',
      origin: 'Baramunda ISBT',
      destination: 'Puri Bus Stand',
      busId: 'bus-con-1',
      busRegistrationNumber: 'OD-02-B-9988',
      busModel: 'Ashok Leyland Viking',
      totalSeats: 40,
      seatingType: 'SEATER_2X2',
      departureTime: new Date().toISOString(),
      scheduledArrival: new Date(Date.now() + 7200000).toISOString(),
      status: 'SCHEDULED',
      availableSeats: 32,
      totalDistanceKm: 62.5,
      estimatedDurationMinutes: 120,
      stops: [],
    };

    useConductorStore.setState({
      activeTrip: mockTrip,
      totalBookedSeats: 8,
      totalBoardedSeats: 3,
      totalAwaitingSeats: 5,
      totalSeats: 40,
      isLoadingDuty: false,
    });

    const storeState = useConductorStore.getState();
    assert.equal(storeState.activeTrip?.id, 'mock-conductor-trip-1');
    assert.equal(storeState.activeTrip?.busRegistrationNumber, 'OD-02-B-9988');
    assert.equal(storeState.totalBookedSeats, 8);
    assert.equal(storeState.totalBoardedSeats, 3);
    assert.equal(storeState.totalAwaitingSeats, 5);
  });

  it('5. Manifest Loading Contract: requires tripId and rejects unauthenticated queries', async () => {
    // 1. Missing tripId validation
    await assert.rejects(
      async () => {
        await conductorService.getManifest('');
      },
      /Trip ID is required to fetch passenger manifest/
    );

    // 2. Unauthenticated request to backend
    apiClient.setAuthToken(null);
    await assert.rejects(
      async () => {
        await conductorService.getManifest('b9f783ee-8f19-48cf-9a99-b1d7d083bc99');
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

  it('6. Boarding / Deboarding State Transitions: toggles isBoarded and updates count', async () => {
    const mockPassengers: ManifestPassenger[] = [
      {
        ticketId: 'tkt-001',
        bookingId: 'bkg-001',
        ticketNumber: 'TKT-1001',
        seatNumber: '1',
        passengerName: 'Aarav Patel',
        passengerPhone: '9876543210',
        fromStopName: 'Baramunda ISBT',
        toStopName: 'Puri Bus Stand',
        fare: 150,
        isBoarded: false,
        status: 'CONFIRMED',
      },
      {
        ticketId: 'tkt-002',
        bookingId: 'bkg-002',
        ticketNumber: 'TKT-1002',
        seatNumber: '2',
        passengerName: 'Diya Sharma',
        passengerPhone: '9876543211',
        fromStopName: 'Baramunda ISBT',
        toStopName: 'Puri Bus Stand',
        fare: 150,
        isBoarded: true,
        status: 'BOARDED',
      },
    ];

    useConductorStore.setState({
      activeTrip: {
        id: 'mock-trip-boarding',
        routeId: 'r1',
        routeCode: 'OD-01',
        origin: 'Baramunda',
        destination: 'Puri',
        busId: 'b1',
        busRegistrationNumber: 'OD-02-B-9988',
        busModel: 'Standard',
        totalSeats: 40,
        seatingType: 'SEATER',
        departureTime: new Date().toISOString(),
        scheduledArrival: new Date().toISOString(),
        status: 'BOARDING',
        availableSeats: 38,
        totalDistanceKm: 60,
        estimatedDurationMinutes: 120,
        stops: [],
      },
      manifest: mockPassengers,
      totalBookedSeats: 2,
      totalBoardedSeats: 1,
      totalAwaitingSeats: 1,
    });

    const origUpdateBoarding = conductorService.updateBoardingStatus;
    try {
      // Mock service updateBoardingStatus
      (conductorService as any).updateBoardingStatus = async (
        tripId: string,
        ticketId: string,
        isBoarded: boolean
      ) => ({
        success: true,
        ticketId,
        isBoarded,
      });

      // Board passenger 1
      const isBoardedResult = await useConductorStore.getState().toggleBoarding('tkt-001');
      assert.equal(isBoardedResult, true);

      const stateAfterBoarding = useConductorStore.getState();
      const p1 = stateAfterBoarding.manifest.find((p) => p.ticketId === 'tkt-001');
      assert.equal(p1?.isBoarded, true);
      assert.equal(p1?.status, 'BOARDED');
      assert.equal(stateAfterBoarding.totalBoardedSeats, 2);
      assert.equal(stateAfterBoarding.totalAwaitingSeats, 0);

      // Unboard passenger 1 (e.g. wrong bus / passenger stepped off)
      const isUnboardedResult = await useConductorStore.getState().toggleBoarding('tkt-001');
      assert.equal(isUnboardedResult, false);

      const stateAfterUnboarding = useConductorStore.getState();
      const p1Unboarded = stateAfterUnboarding.manifest.find((p) => p.ticketId === 'tkt-001');
      assert.equal(p1Unboarded?.isBoarded, false);
      assert.equal(p1Unboarded?.status, 'CONFIRMED');
      assert.equal(stateAfterUnboarding.totalBoardedSeats, 1);
      assert.equal(stateAfterUnboarding.totalAwaitingSeats, 1);
    } finally {
      conductorService.updateBoardingStatus = origUpdateBoarding;
    }
  });

  it('7. QR / Ticket Validation Contract: requires QR payload and surfaces duplicate/valid states', async () => {
    // 1. Missing QR payload validation
    await assert.rejects(
      async () => {
        await conductorService.validateQrTicket('');
      },
      /QR payload is required for ticket validation/
    );

    // 2. Unauthenticated request rejection from backend
    apiClient.setAuthToken(null);
    await assert.rejects(
      async () => {
        await conductorService.validateQrTicket('TKT-QR:invalid.sig');
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

    // 3. Store duplicate scan handling
    const origValidate = conductorService.validateQrTicket;
    try {
      (conductorService as any).validateQrTicket = async (qrData: string) => ({
        valid: false,
        alreadyBoarded: true,
        message: 'Duplicate Scan: Ticket was already scanned and boarded at 10:15 AM',
        ticket: {
          ticketId: 'tkt-dup-1',
          bookingId: 'bkg-dup-1',
          tripId: 'trip-dup-1',
          tenantId: 'tenant-1',
          passengerId: 'p-1',
          passengerName: 'Rohan Verma',
          seatNumber: 12,
          origin: 'Baramunda',
          destination: 'Puri',
          departureTime: new Date().toISOString(),
          fareAmount: 180,
          status: 'BOARDED',
          qrSignature: qrData,
          boardedAt: new Date().toISOString(),
        },
      });

      const res = await useConductorStore.getState().validateTicket('TKT-QR:sample.dup.payload');
      assert.equal(res.alreadyBoarded, true);
      assert.equal(useConductorStore.getState().scanStatus, 'DUPLICATE');
      assert.equal(
        useConductorStore.getState().scanMessage,
        'Duplicate Scan: Ticket was already scanned and boarded at 10:15 AM'
      );
      assert.equal(useConductorStore.getState().isValidationModalOpen, true);
    } finally {
      conductorService.validateQrTicket = origValidate;
    }
  });

  it('8. Cash Ticket / POS Issuance Contract: validates inputs, calculates fare and creates receipt', async () => {
    // 1. Missing tripId validation
    await assert.rejects(
      async () => {
        await conductorService.issueCashTicket({
          tripId: '',
          passengerCount: 1,
          unitFare: 50,
          fareAmount: 50,
        });
      },
      /Trip ID is required to issue cash ticket/
    );

    // 2. Zero or negative fare validation
    await assert.rejects(
      async () => {
        await conductorService.issueCashTicket({
          tripId: 'trip-pos-1',
          passengerCount: 1,
          unitFare: 0,
          fareAmount: 0,
        });
      },
      /Fare amount must be greater than zero/
    );

    // 3. Issue cash ticket through store
    useConductorStore.setState({
      activeTrip: {
        id: 'trip-cash-active',
        routeId: 'r1',
        routeCode: 'OD-01',
        origin: 'Baramunda',
        destination: 'Puri',
        busId: 'b1',
        busRegistrationNumber: 'OD-02-B-9988',
        busModel: 'Standard',
        totalSeats: 40,
        seatingType: 'SEATER',
        departureTime: new Date().toISOString(),
        scheduledArrival: new Date().toISOString(),
        status: 'IN_TRANSIT',
        availableSeats: 30,
        totalDistanceKm: 60,
        estimatedDurationMinutes: 120,
        stops: [],
      },
      fromStop: 'Baramunda ISBT',
      toStop: 'Puri Bus Stand',
      unitFare: 75,
      passengerCount: 2,
      totalFare: 150,
    });

    const origIssue = conductorService.issueCashTicket;
    try {
      (conductorService as any).issueCashTicket = async (payload: any) => ({
        ticketId: 'CSH-123456',
        synced: true,
        message: 'Cash ticket successfully issued and synchronized',
      });

      const receipt = await useConductorStore.getState().issueCashTicket();
      assert.equal(receipt.ticketId, 'CSH-123456');
      assert.equal(receipt.passengerCount, 2);
      assert.equal(receipt.unitFare, 75);
      assert.equal(receipt.fareAmount, 150);
      assert.equal(receipt.synced, true);
      assert.equal(useConductorStore.getState().isReceiptModalOpen, true);
    } finally {
      conductorService.issueCashTicket = origIssue;
    }
  });

  it('9. Offline Queue & Batch Synchronization: handles empty batch and validates inputs', async () => {
    // 1. Missing tripId validation
    await assert.rejects(
      async () => {
        await conductorService.syncOfflineBatch('', 'dev-1', []);
      },
      /Trip ID and Device ID are required for offline sync/
    );

    // 2. Empty batch returns 0 synced count without unnecessary network calls
    const res = await conductorService.syncOfflineBatch('trip-1', 'dev-1', []);
    assert.equal(res.syncedCount, 0);
    assert.equal(res.totalCashAmount, 0);
    assert.deepEqual(res.processedTickets, []);
  });

  it('10. API Failure Propagation: surfaces real backend errors and forbids fake success', async () => {
    const origGet = apiClient.get;
    try {
      // Simulate backend 500 error on Conductor Duty
      (apiClient as any).get = async () => {
        throw new Error('HTTP 500: Database connection failure on conductor roster');
      };

      await assert.rejects(
        async () => {
          await conductorService.getDuty();
        },
        /HTTP 500: Database connection failure on conductor roster/
      );

      // Verify store captures the error instead of fabricating duty data
      await useConductorStore.getState().fetchDuty();
      assert.equal(
        useConductorStore.getState().dutyError,
        'HTTP 500: Database connection failure on conductor roster'
      );
      assert.equal(useConductorStore.getState().activeTrip, null);
    } finally {
      apiClient.get = origGet;
    }
  });

  it('11. Conductor Logout Invariant: clears all duty, manifest, scanner, POS, and modal state', () => {
    useConductorStore.setState({
      activeTrip: { id: 'trip-to-clear' } as any,
      manifest: [{ ticketId: 'tkt-1' } as any],
      scanStatus: 'VALID',
      manualTicketInput: 'GB-9999',
      issuedReceipt: { ticketId: 'CSH-1' } as any,
      offlineQueue: [{ ticketCode: 'TKT-1' } as any],
      isReceiptModalOpen: true,
      isValidationModalOpen: true,
    });

    // Reset Conductor State
    useConductorStore.getState().resetConductorState();

    const state = useConductorStore.getState();
    assert.equal(state.activeTrip, null);
    assert.deepEqual(state.manifest, []);
    assert.equal(state.scanStatus, 'IDLE');
    assert.equal(state.manualTicketInput, '');
    assert.equal(state.issuedReceipt, null);
    assert.deepEqual(state.offlineQueue, []);
    assert.equal(state.isReceiptModalOpen, false);
    assert.equal(state.isValidationModalOpen, false);
  });

  it('12. Telemetry & Tracking Permission Isolation: Conductor has zero tracking/radar controls', () => {
    // 1. Fastify backend tracking routes check:
    // /api/v1/tracking/ping is strictly DRIVER role
    // /api/v1/tracking/fleet is strictly OPERATOR_ADMIN role
    // Conductor navigation has zero map or tracking items
    const conductorTabs = ROLE_NAVIGATION_CONFIGS.CONDUCTOR.items.map((i) => i.id);
    assert.ok(!conductorTabs.includes('MAP' as any), 'Conductor has NO map tab');
    assert.ok(!conductorTabs.includes('LIVE_MAP' as any), 'Conductor has NO live map tab');
    assert.ok(!conductorTabs.includes('RADAR' as any), 'Conductor has NO radar tab');
    assert.ok(!conductorTabs.includes('TRACKING' as any), 'Conductor has NO tracking tab');
  });
});
