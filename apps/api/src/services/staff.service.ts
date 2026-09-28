import { eq, and, inArray, ilike, or } from 'drizzle-orm';
import { db, sql, withSystemContext, withTenant, users, operators, operatorMembers, bookings, buses, trips, tickets } from '@ruralbus/database';
import { hashPassword } from './password.service.js';
import { getDevelopmentPassword } from './otp.service.js';
import { sendAccountProvisioningSms, type AccountProvisioningSmsResult } from './sms.service.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from '../errors/AppError.js';
import type {
  StaffMember,
  StaffListResponse,
  CreateStaffInput,
  UpdateStaffMemberInput,
  OperatorProfile,
  UpdateOperatorProfileInput,
  CreateOperatorInput,
  OperatorProvisionResult,
  OperatorDetails,
  UpdateOperatorAdminInput,
} from '@ruralbus/shared-types';
import type { StaffQuerySchema } from '@ruralbus/shared-validators';


export async function getOperatorProfile(tenantId: string): Promise<OperatorProfile> {
  const [operator] = await db
    .select()
    .from(operators)
    .where(eq(operators.id, tenantId))
    .limit(1);

  if (!operator) {
    throw new NotFoundError('Operator profile not found');
  }

  return {
    id: operator.id,
    companyName: operator.companyName,
    businessCode: operator.businessCode,
    contactEmail: operator.contactEmail,
    contactPhone: operator.contactPhone,
    status: operator.status,
    createdAt: operator.createdAt.toISOString(),
    updatedAt: operator.updatedAt.toISOString(),
  };
}

