/**
 * Conductor Service - Communicates with Authoritative Fastify Backend
 *
 * Backed by Fastify routes:
 * - GET  /api/v1/conductor/duty
 * - GET  /api/v1/conductor/manifest/:tripId
 * - PUT  /api/v1/conductor/manifest/:tripId/board/:ticketId
 * - GET  /api/v1/conductor/stats
 * - POST /api/v1/tickets/validate-qr
 * - GET  /api/v1/tickets/manifest/offline/:tripId
 * - POST /api/v1/conductor/cash-ticket
 * - POST /api/v1/conductor/offline-tickets/sync
 * - GET  /api/v1/conductor/cash-settlement/:tripId
 *
 * CRITICAL INVARIANTS:
 * - Strictly calls authoritative Fastify endpoints.
 * - No mock success, no fake data, no client-side ticket fabrication.
 * - Errors must propagate; never silently report success.
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';
import {
  ConductorDutyResponse,
  ConductorManifestResponse,
  BoardingUpdateResult,
  ConductorStatsResponse,
  TicketValidationResult,
  OfflineCashTicketPayload,
  CashTicketIssueResponse,
  OfflineCashBatchSyncResponse,
  ConductorCashSettlementReport,
} from '../types';

export class ConductorService {
  /**
   * Retrieves active assigned trip duty and seating breakdown for authenticated conductor.
   * Requires: Bearer token with CONDUCTOR role & tenantId.
   */
  async getDuty(): Promise<ConductorDutyResponse> {
    const res = await apiClient.get<ConductorDutyResponse>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_DUTY
    );
    return res.data;
  }

  /**
   * Retrieves passenger manifest for the assigned trip.
   */
  async getManifest(tripId: string): Promise<ConductorManifestResponse> {
    if (!tripId || typeof tripId !== 'string') {
      throw new Error('Trip ID is required to fetch passenger manifest');
    }
    const res = await apiClient.get<ConductorManifestResponse>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_MANIFEST(tripId)
    );
    return res.data;
  }

  /**
   * Updates passenger boarding state on the authoritative backend.
   * Transitions ticket and booking status between VALID and BOARDED.
   */
  async updateBoardingStatus(
    tripId: string,
    ticketId: string,
    isBoarded: boolean
  ): Promise<BoardingUpdateResult> {
    if (!tripId || !ticketId) {
      throw new Error('Trip ID and Ticket ID are required to update boarding status');
    }
    const res = await apiClient.put<BoardingUpdateResult>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_BOARD_PASSENGER(tripId, ticketId),
      { isBoarded }
    );
    return res.data;
  }

  /**
   * Retrieves conductor shift operational summary statistics.
   */
  async getStats(): Promise<ConductorStatsResponse> {
    const res = await apiClient.get<ConductorStatsResponse>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_STATS
    );
    return res.data;
  }

  /**
   * Validates passenger QR or digital ticket signature against authoritative backend.
   * Server validates HMAC cryptographic token and marks ticket as BOARDED if valid.
   */
  async validateQrTicket(qrData: string): Promise<TicketValidationResult> {
    if (!qrData || typeof qrData !== 'string' || qrData.trim().length === 0) {
      throw new Error('QR payload is required for ticket validation');
    }
    const res = await apiClient.post<TicketValidationResult>(
      API_CONFIG.ENDPOINTS.VALIDATE_QR_TICKET,
      { qrData: qrData.trim() }
    );
    return res.data;
  }

  /**
   * Issues a cash ticket on the bus and syncs immediately to the backend.
   */
  async issueCashTicket(payload: {
    tripId: string;
    boardingStopId?: string;
    droppingStopId?: string;
    fromStopName?: string;
    toStopName?: string;
    passengerCount: number;
    unitFare: number;
    fareAmount: number;
    ticketId?: string;
    ticketCode?: string;
  }): Promise<CashTicketIssueResponse> {
    if (!payload.tripId) {
      throw new Error('Trip ID is required to issue cash ticket');
    }
    if (payload.fareAmount <= 0) {
      throw new Error('Fare amount must be greater than zero');
    }
    const res = await apiClient.post<CashTicketIssueResponse>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_CASH_TICKET,
      payload
    );
    return res.data;
  }

  /**
   * Synchronizes a batch of offline cash tickets collected during low connectivity.
   */
  async syncOfflineBatch(
    tripId: string,
    deviceId: string,
    tickets: OfflineCashTicketPayload[]
  ): Promise<OfflineCashBatchSyncResponse> {
    if (!tripId || !deviceId) {
      throw new Error('Trip ID and Device ID are required for offline sync');
    }
    if (!tickets || tickets.length === 0) {
      return {
        syncedCount: 0,
        totalCashAmount: 0,
        processedTickets: [],
      };
    }
    const res = await apiClient.post<OfflineCashBatchSyncResponse>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_OFFLINE_CASH_SYNC,
      {
        tripId,
        deviceId,
        tickets,
      }
    );
    return res.data;
  }

  /**
   * Retrieves cash settlement and revenue reconciliation report for the trip.
   */
  async getCashSettlement(tripId: string): Promise<ConductorCashSettlementReport> {
    if (!tripId || typeof tripId !== 'string') {
      throw new Error('Trip ID is required to retrieve cash settlement report');
    }
    const res = await apiClient.get<ConductorCashSettlementReport>(
      API_CONFIG.ENDPOINTS.CONDUCTOR_CASH_SETTLEMENT(tripId)
    );
    return res.data;
  }

  /**
   * Pre-departure offline manifest download for caching passenger roster.
   */
  async getOfflineManifest(tripId: string): Promise<any> {
    if (!tripId || typeof tripId !== 'string') {
      throw new Error('Trip ID is required to download offline manifest');
    }
    const res = await apiClient.get(
      API_CONFIG.ENDPOINTS.OFFLINE_MANIFEST(tripId)
    );
    return res.data;
  }
}

export const conductorService = new ConductorService();
