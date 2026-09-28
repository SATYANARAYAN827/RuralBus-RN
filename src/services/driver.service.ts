/**
 * Driver Service - Communicates with Authoritative Fastify Backend
 *
 * Backed by Fastify routes:
 * - GET  /api/v1/driver/duty
 * - POST /api/v1/driver/duty/:tripId/start
 * - POST /api/v1/driver/duty/:tripId/end
 * - GET  /api/v1/driver/history
 * - POST /api/v1/tracking/ping
 *
 * CRITICAL INVARIANT:
 * - Strictly calls authoritative endpoints.
 * - No mock success, no fake data, no offline bypass in production.
 * - Driver telemetry is driver-only and scoped to the driver's active tenant/trip.
 */

import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';
import {
  DriverDutyResponse,
  DriverDutyTrip,
  DriverHistoryResponse,
  GpsPingInput,
  GpsPingResponse,
} from '../types';

export class DriverService {
  /**
   * Retrieves the driver's active and upcoming assigned commercial trips.
   * Requires: Bearer token with DRIVER role & tenantId.
   */
  async getDuty(): Promise<DriverDutyResponse> {
    const res = await apiClient.get<DriverDutyResponse>(
      API_CONFIG.ENDPOINTS.DRIVER_DUTY
    );
    return res.data;
  }

  /**
   * Starts commercial trip run, transitioning lifecycle from SCHEDULED to IN_TRANSIT.
   * Sets actualDeparture timestamp on the backend.
   */
  async startTrip(tripId: string): Promise<DriverDutyTrip> {
    if (!tripId || typeof tripId !== 'string') {
      throw new Error('Trip ID is required to start commercial duty');
    }
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.DRIVER_START_TRIP(tripId)
    );
    return res.data?.trip || res.data;
  }

  /**
   * Completes commercial trip run, transitioning lifecycle to COMPLETED.
   * Sets actualArrival timestamp on the backend.
   */
  async endTrip(tripId: string): Promise<DriverDutyTrip> {
    if (!tripId || typeof tripId !== 'string') {
      throw new Error('Trip ID is required to end commercial duty');
    }
    const res = await apiClient.post<any>(
      API_CONFIG.ENDPOINTS.DRIVER_END_TRIP(tripId)
    );
    return res.data?.trip || res.data;
  }

  /**
   * Retrieves driver's past completed trip history and distance logs.
   */
  async getHistory(): Promise<DriverHistoryResponse> {
    const res = await apiClient.get<DriverHistoryResponse>(
      API_CONFIG.ENDPOINTS.DRIVER_HISTORY
    );
    return res.data;
  }

  /**
   * Submits driver GPS telemetry ping to the tracking subsystem.
   * Invariant: Fastify backend accepts GPS pings ONLY for trips with status 'IN_TRANSIT'.
   */
  async sendGpsPing(ping: GpsPingInput): Promise<GpsPingResponse> {
    if (!ping.tripId) {
      throw new Error('Trip ID is required for GPS telemetry ping');
    }
    if (
      typeof ping.latitude !== 'number' ||
      ping.latitude < -90 ||
      ping.latitude > 90
    ) {
      throw new Error('Valid latitude between -90 and 90 is required');
    }
    if (
      typeof ping.longitude !== 'number' ||
      ping.longitude < -180 ||
      ping.longitude > 180
    ) {
      throw new Error('Valid longitude between -180 and 180 is required');
    }

    const payload = {
      tripId: ping.tripId,
      latitude: ping.latitude,
      longitude: ping.longitude,
      speed: typeof ping.speed === 'number' ? Math.max(0, ping.speed) : 0,
      heading: typeof ping.heading === 'number' ? ping.heading : 0,
      accuracy: typeof ping.accuracy === 'number' ? ping.accuracy : 5,
      timestamp: ping.timestamp || new Date().toISOString(),
    };

    const res = await apiClient.post<GpsPingResponse>(
      API_CONFIG.ENDPOINTS.GPS_PING,
      payload
    );
    return res.data;
  }
}

export const driverService = new DriverService();
