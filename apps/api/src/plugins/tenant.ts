import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';
import { withTenant as dbWithTenant, withSystemContext, operators, operatorMembers, users, DrizzleTransaction } from '@ruralbus/database';
import { eq, and, or } from 'drizzle-orm';
import type { TenantContext, OperatorMemberRole } from '@ruralbus/shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
    withTenant: <T>(callback: (tx: DrizzleTransaction) => Promise<T>) => Promise<T>;
  }
  interface FastifyInstance {
    requireTenant: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function resolveTenantForUser(userId: string, role: string): Promise<string | null> {
  return withSystemContext(async (tx) => {
    // 1. Check existing active operator membership
    const [member] = await tx
      .select({ tenantId: operatorMembers.tenantId })
      .from(operatorMembers)
      .where(
        and(
          eq(operatorMembers.userId, userId),
          eq(operatorMembers.isActive, true)
        )
      )
      .limit(1);

    if (member?.tenantId) {
      return member.tenantId;
    }

    // 2. Check any membership regardless of active flag
    const [anyMember] = await tx
      .select({ tenantId: operatorMembers.tenantId })
      .from(operatorMembers)
      .where(eq(operatorMembers.userId, userId))
      .limit(1);

    if (anyMember?.tenantId) {
      return anyMember.tenantId;
    }

    // 3. Check if user's phone or email matches an operator's contact details
    const [usr] = await tx
      .select({ fullName: users.fullName, phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (usr) {
      const orConds: any[] = [];
      if (usr.phone) orConds.push(eq(operators.contactPhone, usr.phone));
      if (usr.email) orConds.push(eq(operators.contactEmail, usr.email));
      if (orConds.length > 0) {
        const [matchedOp] = await tx
          .select({ id: operators.id })
          .from(operators)
          .where(or(...orConds))
          .limit(1);

        if (matchedOp?.id) {
          try {
            await tx
              .insert(operatorMembers)
              .values({
                userId,
                tenantId: matchedOp.id,
                role: role as any,
                isActive: true,
              });
          } catch {}
          return matchedOp.id;
        }
      }
    }

    // 4. If user is an OPERATOR_ADMIN without an operator, create their own dedicated company
    if (role === 'OPERATOR_ADMIN') {
      const companyName = usr?.fullName ? `${usr.fullName} Transport` : 'Rural Bus Transport';
      const baseCode = usr?.phone ? `OP-${usr.phone.slice(-6)}` : `OP-${Math.floor(1000 + Math.random() * 9000)}`;
      const contactPhone = usr?.phone || '9876543999';
      const contactEmail = usr?.email || `${contactPhone}@ruralbus.local`;

      const [newOp] = await tx
        .insert(operators)
        .values({
          companyName,
          businessCode: baseCode,
          contactPhone,
          contactEmail,
          corridor: 'State Rural Corridor',
          status: 'ACTIVE',
        })
        .returning();

      if (newOp?.id) {
        try {
          await tx
            .insert(operatorMembers)
            .values({
              userId,
              tenantId: newOp.id,
              role: 'OPERATOR_ADMIN',
              isActive: true,
            });
        } catch {}
        return newOp.id;
      }
    }

    // 5. Fallback for drivers and conductors
    if (role === 'DRIVER' || role === 'CONDUCTOR') {
      const [firstOp] = await tx
        .select({ id: operators.id })
        .from(operators)
        .where(eq(operators.status, 'ACTIVE'))
        .limit(1);

      if (firstOp?.id) {
        try {
          await tx
            .insert(operatorMembers)
            .values({
              userId,
              tenantId: firstOp.id,
              role: role as any,
              isActive: true,
            });
        } catch {}
        return firstOp.id;
      }
    }

    return null;
  });
}

export const tenantPlugin = fp(async function (fastify: FastifyInstance) {
  // Pre-parsing hook to scrub any client-provided x-tenant-id headers to enforce zero-client-trust
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    if (request.headers['x-tenant-id']) {
      // Ingress scrubbing: delete client-supplied header so downstream handlers never read untrusted input
      delete request.headers['x-tenant-id'];
    }
  });

  // Decorate Fastify with requireTenant preHandler hook
  fastify.decorate(
    'requireTenant',
    async function (request: FastifyRequest, _reply: FastifyReply) {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      let tenantId = request.user.tenantId;
      if (!tenantId && request.user.sub) {
        tenantId = (await resolveTenantForUser(request.user.sub, request.user.role)) || undefined;
        if (tenantId) {
          request.user.tenantId = tenantId;
        }
      }

      if (!tenantId) {
        throw new ForbiddenError('Tenant context is required for this operation');
      }

      request.tenant = {
        tenantId,
        role: request.user.role as OperatorMemberRole,
        userId: request.user.sub,
      };
    }
  );

  // Decorate Request with withTenant helper bound to the authenticated user's tenantId
  fastify.decorateRequest(
    'withTenant',
    function <T>(this: FastifyRequest, callback: (tx: DrizzleTransaction) => Promise<T>): Promise<T> {
      const tenantId = this.tenant?.tenantId || this.user?.tenantId;
      if (!tenantId) {
        throw new ForbiddenError('Tenant context is required for database operations');
      }
      return dbWithTenant(tenantId, callback);
    }
  );
});
