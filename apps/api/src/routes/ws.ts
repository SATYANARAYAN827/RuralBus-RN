import { FastifyInstance } from 'fastify';
import {
  subscribeToTrip,
  unsubscribeFromTrip,
  subscribeToFleet,
  unsubscribeFromFleet,
  cleanupSocket,
  processGpsPing,
  validateTripSubscription,
  validateFleetSubscription,
  getLiveVehicleState,
} from '../services/telemetry.service.js';
import { gpsPingSchema, wsMessageSchema } from '@ruralbus/shared-validators';
import type { WebSocketMessage } from '@ruralbus/shared-types';

export async function websocketRoutes(app: FastifyInstance) {
  app.get('/ws/tracking', { websocket: true }, (socket, req) => {
    let authUser: { sub: string; role: string; tenantId: string | null } | null = null;

    // Check token from query param ?token=... or Authorization header
    const queryToken = (req.query as any)?.token;
    const authHeader = req.headers?.authorization;
    const headerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    const token = queryToken || headerToken;

    if (token) {
      try {
        const decoded = app.jwt.verify(token) as any;
        authUser = {
          sub: decoded.sub,
          role: decoded.role,
          tenantId: decoded.tenantId ?? null,
        };
      } catch {
        socket.send(
          JSON.stringify({
            type: 'ERROR',
            error: 'Authentication failed: invalid token',
          })
        );
      }
    }

    socket.on('message', async (data: Buffer | string) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        const parsed = wsMessageSchema.safeParse(message);
        if (!parsed.success) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              error: 'Invalid message structure',
            })
          );
          return;
        }

        switch (message.type) {
          case 'PING':
            socket.send(JSON.stringify({ type: 'PONG', payload: { timestamp: Date.now() } }));
            break;

          case 'SUBSCRIBE_TRIP': {
            const tripId = message.payload?.tripId;
            const authResult = await validateTripSubscription(tripId, authUser);
            if (!authResult.authorized) {
              socket.send(
                JSON.stringify({
                  type: 'ERROR',
                  error: authResult.reason || 'Unauthorized trip subscription',
                })
              );
              break;
            }

            subscribeToTrip(tripId, socket);

            // Send subscription confirmation
            socket.send(
              JSON.stringify({
                type: 'TRIP_LOCATION_UPDATE',
                payload: { subscribedTripId: tripId, status: 'SUBSCRIBED' },
              })
            );

            // Send current canonical LiveVehicleState immediately if active in cache
            const { state } = getLiveVehicleState(tripId);
            if (state) {
              socket.send(
                JSON.stringify({
                  type: 'LIVE_VEHICLE_STATE',
                  payload: state,
                })
              );
            }
            break;
          }

          case 'UNSUBSCRIBE_TRIP': {
            const tripId = message.payload?.tripId;
            if (tripId) {
              unsubscribeFromTrip(tripId, socket);
            }
            break;
          }

          case 'SUBSCRIBE_FLEET': {
            const requestedTenantId = message.payload?.tenantId;
            const authResult = validateFleetSubscription(requestedTenantId, authUser);
            if (!authResult.authorized) {
              socket.send(
                JSON.stringify({
                  type: 'ERROR',
                  error: authResult.reason || 'Unauthorized fleet subscription',
                })
              );
              break;
            }

            const targetTenantId = authResult.targetTenantId!;
            subscribeToFleet(targetTenantId, socket);
            socket.send(
              JSON.stringify({
                type: 'FLEET_RADAR_UPDATE',
                payload: { subscribedTenantId: targetTenantId, status: 'SUBSCRIBED' },
              })
            );
            break;
          }

          case 'UNSUBSCRIBE_FLEET': {
            const targetTenantId = authUser?.tenantId;
            if (targetTenantId) {
              unsubscribeFromFleet(targetTenantId, socket);
            }
            break;
          }

          case 'GPS_PING': {
            if (!authUser || authUser.role !== 'DRIVER' || !authUser.tenantId) {
              socket.send(
                JSON.stringify({
                  type: 'ERROR',
                  error: 'Unauthorized: Driver authentication and tenant context required for GPS_PING',
                })
              );
              return;
            }

            const pingResult = gpsPingSchema.safeParse(message.payload);
            if (!pingResult.success) {
              socket.send(
                JSON.stringify({
                  type: 'ERROR',
                  error: pingResult.error.errors[0]?.message || 'Invalid GPS coordinates',
                })
              );
              return;
            }

            const { liveVehicleState } = await processGpsPing(
              authUser.tenantId,
              authUser.sub,
              pingResult.data
            );

            socket.send(
              JSON.stringify({
                type: 'LIVE_VEHICLE_STATE',
                payload: liveVehicleState,
              })
            );
            break;
          }

          default:
            break;
        }
      } catch (err: any) {
        socket.send(
          JSON.stringify({
            type: 'ERROR',
            error: err.message || 'Internal server error in tracking socket',
          })
        );
      }
    });

    socket.on('close', () => {
      cleanupSocket(socket);
    });

    socket.on('error', () => {
      cleanupSocket(socket);
    });
  });
}
