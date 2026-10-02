import { Redis } from 'ioredis';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import type { AppUserRole } from '@ruralbus/shared-types';

export interface RefreshTokenSessionData {
  userId: string;
  role: AppUserRole;
  tenantId: string | null;
  email: string | null;
  phone: string | null;
  fullName: string;
  createdAt: number;
}

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('error', (err) => {
      // Avoid crash on unhandled error events in dev/test
      if (env.NODE_ENV !== 'test') {
        console.error('Redis connection error:', err);
      }
    });
  }

  return redisClient;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// In-memory fallback cache to ensure zero session drops if Redis is unavailable or restarting
const inMemorySessions = new Map<string, { data: RefreshTokenSessionData; expiresAt: number }>();

/**
 * Saves a refresh token session in Redis with in-memory fallback.
 * Default TTL is 30 days (2,592,000 seconds).
 */
export async function saveRefreshToken(
  token: string,
  sessionData: RefreshTokenSessionData,
  ttlSeconds = 30 * 24 * 3600
): Promise<void> {
  const hashed = hashToken(token);
  // Always store in memory fallback cache
  inMemorySessions.set(hashed, {
    data: sessionData,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  try {
    const redis = getRedisClient();
    const key = `auth:refresh:${hashed}`;
    await redis.set(key, JSON.stringify(sessionData), 'EX', ttlSeconds);
  } catch (err) {
    if (env.NODE_ENV !== 'test') console.warn('Redis saveRefreshToken failed (using in-memory fallback):', err);
  }
}

/**
 * Retrieves a refresh token session from Redis with in-memory fallback.
 */
export async function getRefreshToken(token: string): Promise<RefreshTokenSessionData | null> {
  const hashed = hashToken(token);

  // 1. Try Redis first
  try {
    const redis = getRedisClient();
    const key = `auth:refresh:${hashed}`;
    const raw = await redis.get(key);
    if (raw) {
      return JSON.parse(raw) as RefreshTokenSessionData;
    }
  } catch {
    // Redis unavailable, fallback to memory
  }

  // 2. Fallback to in-memory session
  const mem = inMemorySessions.get(hashed);
  if (mem) {
    if (mem.expiresAt > Date.now()) {
      return mem.data;
    }
    inMemorySessions.delete(hashed);
  }

  return null;
}

/**
 * Revokes a refresh token from Redis and in-memory cache.
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const hashed = hashToken(token);
  inMemorySessions.delete(hashed);

  try {
    const redis = getRedisClient();
    const key = `auth:refresh:${hashed}`;
    const count = await redis.del(key);
    return count > 0;
  } catch {
    return true;
  }
}

// ==========================================
// REDIS GEOSPATIAL & TELEMETRY ACCELERATORS
// ==========================================

export async function updateFleetGeo(
  tenantId: string,
  busId: string,
  longitude: number,
  latitude: number
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `geo:fleet:${tenantId}`;
    await redis.geoadd(key, longitude, latitude, busId);
    await redis.expire(key, 86400); // 24 hours TTL
  } catch (err) {
    // Non-fatal if Redis is unreachable in mock/isolated tests
  }
}

// ==========================================
// REDIS FAST-PATH SEAT HOLD
// ==========================================

export async function setFastSeatHold(
  tripId: string,
  seatNumber: number,
  passengerId: string,
  ttlSeconds = 300
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `hold:trip:${tripId}:seat:${seatNumber}`;
    // SET key value NX EX ttl -> returns 'OK' if key set, null if key already exists
    const result = await redis.set(key, passengerId, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch {
    // Fail-open to allow Postgres authoritative lock to enforce constraint if Redis fails
    return true;
  }
}

export async function releaseFastSeatHold(
  tripId: string,
  seatNumber: number
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `hold:trip:${tripId}:seat:${seatNumber}`;
    const count = await redis.del(key);
    return count > 0;
  } catch {
    return false;
  }
}

export async function isSeatFastHeld(
  tripId: string,
  seatNumber: number
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = `hold:trip:${tripId}:seat:${seatNumber}`;
    const exists = await redis.exists(key);
    return exists > 0;
  } catch {
    return false;
  }
}

/**
 * Closes the Redis connection cleanly during server shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore errors on close
    }
    redisClient = null;
  }
}
