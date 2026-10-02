import 'dotenv/config';
import {
  withSystemContext,
  users,
  operators,
  operatorMembers,
  buses,
  stops,
  routes,
  schedules,
  trips,
  bookings,
  tickets,
  tripTrajectories,
  auditLogs,
  otpVerifications,
} from '../index.js';
import { eq, notInArray, inArray, or, sql } from 'drizzle-orm';

export interface CleanupOptions {
  targetPhone?: string;
}

export async function runDatabaseCleanup(options?: CleanupOptions) {
  const targetPhone = options?.targetPhone || process.argv[2] || '9876543999';

  console.log(`🚀 Starting database cleanup...`);
  console.log(`🎯 Target user phone to preserve: ${targetPhone}`);
  console.log(`👑 Super Admin (PLATFORM_ADMIN) will be preserved.`);

  await withSystemContext(async (tx) => {
    // 1. Find target user
    const [targetUser] = await tx
      .select()
      .from(users)
      .where(eq(users.phone, targetPhone))
      .limit(1);

    if (!targetUser) {
      console.warn(`⚠️ Warning: Target user with phone '${targetPhone}' was not found!`);
    } else {
      console.log(`✅ Found target user: ${targetUser.fullName} (${targetUser.phone}) [ID: ${targetUser.id}]`);
    }

    // 2. Find super admin user(s)
    const superAdmins = await tx
      .select()
      .from(users)
      .where(
        or(
          eq(users.role, 'PLATFORM_ADMIN'),
          sql`email = 'superadmin@ruralbus.gov.in'`
        )
      );

    console.log(`✅ Found ${superAdmins.length} Super Admin(s):`);
    superAdmins.forEach((sa) =>
      console.log(`   - ${sa.fullName} (${sa.phone || sa.email}) [Role: ${sa.role}, ID: ${sa.id}]`)
    );

    // List of user IDs to preserve
    const preservedUserIds: string[] = [];
    const preservedPhones: string[] = [];

    if (targetUser) {
      preservedUserIds.push(targetUser.id);
      if (targetUser.phone) preservedPhones.push(targetUser.phone);
    }
    for (const sa of superAdmins) {
      if (!preservedUserIds.includes(sa.id)) {
        preservedUserIds.push(sa.id);
      }
      if (sa.phone && !preservedPhones.includes(sa.phone)) {
        preservedPhones.push(sa.phone);
      }
    }

    console.log(`\n🔒 Total preserved users: ${preservedUserIds.length}`);

    // 3. Find operators associated with target user
    let preservedOperatorIds: string[] = [];
    if (targetUser) {
      const memberships = await tx
        .select()
        .from(operatorMembers)
        .where(eq(operatorMembers.userId, targetUser.id));

      const ownedOperators = await tx
        .select()
        .from(operators)
        .where(eq(operators.contactPhone, targetUser.phone!));

      const opIdSet = new Set<string>([
        ...memberships.map((m) => m.tenantId),
        ...ownedOperators.map((o) => o.id),
      ]);
      preservedOperatorIds = Array.from(opIdSet);
    }

    console.log(`🔒 Preserved Operator IDs (${preservedOperatorIds.length}):`, preservedOperatorIds);

    // 4. Find buses belonging to the preserved operator(s) / user
    let preservedBusIds: string[] = [];
    if (preservedOperatorIds.length > 0) {
      const preservedBuses = await tx
        .select()
        .from(buses)
        .where(inArray(buses.tenantId, preservedOperatorIds));
      preservedBusIds = preservedBuses.map((b) => b.id);
    }

    console.log(`🔒 Preserved Bus IDs (${preservedBusIds.length}):`, preservedBusIds);

    // 5. Perform deletions in foreign-key safe order
    console.log('\n🧹 Performing cleanups...');

    // A. Delete trip trajectories
    const deletedTrajectories = await tx.delete(tripTrajectories).returning({ id: tripTrajectories.id });
    console.log(`  🗑️ Deleted trip trajectories: ${deletedTrajectories.length}`);

    // B. Delete tickets
    const deletedTickets = await tx.delete(tickets).returning({ id: tickets.id });
    console.log(`  🗑️ Deleted tickets: ${deletedTickets.length}`);

    // C. Delete bookings
    const deletedBookings = await tx.delete(bookings).returning({ id: bookings.id });
    console.log(`  🗑️ Deleted bookings: ${deletedBookings.length}`);

    // D. Delete trips
    const deletedTrips = await tx.delete(trips).returning({ id: trips.id });
    console.log(`  🗑️ Deleted trips: ${deletedTrips.length}`);

    // E. Delete schedules
    const deletedSchedules = await tx.delete(schedules).returning({ id: schedules.id });
    console.log(`  🗑️ Deleted schedules: ${deletedSchedules.length}`);

    // F. Delete routes (routes reference operators and have stop data)
    let deletedRoutes = [];
    if (preservedOperatorIds.length > 0) {
      deletedRoutes = await tx
        .delete(routes)
        .where(notInArray(routes.tenantId, preservedOperatorIds))
        .returning({ id: routes.id });
    } else {
      deletedRoutes = await tx.delete(routes).returning({ id: routes.id });
    }
    console.log(`  🗑️ Deleted routes: ${deletedRoutes.length}`);

    // G. Delete ALL stops (as requested: "and stops also delete")
    const deletedStops = await tx.delete(stops).returning({ id: stops.id });
    console.log(`  🗑️ Deleted stops: ${deletedStops.length}`);

    // H. Delete non-preserved buses
    let deletedBuses = [];
    if (preservedBusIds.length > 0) {
      deletedBuses = await tx
        .delete(buses)
        .where(notInArray(buses.id, preservedBusIds))
        .returning({ id: buses.id, reg: buses.registrationNumber });
    } else {
      deletedBuses = await tx.delete(buses).returning({ id: buses.id, reg: buses.registrationNumber });
    }
    console.log(`  🗑️ Deleted buses: ${deletedBuses.length}`);

    // I. Delete non-preserved operator members
    let deletedMembers = [];
    if (preservedUserIds.length > 0) {
      deletedMembers = await tx
        .delete(operatorMembers)
        .where(notInArray(operatorMembers.userId, preservedUserIds))
        .returning({ id: operatorMembers.id });
    } else {
      deletedMembers = await tx.delete(operatorMembers).returning({ id: operatorMembers.id });
    }
    console.log(`  🗑️ Deleted operator members: ${deletedMembers.length}`);

    // J. Delete non-preserved operators
    let deletedOperators = [];
    if (preservedOperatorIds.length > 0) {
      deletedOperators = await tx
        .delete(operators)
        .where(notInArray(operators.id, preservedOperatorIds))
        .returning({ id: operators.id, name: operators.companyName });
    } else {
      deletedOperators = await tx.delete(operators).returning({ id: operators.id, name: operators.companyName });
    }
    console.log(`  🗑️ Deleted operators: ${deletedOperators.length}`);

    // K. Delete non-preserved users
    let deletedUsers = [];
    if (preservedUserIds.length > 0) {
      deletedUsers = await tx
        .delete(users)
        .where(notInArray(users.id, preservedUserIds))
        .returning({ id: users.id, phone: users.phone, fullName: users.fullName });
    }
    console.log(`  🗑️ Deleted users: ${deletedUsers.length}`);

    // L. Clean up OTP verifications for non-preserved phones
    let deletedOtps = [];
    if (preservedPhones.length > 0) {
      deletedOtps = await tx
        .delete(otpVerifications)
        .where(notInArray(otpVerifications.phone, preservedPhones))
        .returning({ id: otpVerifications.id });
    } else {
      deletedOtps = await tx.delete(otpVerifications).returning({ id: otpVerifications.id });
    }
    console.log(`  🗑️ Deleted OTP verifications: ${deletedOtps.length}`);

    // M. Clean up stale audit logs
    const deletedLogs = await tx.delete(auditLogs).returning({ id: auditLogs.id });
    console.log(`  🗑️ Deleted audit logs: ${deletedLogs.length}`);

    // Verification Summary
    console.log('\n================ POST-CLEANUP VERIFICATION ================');
    const remainingUsers = await tx
      .select({ id: users.id, phone: users.phone, email: users.email, role: users.role, name: users.fullName })
      .from(users);
    console.log(`👥 Remaining Users (${remainingUsers.length}):`);
    console.table(remainingUsers);

    const remainingBuses = await tx
      .select({ id: buses.id, tenantId: buses.tenantId, reg: buses.registrationNumber, model: buses.model })
      .from(buses);
    console.log(`🚌 Remaining Buses (${remainingBuses.length}):`);
    console.table(remainingBuses);

    const remainingStops = await tx.select().from(stops);
    console.log(`🚏 Remaining Stops: ${remainingStops.length}`);

    const remainingOps = await tx
      .select({ id: operators.id, name: operators.companyName, phone: operators.contactPhone })
      .from(operators);
    console.log(`🏢 Remaining Operators (${remainingOps.length}):`);
    console.table(remainingOps);

    const remainingMembers = await tx.select().from(operatorMembers);
    console.log(`👔 Remaining Operator Members (${remainingMembers.length}):`);
    console.table(remainingMembers);
    console.log('===========================================================\n');
  });

  console.log('🎉 Cleanup completed successfully!');
}

// If invoked directly from CLI
if (process.argv[1]?.includes('clean-database')) {
  runDatabaseCleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error executing database cleanup:', err);
      process.exit(1);
    });
}
