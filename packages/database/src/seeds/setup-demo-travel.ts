/**
 * setup-demo-travel.ts
 *
 * Idempotent, fully dynamic, DB-driven setup script for "Demo Travel" (or any operator).
 *
 * RULES:
 *  - NEVER creates, modifies, or duplicates user accounts or passwords.
 *  - Discovers existing users from the database by role/membership and reuses them.
 *  - Supports CLI arguments and environment variables for any future operator/crew configuration.
 *  - Falls back to dynamic database discovery of active users matching required roles.
 *  - Reports clearly if a required role/user is missing or in conflict with another tenant.
 *  - Idempotent: safe to run repeatedly without creating duplicates.
 *  - All non-user data (operator, bus, stops, routes, schedules, testable trips, crew assignments)
 *    is upserted cleanly within a transaction.
 *
 * Usage:
 *   cd packages/database
 *   npm run setup:demo
 *
 * Or with custom parameters:
 *   npx tsx src/seeds/setup-demo-travel.ts --operator "Demo Travel" --code DEMOTRAVEL --bus 11-AA-0000 --owner 9861465410 --driver 8018174171 --conductor 6371289527 --passenger 7381319957
 */

import { eq, and, sql, inArray, or, ne, gte, lte, not, desc } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import {
  withSystemContext,
  users,
  operators,
  buses,
  stops,
  routes,
  schedules,
  trips,
  operatorMembers,
} from '../index.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface StopDef {
  code: string;
  name: string;
  landmark: string;
  latitude: number;
  longitude: number;
}

export interface StopRouteEntry {
  code: string;
  distanceFromStartKm: number;
  estimatedMinutesFromStart: number;
  fareFromStart: number;
}

export interface RouteDef {
  routeCode: string;
  originCode: string;
  destinationCode: string;
  stops: StopRouteEntry[];
  scheduleDepTime: string; // HH:mm:ss
  scheduleArrTime: string; // HH:mm:ss
  daysOfWeek: number[];
  baseFare: number;
}

export interface OperatorConfig {
  companyName: string;
  businessCode: string;
  contactEmail: string;
  contactPhone: string;
  corridor: string;

  preferredOwnerPhone?: string;
  isExplicitOwnerPhone?: boolean;
  preferredDriverPhone?: string;
  isExplicitDriverPhone?: boolean;
  preferredConductorPhone?: string;
  isExplicitConductorPhone?: boolean;
  preferredPassengerPhone?: string;
  isExplicitPassengerPhone?: boolean;

  bus: {
    registrationNumber: string;
    model: string;
    totalSeats: number;
    seatingType: 'SEATER_2X2' | 'SEATER_3X2' | 'SLEEPER' | 'SEMI_SLEEPER';
    amenities: string[];
  };

  stops: StopDef[];
  routes: RouteDef[];
}

// ─────────────────────────────────────────────────────────────────────────────
// JAIPUR TONK ROAD CORRIDOR — real GPS data from Google Maps
// Covers all stops that contain "Chowk" or "Bus Stand" on this corridor.
// ─────────────────────────────────────────────────────────────────────────────

export const JAIPUR_STOPS: StopDef[] = [
  {
    code: 'SNR-BS',
    name: 'Sanganer Bus Stand',
    landmark: 'Near Sanganer Airport Road, Jaipur',
    latitude: 26.8023,
    longitude: 75.8166,
  },
  {
    code: 'DGP-CK',
    name: 'Durgapura Chowk',
    landmark: 'Durgapura, Jaipur',
    latitude: 26.8325,
    longitude: 75.8016,
  },
  {
    code: 'TNK-CK',
    name: 'Tonk Phatak Chowk',
    landmark: 'Tonk Road, Jaipur',
    latitude: 26.8596,
    longitude: 75.8001,
  },
  {
    code: 'RBG-CK',
    name: 'Rambagh Chowk',
    landmark: 'Near Rambagh Palace Road, Jaipur',
    latitude: 26.8851,
    longitude: 75.8028,
  },
  {
    code: 'AJM-CK',
    name: 'Ajmeri Gate Chowk',
    landmark: 'Ajmeri Gate, Walled City, Jaipur',
    latitude: 26.9053,
    longitude: 75.8007,
  },
  {
    code: 'SIN-BS',
    name: 'Sindhi Camp Bus Stand',
    landmark: 'Sindhi Camp, Jaipur',
    latitude: 26.9139,
    longitude: 75.7927,
  },
  {
    code: 'JPR-JN',
    name: 'Jaipur Junction',
    landmark: 'Railway Station Road, Gopalbari, Jaipur',
    latitude: 26.9196,
    longitude: 75.788,
  },
];