export async function updateOperatorProfile(
  tenantId: string,
  input: UpdateOperatorProfileInput
): Promise<OperatorProfile> {
  const updateData: Partial<typeof operators.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.companyName) updateData.companyName = input.companyName;
  if (input.contactEmail) updateData.contactEmail = input.contactEmail;
  if (input.contactPhone) updateData.contactPhone = input.contactPhone;

  const [updated] = await db
    .update(operators)
    .set(updateData)
    .where(eq(operators.id, tenantId))
    .returning();

  if (!updated) {
    throw new NotFoundError('Operator profile not found');
  }

  return {
    id: updated.id,
    companyName: updated.companyName,
    businessCode: updated.businessCode,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function listStaffMembers(
  tenantId?: string,
  query?: StaffQuerySchema
): Promise<StaffListResponse> {
  return withSystemContext(async (tx) => {
    // 1. Base join query
    const conditions: any[] = [
      inArray(operatorMembers.role, ['DRIVER', 'CONDUCTOR']),
    ];

    if (tenantId) {
      conditions.push(eq(operatorMembers.tenantId, tenantId));
    }

    if (query?.role) {
      conditions.push(eq(operatorMembers.role, query.role));
    }

    if (query?.search) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(users.fullName, searchPattern),
          ilike(users.phone, searchPattern)
        )!
      );
    }

    const rows = await tx
      .select({
        memberId: operatorMembers.id,
        userId: users.id,
        fullName: users.fullName,
        phone: users.phone,
        email: users.email,
        role: operatorMembers.role,
        isActive: operatorMembers.isActive,
        tenantId: operatorMembers.tenantId,
        busId: operatorMembers.busId,
        busRegistrationNumber: buses.registrationNumber,
        createdBy: operatorMembers.createdBy,
        createdAt: operatorMembers.createdAt,
        updatedAt: operatorMembers.updatedAt,
      })
      .from(operatorMembers)
      .innerJoin(users, eq(operatorMembers.userId, users.id))
      .leftJoin(buses, eq(operatorMembers.busId, buses.id))
      .where(and(...conditions))
      .orderBy(operatorMembers.createdAt);

    const staff: StaffMember[] = rows.map((r) => ({
      id: r.memberId,
      userId: r.userId,
      fullName: r.fullName,
      phone: r.phone || '',
      email: r.email,
      role: r.role as 'DRIVER' | 'CONDUCTOR',
      isActive: r.isActive,
      tenantId: r.tenantId,
      busId: r.busId ?? undefined,
      busRegistrationNumber: r.busRegistrationNumber ?? undefined,
      createdBy: r.createdBy || 'OWNER',
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const activeDrivers = staff.filter((s) => s.role === 'DRIVER' && s.isActive).length;
    const activeConductors = staff.filter((s) => s.role === 'CONDUCTOR' && s.isActive).length;

    return {
      staff,
      total: staff.length,
      activeDrivers,
      activeConductors,
    };
  });
}

export async function provisionStaffMember(
  tenantId: string,
  input: CreateStaffInput
): Promise<StaffMember> {
  if (input.role !== 'DRIVER' && input.role !== 'CONDUCTOR') {
    throw new BadRequestError("Only 'DRIVER' or 'CONDUCTOR' roles can be provisioned");
  }

  return withSystemContext(async (tx) => {
    // 1. Verify phone and email uniqueness in users
    const [existingPhone] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, input.phone))
      .limit(1);

    if (existingPhone) {
      throw new ConflictError('A user with this mobile number is already registered');
    }

    if (input.email) {
      const [existingEmail] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingEmail) {
        throw new ConflictError('A user with this email address is already registered');
      }
    }

    // 2. Hash password with Argon2id (default Admin@123 for any uncreated password)
    const rawPassword = input.password && input.password.trim().length >= 8 ? input.password.trim() : 'Admin@123';
    const passwordHash = await hashPassword(rawPassword);
    const developmentPassword = getDevelopmentPassword(rawPassword);

    // 3. Insert into users
    const [newUser] = await tx
      .insert(users)
      .values({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email || null,
        passwordHash,
        developmentPassword,
        role: input.role,
        isActive: true,
        mustChangePassword: true,
        phoneVerified: false,
      })
      .returning();

    // 3.5 Validate bus assignment if supplied
    let resolvedBusId: string | null = null;
    const busIdentifier = (input as any).busId || input.bus;
    if (busIdentifier) {
      const [assignedBus] = await tx
        .select({ id: buses.id, tenantId: buses.tenantId })
        .from(buses)
        .where(
          or(
            eq(buses.id, busIdentifier),
            eq(buses.registrationNumber, busIdentifier)
          )!
        )
        .limit(1);

      if (!assignedBus) {
        throw new NotFoundError(`Bus '${busIdentifier}' not found`);
      }
      if (assignedBus.tenantId !== tenantId) {
        throw new ForbiddenError('Cannot assign a bus belonging to another transport operator');
      }
      resolvedBusId = assignedBus.id;
    }

    // 4. Insert into operator_members
    const [newMember] = await tx
      .insert(operatorMembers)
      .values({
        userId: newUser.id,
        tenantId,
        role: input.role,
        isActive: true,
        busId: resolvedBusId,
        createdBy: input.createdBy || 'OWNER',
      })
      .returning();

    // 5. Always send SMS credentials to the new staff member
    const staffResult: StaffMember = {
      id: newMember.id,
      userId: newUser.id,
      fullName: newUser.fullName,
      phone: newUser.phone || '',
      email: newUser.email,
      role: newMember.role as 'DRIVER' | 'CONDUCTOR',
      isActive: newMember.isActive,
      tenantId: newMember.tenantId,
      busId: (newMember as any).busId ?? undefined,
      createdBy: newMember.createdBy || input.createdBy || 'OWNER',
      createdAt: newMember.createdAt.toISOString(),
      updatedAt: newMember.updatedAt.toISOString(),
    };

    // Fire SMS outside the transaction scope (don't fail provision on SMS error)
    setImmediate(async () => {
      try {
        await sendAccountProvisioningSms({
          phone: input.phone,
          fullName: input.fullName,
          role: input.role as 'DRIVER' | 'CONDUCTOR',
          temporaryPassword: input.password,
          operatorName: tenantId, // Will be resolved in SMS service
        });
        console.log(`[Staff] SMS credentials sent to ${input.phone} (${input.role})`);
      } catch (smsErr: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[Staff] SMS delivery failed for ${input.phone}: ${smsErr.message}`);
        } else {
          console.error(`[Staff] SMS delivery failed for staff ${input.phone}:`, smsErr.message);
        }
      }
    });

    return staffResult;
  });
}

/**
 * Update an operator's status (ACTIVE / SUSPENDED) only.
 * Never changes passwords, roles, or JWT secrets.
 */
export async function updateOperatorStatus(
  tenantId: string,
  status: 'ACTIVE' | 'SUSPENDED'
): Promise<{ operator: { id: string; companyName: string; status: string } }> {
  return withSystemContext(async (tx) => {
    const [op] = await tx
      .select()
      .from(operators)
      .where(eq(operators.id, tenantId))
      .limit(1);

    if (!op) {
      throw new NotFoundError(`Transport Operator '${tenantId}' not found`);
    }

    const [updated] = await tx
      .update(operators)
      .set({ status, updatedAt: new Date() })
      .where(eq(operators.id, tenantId))
      .returning();

    return {
      operator: {
        id: updated.id,
        companyName: updated.companyName,
        status: updated.status,
      },
    };
  });
}

/**
 * Permanently delete a transport operator and all their data.
 * Guards against deletion when historical trips/tickets/bookings exist.
 */
export async function deleteOperator(
  tenantId: string
): Promise<{ success: boolean; message: string }> {
  return withSystemContext(async (tx) => {
    const [operator] = await tx
      .select()
      .from(operators)
      .where(eq(operators.id, tenantId))
      .limit(1);

    if (!operator) {
      throw new NotFoundError(`Transport Operator '${tenantId}' not found`);
    }

    // Check for historical operational dependencies
    const [tripCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(trips)
      .where(eq(trips.tenantId, tenantId));

    const [ticketCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.tenantId, tenantId));

    const [bookingCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId));

    const totalHistoricalRecords =
      (Number(tripCount?.count) || 0) +
      (Number(ticketCount?.count) || 0) +
      (Number(bookingCount?.count) || 0);

    if (totalHistoricalRecords > 0) {
      throw new ConflictError(
        `Cannot permanently delete operator '${operator.companyName}' because historical operational records exist (${Number(tripCount?.count) || 0} trips, ${Number(ticketCount?.count) || 0} tickets, ${Number(bookingCount?.count) || 0} bookings). Please deactivate/suspend the operator instead.`
      );
    }

    // Safe deletion: collect member user IDs first
    const members = await tx
      .select({ userId: operatorMembers.userId })
      .from(operatorMembers)
      .where(eq(operatorMembers.tenantId, tenantId));

    const userIds = members.map((m) => m.userId);

    // Delete operator (cascades to buses, routes, and operatorMembers via FK)
    await tx.delete(operators).where(eq(operators.id, tenantId));

    // Clean up only truly orphaned users that have no other memberships and are not PLATFORM_ADMIN
    for (const uid of userIds) {
      const remainingMemberships = await tx
        .select({ id: operatorMembers.id })
        .from(operatorMembers)
        .where(eq(operatorMembers.userId, uid))
        .limit(1);

      if (remainingMemberships.length === 0) {
        await tx
          .delete(users)
          .where(and(eq(users.id, uid), sql`${users.role} != 'PLATFORM_ADMIN'`));
      }
    }

    return {
      success: true,
      message: `Transport Operator '${operator.companyName}' has been permanently deleted.`,
    };
  });
}
export async function updateStaffStatus(
  tenantId: string,
  staffId: string,
  isActive: boolean
): Promise<StaffMember> {
  return withSystemContext(async (tx) => {
    // 1. Find member by id & tenantId
    const [member] = await tx
      .select({
        memberId: operatorMembers.id,
        userId: operatorMembers.userId,
        tenantId: operatorMembers.tenantId,
        role: operatorMembers.role,
      })
      .from(operatorMembers)
      .where(and(eq(operatorMembers.id, staffId), eq(operatorMembers.tenantId, tenantId)))
      .limit(1);

    if (!member) {
      const [otherMember] = await tx
        .select({ id: operatorMembers.id })
        .from(operatorMembers)
        .where(eq(operatorMembers.id, staffId))
        .limit(1);

      if (otherMember) {
        throw new ForbiddenError('Cannot modify staff belonging to another operator');
      }
      throw new NotFoundError('Staff member not found in this operator organization');
    }

    // 2. Update status in operator_members
    const [updatedMember] = await tx
      .update(operatorMembers)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(operatorMembers.id, member.memberId))
      .returning();

    // 3. Sync user isActive
    await tx
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, member.userId));

    // 4. Fetch updated user details
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, member.userId))
      .limit(1);

    return {
      id: updatedMember.id,
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone || '',
      email: user.email,
      role: updatedMember.role as 'DRIVER' | 'CONDUCTOR',
      isActive: updatedMember.isActive,
      tenantId: updatedMember.tenantId,
      createdAt: updatedMember.createdAt.toISOString(),
      updatedAt: updatedMember.updatedAt.toISOString(),
    };
  });
}

export async function resetStaffPassword(
  tenantId: string,
  staffId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return withSystemContext(async (tx) => {
    // 1. Find member by id & tenantId
    const [member] = await tx
      .select({
        memberId: operatorMembers.id,
        userId: operatorMembers.userId,
      })
      .from(operatorMembers)
      .where(and(eq(operatorMembers.id, staffId), eq(operatorMembers.tenantId, tenantId)))
      .limit(1);

    if (!member) {
      const [otherMember] = await tx
        .select({ id: operatorMembers.id })
        .from(operatorMembers)
        .where(eq(operatorMembers.id, staffId))
        .limit(1);

      if (otherMember) {
        throw new ForbiddenError('Cannot modify staff belonging to another operator');
      }
      throw new NotFoundError('Staff member not found in this operator organization');
    }

    // 2. Hash new password with Argon2id
    const passwordHash = await hashPassword(newPassword);
    const developmentPassword = getDevelopmentPassword(newPassword);

    // 3. Update user password and flag mustChangePassword
    await tx
      .update(users)
      .set({
        passwordHash,
        developmentPassword,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, member.userId));

    return {
      success: true,
      message: 'Staff password has been reset successfully',
    };
  });
}

/**
 * Update staff member details and/or bus assignment.
 * PLATFORM_ADMIN may update any staff; OPERATOR_ADMIN only their own tenant.
 * Never allows changing role, tenantId, password, or userId.
 */
export async function updateStaffMember(
  callerTenantId: string | null,
  staffId: string,
  input: UpdateStaffMemberInput,
  isSuperAdmin: boolean
): Promise<StaffMember> {
  return withSystemContext(async (tx) => {
    const [member] = await tx
      .select({
        memberId: operatorMembers.id,
        userId: operatorMembers.userId,
        tenantId: operatorMembers.tenantId,
        role: operatorMembers.role,
        isActive: operatorMembers.isActive,
        busId: operatorMembers.busId,
      })
      .from(operatorMembers)
      .where(eq(operatorMembers.id, staffId))
      .limit(1);

    if (!member) throw new NotFoundError('Staff member not found');

    if (!isSuperAdmin && callerTenantId !== member.tenantId) {
      throw new ForbiddenError('Cannot modify staff belonging to another operator');
    }

    let resolvedBusId: string | null = (member as any).busId ?? null;
    if ('busId' in input) {
      if (input.busId === null) {
        resolvedBusId = null;
      } else if (input.busId) {
        const [targetBus] = await tx
          .select({ id: buses.id, tenantId: buses.tenantId })
          .from(buses)
          .where(eq(buses.id, input.busId))
          .limit(1);

        if (!targetBus) throw new NotFoundError(`Bus '${input.busId}' not found`);
        if (targetBus.tenantId !== member.tenantId) {
          throw new ForbiddenError('Cannot assign a bus belonging to another transport operator');
        }
        resolvedBusId = targetBus.id;
      }
    }

    const [updatedMember] = await tx
      .update(operatorMembers)
      .set({ busId: resolvedBusId, updatedAt: new Date() } as any)
      .where(eq(operatorMembers.id, staffId))
      .returning();

    if (input.fullName) {
      await tx
        .update(users)
        .set({ fullName: input.fullName.trim(), updatedAt: new Date() })
        .where(eq(users.id, member.userId));
    }

    const [updatedUser] = await tx.select().from(users).where(eq(users.id, member.userId)).limit(1);

    let busRegistrationNumber: string | undefined;
    if (resolvedBusId) {
      const [b] = await tx
        .select({ registrationNumber: buses.registrationNumber })
        .from(buses)
        .where(eq(buses.id, resolvedBusId))
        .limit(1);
      busRegistrationNumber = b?.registrationNumber;
    }

    return {
      id: updatedMember.id,
      userId: updatedUser.id,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone || '',
      email: updatedUser.email,
      role: updatedMember.role as 'DRIVER' | 'CONDUCTOR',
      isActive: updatedMember.isActive,
      tenantId: updatedMember.tenantId,
      busId: resolvedBusId ?? undefined,
      busRegistrationNumber,
      createdBy: (updatedMember as any).createdBy || 'OWNER',
      createdAt: updatedMember.createdAt.toISOString(),
      updatedAt: updatedMember.updatedAt.toISOString(),
    };
  });
}

/**
 * Delete a staff membership (operator_members row).
 * Preserves historical records; only deletes underlying user when truly orphaned and safe.
 */
export async function deleteStaffMember(
  callerTenantId: string | null,
  staffId: string,
  isSuperAdmin: boolean
): Promise<{ success: boolean; message: string }> {
  return withSystemContext(async (tx) => {
    const [member] = await tx
      .select({
        memberId: operatorMembers.id,
        userId: operatorMembers.userId,
        tenantId: operatorMembers.tenantId,
        role: operatorMembers.role,
      })
      .from(operatorMembers)
      .where(eq(operatorMembers.id, staffId))
      .limit(1);

    if (!member) throw new NotFoundError('Staff member not found');

    if (!isSuperAdmin && callerTenantId !== member.tenantId) {
      throw new ForbiddenError('Cannot delete staff belonging to another operator');
    }

    if (member.role === 'OPERATOR_ADMIN') {
      throw new ForbiddenError('Cannot delete the operator owner through the staff endpoint');
    }

    await tx.delete(operatorMembers).where(eq(operatorMembers.id, staffId));

    const remaining = await tx
      .select({ id: operatorMembers.id })
      .from(operatorMembers)
      .where(eq(operatorMembers.userId, member.userId))
      .limit(1);

    if (remaining.length === 0) {
      const [tripRef] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(trips)
        .where(
          or(
            eq(trips.driverId, member.userId),
            eq(trips.conductorId, member.userId)
          )!
        );

      const hasTripHistory = (Number(tripRef?.count) || 0) > 0;
      if (!hasTripHistory) {
        await tx.delete(users).where(
          and(eq(users.id, member.userId), sql`${users.role} != 'PLATFORM_ADMIN'`)
        );
      }
    }

    return { success: true, message: 'Staff member removed successfully' };
  });
}

/**
 * Update a transport operator's company details (Super Admin only).
 * Never changes passwords, roles, or JWT secrets.
 */
export async function updateOperatorDetails(
  tenantId: string,
  input: UpdateOperatorAdminInput
): Promise<OperatorDetails> {
  return withSystemContext(async (tx) => {
    const [op] = await tx
      .select()
      .from(operators)
      .where(eq(operators.id, tenantId))
      .limit(1);

    if (!op) throw new NotFoundError(`Transport Operator '${tenantId}' not found`);

    const opUpdates: Partial<typeof operators.$inferInsert> = { updatedAt: new Date() };
    if (input.companyName) opUpdates.companyName = input.companyName.trim();
    if (input.contactPhone) opUpdates.contactPhone = input.contactPhone.trim();
    if (input.contactEmail) opUpdates.contactEmail = input.contactEmail.trim().toLowerCase();
    if (input.corridor) (opUpdates as any).corridor = input.corridor.trim();
    if (input.status) opUpdates.status = input.status;

    const [updatedOp] = await tx
      .update(operators)
      .set(opUpdates)
      .where(eq(operators.id, tenantId))
      .returning();

    if (input.ownerName) {
      const [adminMember] = await tx
        .select({ userId: operatorMembers.userId })
        .from(operatorMembers)
        .where(and(eq(operatorMembers.tenantId, tenantId), eq(operatorMembers.role, 'OPERATOR_ADMIN')))
        .limit(1);

      if (adminMember) {
        await tx
          .update(users)
          .set({ fullName: input.ownerName.trim(), updatedAt: new Date() })
          .where(eq(users.id, adminMember.userId));
      }
    }

    const [adminMemberInfo] = await tx
      .select({ fullName: users.fullName, phone: users.phone, email: users.email })
      .from(operatorMembers)
      .innerJoin(users, eq(operatorMembers.userId, users.id))
      .where(and(eq(operatorMembers.tenantId, tenantId), eq(operatorMembers.role, 'OPERATOR_ADMIN')))
      .limit(1);

    const [busCountRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(buses)
      .where(eq(buses.tenantId, tenantId));

    const [staffCountRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(operatorMembers)
      .where(eq(operatorMembers.tenantId, tenantId));

    return {
      id: updatedOp.id,
      companyName: updatedOp.companyName,
      businessCode: updatedOp.businessCode,
      contactEmail: updatedOp.contactEmail,
      contactPhone: updatedOp.contactPhone,
      corridor: (updatedOp as any).corridor || 'State Rural Corridor',
      status: updatedOp.status,
      createdAt: updatedOp.createdAt.toISOString(),
      updatedAt: updatedOp.updatedAt.toISOString(),
      ownerName: adminMemberInfo?.fullName,
      ownerPhone: adminMemberInfo?.phone ?? undefined,
      ownerEmail: adminMemberInfo?.email ?? undefined,
      busesCount: Number(busCountRow?.count) || 0,
      staffCount: Number(staffCountRow?.count) || 0,
    };
  });
}

export async function getOperatorRevenueSummary(tenantId: string) {
  return withSystemContext(async (tx) => {
    // 1. Fetch all bookings for this tenant
    const tenantBookings = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId));

    let onlineRevenue = 0;
    let onlineTicketCount = 0;
    let cashRevenue = 0;
    let cashTicketCount = 0;

    for (const b of tenantBookings) {
      if (b.status === 'CONFIRMED' || b.status === 'BOARDED') {
        const isCash = b.paymentId === 'CASH' || (b.paymentId && b.paymentId.startsWith('TKT-'));
        if (isCash) {
          cashRevenue += b.fareAmount;
          cashTicketCount += 1;
        } else {
          onlineRevenue += b.fareAmount;
          onlineTicketCount += 1;
        }
      }
    }

    // 2. Fetch fleet vehicles count
    const tenantBuses = await tx
      .select()
      .from(buses)
      .where(eq(buses.tenantId, tenantId));

    const totalBuses = tenantBuses.length;
    const activeBuses = tenantBuses.filter((b) => b.status === 'ACTIVE').length;

    // 3. Fetch staff members count
    const members = await tx
      .select()
      .from(operatorMembers)
      .where(eq(operatorMembers.tenantId, tenantId));

    return {
      onlineRevenue,
      onlineTicketCount,
      cashRevenue,
      cashTicketCount,
      totalRevenue: onlineRevenue + cashRevenue,
      totalPassengers: onlineTicketCount + cashTicketCount,
      totalBuses,
      activeBuses,
      totalStaff: members.length,
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Creates a new Transport Company (Operator) and Owner account (OPERATOR_ADMIN)
 * in a single atomic database transaction, strictly restricted to PLATFORM_ADMIN.
 *
 * Security & Provisioning Guarantees:
 * 1. Hashes initial password with Argon2id.
 * 2. STRICT ZERO-PLAINTEXT: development_password is set to NULL.
 * 3. must_change_password is set to true.
 * 4. Plaintext password is NEVER returned in the API response or persisted.
 * 5. Dispatches provisioning SMS with honest status reporting (no fake SMS sent).
 * 6. Tenant isolation: Starts with 0 buses, 0 routes, 0 stops, 0 trips, 0 schedules.
 */
export async function createOperatorAndOwner(
  input: CreateOperatorInput
): Promise<OperatorProvisionResult> {
  const companyNameTrimmed = input.companyName.trim();
  const ownerNameTrimmed = input.ownerName.trim();
  const phoneTrimmed = input.phone.trim();
  const emailTrimmed = input.email && input.email.trim() ? input.email.trim().toLowerCase() : `${phoneTrimmed}@ruralbus.local`;
  const rawPassword = input.password ? input.password.trim() : '';

  if (!rawPassword || rawPassword.length < 8) {
    throw new BadRequestError('Initial password is required and must be at least 8 characters long');
  }

  return withSystemContext(async (tx) => {
    // 1. Check user phone uniqueness
    const [existingPhone] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phoneTrimmed))
      .limit(1);

    if (existingPhone) {
      throw new ConflictError('A user with this mobile number is already registered');
    }

    // 2. Check user email uniqueness if explicitly provided
    if (input.email && input.email.trim()) {
      const [existingEmail] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, emailTrimmed))
        .limit(1);

      if (existingEmail) {
        throw new ConflictError('A user with this email address is already registered');
      }
    }

    // 3. Check operator company name uniqueness
    const [existingCompany] = await tx
      .select({ id: operators.id })
      .from(operators)
      .where(ilike(operators.companyName, companyNameTrimmed))
      .limit(1);

    if (existingCompany) {
      throw new ConflictError('A transport company with this name already exists');
    }

    // 4. Generate or validate unique businessCode
    let baseCode = input.businessCode
      ? input.businessCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
      : companyNameTrimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (!baseCode) baseCode = 'TRANSIT';

    let finalBusinessCode = baseCode;
    let codeAttempts = 0;
    while (codeAttempts < 10) {
      const [existingCode] = await tx
        .select({ id: operators.id })
        .from(operators)
        .where(eq(operators.businessCode, finalBusinessCode))
        .limit(1);

      if (!existingCode) break;
      finalBusinessCode = `${baseCode}-${Math.floor(1000 + Math.random() * 9000)}`;
      codeAttempts++;
    }

    // 5. Hash password strictly with Argon2id
    const passwordHash = await hashPassword(rawPassword);

    // 6. Insert into operators table
    const [newOperator] = await tx
      .insert(operators)
      .values({
        companyName: companyNameTrimmed,
        businessCode: finalBusinessCode,
        contactEmail: emailTrimmed,
        contactPhone: phoneTrimmed,
        status: 'ACTIVE',
      })
      .returning();

    // 7. Insert into users table
    // STRICT SECURITY: developmentPassword is NULL, mustChangePassword is true
    const [newUser] = await tx
      .insert(users)
      .values({
        fullName: ownerNameTrimmed,
        phone: phoneTrimmed,
        email: input.email && input.email.trim() ? emailTrimmed : null,
        passwordHash,
        developmentPassword: null,
        role: 'OPERATOR_ADMIN',
        isActive: true,
        mustChangePassword: true,
        phoneVerified: true,
      })
      .returning();

    // 8. Insert into operator_members table with role = 'OPERATOR_ADMIN'
    await tx
      .insert(operatorMembers)
      .values({
        userId: newUser.id,
        tenantId: newOperator.id,
        role: 'OPERATOR_ADMIN',
        isActive: true,
      })
      .returning();

    // 9. Dispatch SMS with initial credentials
    // Note: rawPassword is in memory solely for delivery to SMS gateway, never logged.
    let smsResult: AccountProvisioningSmsResult;
    try {
      smsResult = await sendAccountProvisioningSms({
        phone: phoneTrimmed,
        transportName: newOperator.companyName,
        ownerName: newUser.fullName,
        username: phoneTrimmed,
        initialPassword: rawPassword,
        accountId: newUser.id,
      });
    } catch (err: any) {
      const digits = phoneTrimmed.replace(/\D/g, '');
      const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;
      const maskedPhone = `+91 ${cleanPhone.slice(0, 2)}****${cleanPhone.slice(-4)}`;
      smsResult = {
        sent: false,
        provider: 'none',
        maskedPhone,
        message: 'SMS delivery failed',
        error: err?.message || 'Gateway network error',
      };
    }

    // 10. Return result WITHOUT plaintext password or passwordHash
    return {
      operator: {
        id: newOperator.id,
        companyName: newOperator.companyName,
        businessCode: newOperator.businessCode,
        contactEmail: newOperator.contactEmail,
        contactPhone: newOperator.contactPhone,
        status: newOperator.status,
        createdAt: newOperator.createdAt.toISOString(),
      },
      owner: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email || '',
        phone: newUser.phone || '',
        role: 'OPERATOR_ADMIN',
      },
      sms: smsResult,
    };
  });
}

/**
 * Returns all operators along with their associated owner admin details,
 * registered bus count, and staff count.
 */
export async function listOperatorsWithDetails(): Promise<OperatorDetails[]> {
  return withSystemContext(async (tx) => {
    // 1. Fetch all operators
    const allOperators = await tx
      .select()
      .from(operators)
      .orderBy(operators.companyName);

    if (allOperators.length === 0) return [];

    // 2. Fetch all operator admins
    const adminMembers = await tx
      .select({
        tenantId: operatorMembers.tenantId,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
      })
      .from(operatorMembers)
      .innerJoin(users, eq(operatorMembers.userId, users.id))
      .where(eq(operatorMembers.role, 'OPERATOR_ADMIN'));

    // 3. Count buses per operator
    const busCounts = await tx
      .select({
        tenantId: buses.tenantId,
        count: sql<number>`count(*)::int`,
      })
      .from(buses)
      .groupBy(buses.tenantId);

    // 4. Count staff per operator
    const staffCounts = await tx
      .select({
        tenantId: operatorMembers.tenantId,
        count: sql<number>`count(*)::int`,
      })
      .from(operatorMembers)
      .groupBy(operatorMembers.tenantId);

    const busCountMap = new Map<string, number>();
    for (const b of busCounts) {
      if (b.tenantId) busCountMap.set(b.tenantId, Number(b.count));
    }

    const staffCountMap = new Map<string, number>();
    for (const s of staffCounts) {
      if (s.tenantId) staffCountMap.set(s.tenantId, Number(s.count));
    }

    const adminMap = new Map<string, typeof adminMembers[0]>();
    for (const a of adminMembers) {
      if (a.tenantId && !adminMap.has(a.tenantId)) {
        adminMap.set(a.tenantId, a);
      }
    }

    return allOperators.map((op) => {
      const admin = adminMap.get(op.id);
      return {
        id: op.id,
        companyName: op.companyName,
        businessCode: op.businessCode,
        contactEmail: op.contactEmail,
        contactPhone: op.contactPhone,
        corridor: (op as any).corridor || 'State Rural Corridor',
        status: op.status,
        createdAt: op.createdAt.toISOString(),
        updatedAt: op.updatedAt.toISOString(),
        ownerName: admin?.fullName || 'Operator Admin',
        ownerPhone: admin?.phone || op.contactPhone,
        ownerEmail: admin?.email || op.contactEmail,
        busesCount: busCountMap.get(op.id) || 0,
        staffCount: staffCountMap.get(op.id) || (admin ? 1 : 0),
      };
    });
  });
}