// Forward: Sanganer Bus Stand → Jaipur Junction
export const FWD_STOPS: StopRouteEntry[] = [
  { code: 'SNR-BS', distanceFromStartKm: 0,    estimatedMinutesFromStart: 0,   fareFromStart: 0  },
  { code: 'DGP-CK', distanceFromStartKm: 4.2,  estimatedMinutesFromStart: 12,  fareFromStart: 15 },
  { code: 'TNK-CK', distanceFromStartKm: 9.1,  estimatedMinutesFromStart: 25,  fareFromStart: 25 },
  { code: 'RBG-CK', distanceFromStartKm: 13.8, estimatedMinutesFromStart: 38,  fareFromStart: 35 },
  { code: 'AJM-CK', distanceFromStartKm: 17.5, estimatedMinutesFromStart: 48,  fareFromStart: 45 },
  { code: 'SIN-BS', distanceFromStartKm: 20.2, estimatedMinutesFromStart: 56,  fareFromStart: 50 },
  { code: 'JPR-JN', distanceFromStartKm: 21.4, estimatedMinutesFromStart: 60,  fareFromStart: 55 },
];

// Reverse: Jaipur Junction → Sanganer Bus Stand
export const REV_STOPS: StopRouteEntry[] = [
  { code: 'JPR-JN', distanceFromStartKm: 0,    estimatedMinutesFromStart: 0,   fareFromStart: 0  },
  { code: 'SIN-BS', distanceFromStartKm: 1.2,  estimatedMinutesFromStart: 5,   fareFromStart: 10 },
  { code: 'AJM-CK', distanceFromStartKm: 3.9,  estimatedMinutesFromStart: 12,  fareFromStart: 15 },
  { code: 'RBG-CK', distanceFromStartKm: 7.6,  estimatedMinutesFromStart: 22,  fareFromStart: 25 },
  { code: 'TNK-CK', distanceFromStartKm: 12.3, estimatedMinutesFromStart: 35,  fareFromStart: 35 },
  { code: 'DGP-CK', distanceFromStartKm: 17.2, estimatedMinutesFromStart: 48,  fareFromStart: 45 },
  { code: 'SNR-BS', distanceFromStartKm: 21.4, estimatedMinutesFromStart: 60,  fareFromStart: 55 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION BUILDER (Generic & Dynamic)
// ─────────────────────────────────────────────────────────────────────────────

export function getOperatorConfig(): OperatorConfig {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const companyName =
    getArg('--operator') ||
    getArg('--operator-name') ||
    process.env.DEMO_OPERATOR_NAME ||
    'Demo Travel';

  const businessCode =
    getArg('--code') ||
    getArg('--business-code') ||
    process.env.DEMO_BUSINESS_CODE ||
    'DEMOTRAVEL';

  const busReg =
    getArg('--bus') ||
    getArg('--bus-reg') ||
    process.env.DEMO_BUS_REG ||
    '11-AA-0000';

  const explicitOwnerPhone = getArg('--owner') || getArg('--owner-phone') || process.env.DEMO_OWNER_PHONE;
  const explicitDriverPhone = getArg('--driver') || getArg('--driver-phone') || process.env.DEMO_DRIVER_PHONE;
  const explicitConductorPhone = getArg('--conductor') || getArg('--conductor-phone') || process.env.DEMO_CONDUCTOR_PHONE;
  const explicitPassengerPhone = getArg('--passenger') || getArg('--passenger-phone') || process.env.DEMO_PASSENGER_PHONE;

  const isDemoTravel =
    businessCode === 'DEMOTRAVEL' ||
    businessCode === 'DEMO-TRAVEL' ||
    companyName.toLowerCase() === 'demo travel';

  // Default test phones are only suggested for Demo Travel testing, not hardcoded for all operators
  const preferredOwnerPhone = explicitOwnerPhone || (isDemoTravel ? '9861465410' : undefined);
  const preferredDriverPhone = explicitDriverPhone || (isDemoTravel ? '9876543202' : undefined);
  const preferredConductorPhone = explicitConductorPhone || (isDemoTravel ? '9876543203' : undefined);
  const preferredPassengerPhone = explicitPassengerPhone || (isDemoTravel ? '7381319957' : undefined);

  const corridor =
    getArg('--corridor') ||
    process.env.DEMO_CORRIDOR ||
    'Jaipur Tonk Road Corridor';

  return {
    companyName,
    businessCode,
    contactEmail: process.env.DEMO_CONTACT_EMAIL || 'demotravel@jaipur.in',
    contactPhone: preferredOwnerPhone || '9861465410',
    corridor,
    preferredOwnerPhone,
    isExplicitOwnerPhone: !!explicitOwnerPhone,
    preferredDriverPhone,
    isExplicitDriverPhone: !!explicitDriverPhone,
    preferredConductorPhone,
    isExplicitConductorPhone: !!explicitConductorPhone,
    preferredPassengerPhone,
    isExplicitPassengerPhone: !!explicitPassengerPhone,
    bus: {
      registrationNumber: busReg,
      model: 'Tata Starbus Ultra 40S',
      totalSeats: 40,
      seatingType: 'SEATER_2X2',
      amenities: ['GPS Tracking', 'First Aid Kit'],
    },
    stops: JAIPUR_STOPS,
    routes: [
      {
        routeCode: 'JR-001',
        originCode: 'SNR-BS',
        destinationCode: 'JPR-JN',
        stops: FWD_STOPS,
        scheduleDepTime: '06:00:00',
        scheduleArrTime: '07:00:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        baseFare: 55,
      },
      {
        routeCode: 'JR-001-R',
        originCode: 'JPR-JN',
        destinationCode: 'SNR-BS',
        stops: REV_STOPS,
        scheduleDepTime: '08:30:00',
        scheduleArrTime: '09:30:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        baseFare: 55,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING & ERROR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function log(msg: string)  { process.stdout.write(`  ${msg}\n`); }
function ok(msg: string)   { process.stdout.write(`  ✅ ${msg}\n`); }
function skip(msg: string) { process.stdout.write(`  ⏭️  ${msg}\n`); }
function warn(msg: string) { process.stdout.write(`  ⚠️  ${msg}\n`); }

class SetupError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'SetupError';
  }
}

function fail(msg: string): never {
  throw new SetupError(msg);
}

/**
 * Calculates the next valid testable service departure and scheduled arrival
 * based on schedule departure time (HH:mm:ss), schedule arrival time (HH:mm:ss),
 * and active days of the week.
 *
 * If today's scheduled departure time has already passed (or is less than 15 minutes away),
 * it dynamically advances to the next valid service date matching daysOfWeek (e.g. tomorrow).
 */
export function getNextValidServiceTime(
  scheduleDepTime: string,
  scheduleArrTime: string,
  daysOfWeek: number[] = [0, 1, 2, 3, 4, 5, 6],
  fromTime: Date = new Date()
): { departureTime: Date; scheduledArrival: Date } {
  const [depH, depM, depS] = scheduleDepTime.split(':').map(Number);
  const [arrH, arrM, arrS] = scheduleArrTime.split(':').map(Number);

  let dep = new Date(fromTime);
  dep.setHours(depH, depM, depS ?? 0, 0);

  // Must be at least 15 minutes in the future to allow realistic testing and booking
  const minFutureMs = fromTime.getTime() + 15 * 60 * 1000;
  if (dep.getTime() <= minFutureMs || !daysOfWeek.includes(dep.getDay())) {
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const candidate = new Date(fromTime);
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setHours(depH, depM, depS ?? 0, 0);
      if (daysOfWeek.includes(candidate.getDay())) {
        dep = candidate;
        break;
      }
    }
  }

  let arr = new Date(dep);
  arr.setHours(arrH, arrM, arrS ?? 0, 0);
  if (arr.getTime() <= dep.getTime()) {
    // Crosses midnight
    arr.setDate(arr.getDate() + 1);
  }

  return { departureTime: dep, scheduledArrival: arr };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SETUP LOGIC
// ─────────────────────────────────────────────────────────────────────────────

export async function setupOperator(config: OperatorConfig): Promise<void> {
  process.stdout.write(`\n🚌 Setting up operator: "${config.companyName}" (${config.businessCode})\n`);

  await withSystemContext(async (tx) => {

    // ── STEP 1: Find or Create Operator ──────────────────────────────────────
    process.stdout.write('\n📋 Step 1: Resolving Operator...\n');

    const cleanCode = config.businessCode.replace(/[-_\s]/g, '').toUpperCase();
    const formattedCode = config.businessCode.toUpperCase();

    const [existingOp] = await tx
      .select()
      .from(operators)
      .where(
        or(
          eq(operators.businessCode, formattedCode),
          eq(operators.businessCode, cleanCode),
          sql`lower(${operators.companyName}) = lower(${config.companyName})`
        )
      )
      .limit(1);

    let operatorId: string;
    let operatorCode: string;

    if (existingOp) {
      operatorId = existingOp.id;
      operatorCode = existingOp.businessCode;
      skip(`Found existing operator: "${existingOp.companyName}" (code: ${operatorCode}, id: ${operatorId})`);
    } else {
      const [newOp] = await tx
        .insert(operators)
        .values({
          companyName: config.companyName,
          businessCode: cleanCode,
          contactEmail: config.contactEmail,
          contactPhone: config.contactPhone,
          corridor: config.corridor,
          status: 'ACTIVE',
        })
        .returning();
      operatorId = newOp.id;
      operatorCode = newOp.businessCode;
      ok(`Created operator "${config.companyName}" (code: ${operatorCode}, id: ${operatorId})`);
    }

    // ── STEP 2: Dynamically Discover Existing DB Users ───────────────────────
    process.stdout.write('\n📋 Step 2: Dynamically discovering existing users from DB...\n');

    type ResolvedUser = {
      id: string;
      fullName: string;
      phone: string | null;
      role: string;
      isActive: boolean;
      source: 'OPERATOR_MEMBERSHIP' | 'PREFERRED_PHONE' | 'ROLE_DISCOVERY';
    };

    async function resolveStaffUser(
      role: 'OPERATOR_ADMIN' | 'DRIVER' | 'CONDUCTOR',
      preferredPhone?: string,
      isExplicitPhone: boolean = false
    ): Promise<ResolvedUser> {
      // 1. If configured/preferred phone is supplied, check it first
      if (preferredPhone) {
        const [u] = await tx
          .select({
            id: users.id,
            fullName: users.fullName,
            phone: users.phone,
            role: users.role,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.phone, preferredPhone))
          .limit(1);

        if (u) {
          if (!u.isActive) {
            fail(`Configured ${role} user with phone ${preferredPhone} (${u.fullName}) is inactive. Activate user before running setup.`);
          }

          // Verify operator membership compatibility: must NOT belong to a different operator
          const [otherMembership] = await tx
            .select({ tenantId: operatorMembers.tenantId, role: operatorMembers.role })
            .from(operatorMembers)
            .where(
              and(
                eq(operatorMembers.userId, u.id),
                ne(operatorMembers.tenantId, operatorId)
              )
            )
            .limit(1);

          if (otherMembership) {
            fail(
              `User "${u.fullName}" (${u.phone}) belongs to a DIFFERENT operator (tenant: ${otherMembership.tenantId}) with role ${otherMembership.role}.\n` +
              `  Cannot select or assign a user from another operator to "${config.companyName}".`
            );
          }

          log(`Found configured ${role} user: ${u.fullName} (${u.phone})`);
          return {
            id: u.id,
            fullName: u.fullName,
            phone: u.phone,
            role: u.role,
            isActive: u.isActive,
            source: 'PREFERRED_PHONE',
          };
        }

        // Explicitly passed phone wasn't found in DB
        if (isExplicitPhone) {
          fail(
            `Explicitly configured ${role} phone "${preferredPhone}" was not found in the database.\n` +
            `  Please register/create this user first, or check the phone number provided.`
          );
        }

        warn(`Default test phone "${preferredPhone}" for role ${role} not found in DB. Falling back to dynamic role discovery...`);
      }

      // 2. Dynamic discovery: check existing active members of THIS operator
      const existingMembers = await tx
        .select({
          memberId: operatorMembers.id,
          userId: operatorMembers.userId,
          tenantId: operatorMembers.tenantId,
          role: operatorMembers.role,
          isActive: operatorMembers.isActive,
          busId: operatorMembers.busId,
          fullName: users.fullName,
          phone: users.phone,
          userRole: users.role,
          userActive: users.isActive,
        })
        .from(operatorMembers)
        .innerJoin(users, eq(operatorMembers.userId, users.id))
        .where(
          and(
            eq(operatorMembers.tenantId, operatorId),
            eq(operatorMembers.role, role),
            eq(operatorMembers.isActive, true),
            eq(users.isActive, true)
          )
        );

      if (existingMembers.length === 1) {
        const m = existingMembers[0];
        log(`Discovered unambiguous existing ${role} member: ${m.fullName} (${m.phone})`);
        return {
          id: m.userId,
          fullName: m.fullName,
          phone: m.phone,
          role: m.userRole,
          isActive: m.userActive,
          source: 'OPERATOR_MEMBERSHIP',
        };
      }

      if (existingMembers.length > 1) {
        const memberList = existingMembers.map((m) => `${m.fullName} (${m.phone})`).join(', ');
        fail(
          `Ambiguous ${role} selection: Found ${existingMembers.length} active ${role} members for operator "${config.companyName}": [${memberList}].\n` +
          `  Cannot choose arbitrarily. Please specify which user to use via --${role.toLowerCase().replace('_', '-')}-phone.`
        );
      }

      // 3. Dynamic discovery: find active users in DB matching role with NO membership in ANY operator
      const allRoleUsers = await tx
        .select({
          id: users.id,
          fullName: users.fullName,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(
          and(
            eq(users.role, role),
            eq(users.isActive, true)
          )
        );

      const eligibleUnassignedCandidates: typeof allRoleUsers = [];

      for (const candidate of allRoleUsers) {
        // Must NOT belong to ANY operator
        const [anyMembership] = await tx
          .select({ tenantId: operatorMembers.tenantId })
          .from(operatorMembers)
          .where(eq(operatorMembers.userId, candidate.id))
          .limit(1);

        if (!anyMembership) {
          eligibleUnassignedCandidates.push(candidate);
        }
      }

      if (eligibleUnassignedCandidates.length === 1) {
        const c = eligibleUnassignedCandidates[0];
        log(`Discovered unambiguous compatible ${role} user: ${c.fullName} (${c.phone})`);
        return {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          role: c.role,
          isActive: c.isActive,
          source: 'ROLE_DISCOVERY',
        };
      }

      if (eligibleUnassignedCandidates.length > 1) {
        const candidateList = eligibleUnassignedCandidates.map((c) => `${c.fullName} (${c.phone})`).join(', ');
        fail(
          `Ambiguous ${role} selection: Found ${eligibleUnassignedCandidates.length} eligible unassigned users with role "${role}" in the database: [${candidateList}].\n` +
          `  Cannot choose arbitrarily. Please specify which user to use via --${role.toLowerCase().replace('_', '-')}-phone.`
        );
      }

      fail(
        `No available active user with role "${role}" found in the database compatible with operator "${config.companyName}".\n` +
        `  All existing "${role}" users either belong to other operators or are inactive.\n` +
        `  Please register a new user with role "${role}" or specify a valid phone.`
      );
    }

    async function resolvePassengerUser(
      preferredPhone?: string,
      isExplicitPhone: boolean = false
    ): Promise<ResolvedUser | null> {
      if (preferredPhone) {
        const [u] = await tx
          .select({
            id: users.id,
            fullName: users.fullName,
            phone: users.phone,
            role: users.role,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.phone, preferredPhone))
          .limit(1);

        if (u) {
          if (!u.isActive) {
            fail(`Configured Passenger user with phone ${preferredPhone} (${u.fullName}) is inactive.`);
          }
          log(`Found configured Passenger: ${u.fullName} (${u.phone})`);
          return {
            id: u.id,
            fullName: u.fullName,
            phone: u.phone,
            role: u.role,
            isActive: u.isActive,
            source: 'PREFERRED_PHONE',
          };
        }

        if (isExplicitPhone) {
          fail(`Explicitly configured Passenger phone "${preferredPhone}" was not found in the database.`);
        }

        warn(`Default passenger phone "${preferredPhone}" not found in DB. Searching for active passenger...`);
      }

      const activePassengers = await tx
        .select({
          id: users.id,
          fullName: users.fullName,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(
          and(
            eq(users.role, 'PASSENGER'),
            eq(users.isActive, true)
          )
        );

      if (activePassengers.length === 1) {
        const p = activePassengers[0];
        log(`Discovered unambiguous active Passenger: ${p.fullName} (${p.phone})`);
        return {
          id: p.id,
          fullName: p.fullName,
          phone: p.phone,
          role: p.role,
          isActive: p.isActive,
          source: 'ROLE_DISCOVERY',
        };
      }

      if (activePassengers.length > 1) {
        const pList = activePassengers.map((p) => `${p.fullName} (${p.phone})`).join(', ');
        fail(
          `Ambiguous PASSENGER selection: Found ${activePassengers.length} active passengers in the database: [${pList}].\n` +
          `  Cannot choose arbitrarily. Please specify which user to use via --passenger-phone.`
        );
      }

      warn('No active PASSENGER user found in DB. Passengers can register dynamically via the Passenger App.');
      return null;
    }

    const ownerUser = await resolveStaffUser('OPERATOR_ADMIN', config.preferredOwnerPhone, config.isExplicitOwnerPhone);
    const driverUser = await resolveStaffUser('DRIVER', config.preferredDriverPhone, config.isExplicitDriverPhone);
    const conductorUser = await resolveStaffUser('CONDUCTOR', config.preferredConductorPhone, config.isExplicitConductorPhone);
    const passengerUser = await resolvePassengerUser(config.preferredPassengerPhone, config.isExplicitPassengerPhone);

    // ── STEP 3: Upsert Bus ───────────────────────────────────────────────────
    process.stdout.write('\n📋 Step 3: Bus record...\n');

    const regNum = config.bus.registrationNumber.toUpperCase();

    const [existingBus] = await tx
      .select({ id: buses.id, status: buses.status })
      .from(buses)
      .where(and(eq(buses.tenantId, operatorId), eq(buses.registrationNumber, regNum)))
      .limit(1);

    let busId: string;

    if (existingBus) {
      busId = existingBus.id;
      skip(`Bus "${regNum}" already exists (id: ${busId}, status: ${existingBus.status})`);
      if (existingBus.status !== 'ACTIVE') {
        await tx
          .update(buses)
          .set({ status: 'ACTIVE', updatedAt: new Date() })
          .where(eq(buses.id, busId));
        ok(`Re-activated bus "${regNum}"`);
      }
    } else {
      const [newBus] = await tx
        .insert(buses)
        .values({
          tenantId: operatorId,
          registrationNumber: regNum,
          model: config.bus.model,
          totalSeats: config.bus.totalSeats,
          seatingType: config.bus.seatingType,
          status: 'ACTIVE',
          amenities: config.bus.amenities,
          createdBy: 'SETUP_SCRIPT',
        })
        .returning({ id: buses.id });
      busId = newBus.id;
      ok(`Created bus "${regNum}" (id: ${busId})`);
    }

    // ── STEP 4: Upsert Operator Memberships & Crew Assignments ───────────────
    process.stdout.write('\n📋 Step 4: Operator memberships and bus crew assignments...\n');

    async function ensureMember(
      user: ResolvedUser,
      role: 'OPERATOR_ADMIN' | 'DRIVER' | 'CONDUCTOR',
      assignedBusId?: string | null
    ): Promise<void> {
      const [existing] = await tx
        .select({ id: operatorMembers.id, tenantId: operatorMembers.tenantId, role: operatorMembers.role, busId: operatorMembers.busId })
        .from(operatorMembers)
        .where(
          and(
            eq(operatorMembers.userId, user.id),
            eq(operatorMembers.tenantId, operatorId)
          )
        )
        .limit(1);

      if (existing) {
        if (assignedBusId && existing.busId !== assignedBusId) {
          await tx
            .update(operatorMembers)
            .set({ busId: assignedBusId, updatedAt: new Date() })
            .where(eq(operatorMembers.id, existing.id));
          ok(`Assigned ${role} "${user.fullName}" to bus "${regNum}"`);
        } else {
          skip(`Membership already exists: ${user.fullName} (${user.phone}) -> ${role}`);
        }
        return;
      }

      await tx.insert(operatorMembers).values({
        userId: user.id,
        tenantId: operatorId,
        role,
        isActive: true,
        busId: assignedBusId || null,
        createdBy: 'SETUP_SCRIPT',
      });
      ok(`Added member: ${user.fullName} -> ${role}${assignedBusId ? ` (assigned to bus "${regNum}")` : ''}`);
    }

    await ensureMember(ownerUser, 'OPERATOR_ADMIN');
    await ensureMember(driverUser, 'DRIVER', busId);
    await ensureMember(conductorUser, 'CONDUCTOR', busId);

    // ── STEP 5: Upsert Route Stops ───────────────────────────────────────────
    process.stdout.write('\n📋 Step 5: Corridor stops...\n');

    const stopIdByCode = new Map<string, string>();

    for (const stopDef of config.stops) {
      const code = stopDef.code.toUpperCase();

      const [existing] = await tx
        .select({ id: stops.id })
        .from(stops)
        .where(and(eq(stops.tenantId, operatorId), eq(stops.code, code)))
        .limit(1);

      if (existing) {
        stopIdByCode.set(code, existing.id);
        skip(`Stop "${code}" (${stopDef.name}) already exists`);
      } else {
        const [newStop] = await tx
          .insert(stops)
          .values({
            tenantId: operatorId,
            name: stopDef.name,
            code,
            latitude: stopDef.latitude,
            longitude: stopDef.longitude,
            location: sql`ST_SetSRID(ST_MakePoint(${stopDef.longitude}, ${stopDef.latitude}), 4326)`,
            landmark: stopDef.landmark,
          })
          .returning({ id: stops.id });
        stopIdByCode.set(code, newStop.id);
        ok(`Created stop "${code}": ${stopDef.name}`);
      }
    }

    // ── STEP 6: Upsert Routes & Schedules ───────────────────────────────────
    process.stdout.write('\n📋 Step 6: Routes and schedules...\n');

    const routeIdByCode = new Map<string, string>();

    for (const routeDef of config.routes) {
      const routeCode = routeDef.routeCode.toUpperCase();

      const [existingRoute] = await tx
        .select({ id: routes.id, isActive: routes.isActive })
        .from(routes)
        .where(and(eq(routes.tenantId, operatorId), eq(routes.routeCode, routeCode)))
        .limit(1);

      let routeId: string;

      if (existingRoute) {
        routeId = existingRoute.id;
        routeIdByCode.set(routeCode, routeId);
        skip(`Route "${routeCode}" already exists (id: ${routeId})`);
        if (!existingRoute.isActive) {
          await tx
            .update(routes)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(routes.id, routeId));
          ok(`Re-activated route "${routeCode}"`);
        }
      } else {
        const populatedStops = routeDef.stops.map((s, idx) => {
          const code = s.code.toUpperCase();
          const stopId = stopIdByCode.get(code);
          if (!stopId) {
            fail(`Stop code "${code}" in route "${routeCode}" was not found.`);
          }
          const stopDef = config.stops.find((sd) => sd.code.toUpperCase() === code)!;
          return {
            stopId,
            stopName: stopDef.name,
            sequenceNumber: idx + 1,
            distanceFromStartKm: s.distanceFromStartKm,
            estimatedMinutesFromStart: s.estimatedMinutesFromStart,
            fareFromStart: s.fareFromStart,
            location: { latitude: stopDef.latitude, longitude: stopDef.longitude },
          };
        });

        const lastStop = populatedStops[populatedStops.length - 1];
        const originDef = config.stops.find((s) => s.code.toUpperCase() === routeDef.originCode.toUpperCase())!;
        const destDef = config.stops.find((s) => s.code.toUpperCase() === routeDef.destinationCode.toUpperCase())!;
        const polyline = populatedStops.map((s) => ({ latitude: s.location.latitude, longitude: s.location.longitude }));

        const [newRoute] = await tx
          .insert(routes)
          .values({
            tenantId: operatorId,
            routeCode,
            origin: originDef.name,
            destination: destDef.name,
            totalDistanceKm: lastStop.distanceFromStartKm,
            estimatedDurationMinutes: lastStop.estimatedMinutesFromStart,
            stopsData: populatedStops,
            polylineCoordinates: polyline,
            isActive: true,
          })
          .returning({ id: routes.id });

        routeId = newRoute.id;
        routeIdByCode.set(routeCode, routeId);
        ok(`Created route "${routeCode}": ${originDef.name} ➔ ${destDef.name} (${lastStop.distanceFromStartKm} km)`);
      }

      // Upsert schedule
      const [existingSchedule] = await tx
        .select({ id: schedules.id })
        .from(schedules)
        .where(
          and(
            eq(schedules.tenantId, operatorId),
            eq(schedules.routeId, routeId),
            eq(schedules.departureTime, routeDef.scheduleDepTime)
          )
        )
        .limit(1);

      if (existingSchedule) {
        skip(`Schedule for "${routeCode}" at ${routeDef.scheduleDepTime} already exists`);
      } else {
        await tx.insert(schedules).values({
          tenantId: operatorId,
          routeId,
          departureTime: routeDef.scheduleDepTime,
          arrivalTime: routeDef.scheduleArrTime,
          daysOfWeek: routeDef.daysOfWeek,
          baseFare: routeDef.baseFare,
          isActive: true,
        });
        ok(`Created schedule for "${routeCode}": departs ${routeDef.scheduleDepTime}`);
      }
    }

    // Deactivate ONLY legacy dummy/test routes belonging explicitly to Demo Travel.
    // Must NEVER deactivate routes belonging to another operator or legitimate production routes.
    const isDemoTravel =
      operatorCode === 'DEMOTRAVEL' ||
      operatorCode === 'DEMO-TRAVEL' ||
      config.businessCode === 'DEMOTRAVEL' ||
      config.businessCode === 'DEMO-TRAVEL' ||
      config.companyName.toLowerCase() === 'demo travel';

    if (isDemoTravel) {
      const validRouteCodes = config.routes.map((r) => r.routeCode.toUpperCase());
      const LEGACY_DEMO_ROUTE_CODES = ['DEMO ROUTE', 'DEMO-ROUTE', 'DUMMY-ROUTE', 'TEST-ROUTE'];
      await tx
        .update(routes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(routes.tenantId, operatorId),
            or(
              inArray(routes.routeCode, LEGACY_DEMO_ROUTE_CODES),
              sql`${routes.routeCode} ILIKE 'DEMO %'`,
              sql`${routes.routeCode} ILIKE 'DEMO-%'`,
              sql`${routes.routeCode} ILIKE 'TEST-%'`
            ),
            not(inArray(routes.routeCode, validRouteCodes)),
            eq(routes.isActive, true)
          )
        );
    }

    // ── STEP 7: Upsert Testable Trips for Next Service Date/Time ─────────────
    process.stdout.write('\n📋 Step 7: Testable trips for next valid service date/time...\n');

    // Trips departing within past 2 hours or in the future are considered valid testable services
    const minValidUpcoming = new Date(Date.now() - 2 * 3600 * 1000);

    for (const routeDef of config.routes) {
      const routeCode = routeDef.routeCode.toUpperCase();
      const routeId = routeIdByCode.get(routeCode)!;

      const { departureTime: nextDepTime, scheduledArrival: nextArrTime } = getNextValidServiceTime(
        routeDef.scheduleDepTime,
        routeDef.scheduleArrTime,
        routeDef.daysOfWeek
      );

      // Check external conflict: driver actively on another bus
      const [driverConflict] = await tx
        .select({ id: trips.id, busId: trips.busId })
        .from(trips)
        .where(
          and(
            eq(trips.driverId, driverUser.id),
            ne(trips.busId, busId),
            inArray(trips.status, ['BOARDING', 'IN_TRANSIT'])
          )
        )
        .limit(1);

      // Check external conflict: conductor actively on another bus
      const [conductorConflict] = await tx
        .select({ id: trips.id, busId: trips.busId })
        .from(trips)
        .where(
          and(
            eq(trips.conductorId, conductorUser.id),
            ne(trips.busId, busId),
            inArray(trips.status, ['BOARDING', 'IN_TRANSIT'])
          )
        )
        .limit(1);

      if (driverConflict) {
        warn(`Driver "${driverUser.fullName}" is actively driving another bus. Assigned without driver.`);
      }
      if (conductorConflict) {
        warn(`Conductor "${conductorUser.fullName}" is actively on another bus. Assigned without conductor.`);
      }

      // Check 1: Does an active, upcoming testable trip already exist for this bus & route?
      const [existingUpcomingTrip] = await tx
        .select({
          id: trips.id,
          status: trips.status,
          departureTime: trips.departureTime,
          driverId: trips.driverId,
          conductorId: trips.conductorId,
        })
        .from(trips)
        .where(
          and(
            eq(trips.tenantId, operatorId),
            eq(trips.busId, busId),
            eq(trips.routeId, routeId),
            or(
              inArray(trips.status, ['BOARDING', 'IN_TRANSIT']),
              and(
                inArray(trips.status, ['SCHEDULED', 'DELAYED']),
                gte(trips.departureTime, minValidUpcoming)
              )
            )
          )
        )
        .orderBy(desc(trips.departureTime))
        .limit(1);

      if (existingUpcomingTrip) {
        // Ensure crew is synchronized on existing upcoming SCHEDULED trip if necessary
        if (
          existingUpcomingTrip.status === 'SCHEDULED' &&
          ((!driverConflict && existingUpcomingTrip.driverId !== driverUser.id) ||
            (!conductorConflict && existingUpcomingTrip.conductorId !== conductorUser.id))
        ) {
          await tx
            .update(trips)
            .set({
              driverId: driverConflict ? null : driverUser.id,
              conductorId: conductorConflict ? null : conductorUser.id,
              updatedAt: new Date(),
            })
            .where(eq(trips.id, existingUpcomingTrip.id));
        }

        skip(
          `Active/upcoming trip for "${routeCode}" already exists ` +
          `(id: ${existingUpcomingTrip.id}, departs: ${existingUpcomingTrip.departureTime.toLocaleString()}, status: ${existingUpcomingTrip.status})`
        );
        continue;
      }

      // Check 2: Reuse an unstarted, expired SCHEDULED trip by updating its date to the next valid service time
      const [existingExpiredScheduledTrip] = await tx
        .select({ id: trips.id, departureTime: trips.departureTime })
        .from(trips)
        .where(
          and(
            eq(trips.tenantId, operatorId),
            eq(trips.busId, busId),
            eq(trips.routeId, routeId),
            eq(trips.status, 'SCHEDULED')
          )
        )
        .orderBy(desc(trips.departureTime))
        .limit(1);

      if (existingExpiredScheduledTrip) {
        await tx
          .update(trips)
          .set({
            driverId: driverConflict ? null : driverUser.id,
            conductorId: conductorConflict ? null : conductorUser.id,
            departureTime: nextDepTime,
            scheduledArrival: nextArrTime,
            updatedAt: new Date(),
          })
          .where(eq(trips.id, existingExpiredScheduledTrip.id));

        // Mark any older orphaned expired SCHEDULED trips for this bus/route as CANCELLED
        await tx
          .update(trips)
          .set({ status: 'CANCELLED', updatedAt: new Date() })
          .where(
            and(
              eq(trips.tenantId, operatorId),
              eq(trips.busId, busId),
              eq(trips.routeId, routeId),
              eq(trips.status, 'SCHEDULED'),
              ne(trips.id, existingExpiredScheduledTrip.id)
            )
          );

        ok(
          `Reused existing trip for "${routeCode}" -> updated to next valid service date: ` +
          `${nextDepTime.toLocaleString()} (id: ${existingExpiredScheduledTrip.id}) ` +
          `| driver: ${driverConflict ? 'unassigned' : driverUser.fullName} ` +
          `| conductor: ${conductorConflict ? 'unassigned' : conductorUser.fullName}`
        );
        continue;
      }

      // Check 3: No trip exists at all for this bus/route -> insert fresh trip at next service time
      const [newTrip] = await tx
        .insert(trips)
        .values({
          tenantId: operatorId,
          routeId,
          busId,
          driverId: driverConflict ? null : driverUser.id,
          conductorId: conductorConflict ? null : conductorUser.id,
          departureTime: nextDepTime,
          scheduledArrival: nextArrTime,
          status: 'SCHEDULED',
          availableSeats: config.bus.totalSeats,
          totalSeats: config.bus.totalSeats,
        })
        .returning({ id: trips.id });

      ok(
        `Created trip for "${routeCode}" at next valid service date: ${nextDepTime.toLocaleString()} (id: ${newTrip.id}) ` +
        `| driver: ${driverConflict ? 'unassigned' : driverUser.fullName} ` +
        `| conductor: ${conductorConflict ? 'unassigned' : conductorUser.fullName}`
      );
    }

    // ── SUMMARY REPORT ───────────────────────────────────────────────────────
    process.stdout.write('\n──────────────────────────────────────────────────────────────────\n');
    process.stdout.write(`🎉 Setup complete for "${config.companyName}" (${operatorCode})\n`);
    process.stdout.write(`   Tenant ID: ${operatorId}\n`);
    process.stdout.write('\n   Reused DB Users (No fake users created, passwords unchanged):\n');
    process.stdout.write(`     Owner/Admin : ${ownerUser.phone}  (${ownerUser.fullName}) [${ownerUser.source}]\n`);
    process.stdout.write(`     Driver      : ${driverUser.phone}  (${driverUser.fullName}) [${driverUser.source}]\n`);
    process.stdout.write(`     Conductor   : ${conductorUser.phone}  (${conductorUser.fullName}) [${conductorUser.source}]\n`);
    if (passengerUser) {
      process.stdout.write(`     Passenger   : ${passengerUser.phone}  (${passengerUser.fullName}) [${passengerUser.source}]\n`);
    } else {
      process.stdout.write('     Passenger   : Dynamically created by user in app\n');
    }

    process.stdout.write(`\n   Bus Assigned: ${config.bus.registrationNumber} (${config.bus.model})\n`);
    process.stdout.write('   Routes Active:\n');
    for (const r of config.routes) {
      const o = config.stops.find((s) => s.code.toUpperCase() === r.originCode.toUpperCase())!;
      const d = config.stops.find((s) => s.code.toUpperCase() === r.destinationCode.toUpperCase())!;
      process.stdout.write(`     ${r.routeCode.padEnd(12)} ${o.name} ➔ ${d.name} (${r.scheduleDepTime})\n`);
    }
    process.stdout.write('──────────────────────────────────────────────────────────────────\n\n');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const config = getOperatorConfig();
    await setupOperator(config);
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`\n❌ Setup failed: ${msg}\n`);
    if (err instanceof Error && !(err instanceof SetupError) && err.stack) {
      process.stderr.write(err.stack + '\n');
    }
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
