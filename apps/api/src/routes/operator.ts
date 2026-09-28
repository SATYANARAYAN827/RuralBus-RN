import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/rbac.js';
import { ForbiddenError } from '../errors/AppError.js';
import {
  createStaffSchema,
  updateStaffStatusSchema,
  resetStaffPasswordSchema,
  updateOperatorProfileSchema,
  staffQuerySchema,
  updateStaffMemberSchema,
} from '@ruralbus/shared-validators';
import {
  getOperatorProfile,
  updateOperatorProfile,
  listStaffMembers,
  provisionStaffMember,
  updateStaffStatus,
  resetStaffPassword,
  getOperatorRevenueSummary,
  updateStaffMember,
  deleteStaffMember,
} from '../services/staff.service.js';

export const operatorRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All operator routes require authenticated OPERATOR_ADMIN with tenant context
  const operatorGuards = {
    preHandler: [app.authenticate, requireRole(['OPERATOR_ADMIN']), app.requireTenant],
  };

  const staffGuards = {
    preHandler: [
      app.authenticate,
      requireRole(['OPERATOR_ADMIN', 'PLATFORM_ADMIN']),
      async (request: FastifyRequest, reply: FastifyReply) => {
        if (request.user?.role === 'OPERATOR_ADMIN') {
          await app.requireTenant(request, reply);
        }
      },
    ],
  };

  // 1. Get Operator Company Profile
  app.get(
    '/api/v1/operator/profile',
    operatorGuards,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenant!.tenantId;
      const profile = await getOperatorProfile(tenantId);
      return reply.status(200).send({
        success: true,
        data: { profile },
      });
    }
  );

  // 2. Update Operator Company Profile
  app.put(
    '/api/v1/operator/profile',
    operatorGuards,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenant!.tenantId;
      const parsed = updateOperatorProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid operator profile data',
          },
        });
      }

      const profile = await updateOperatorProfile(tenantId, parsed.data);
      return reply.status(200).send({
        success: true,
        data: { profile },
      });
    }
  );

  // 3. List Staff Members (Drivers & Conductors)
  app.get(
    '/api/v1/operator/staff',
    staffGuards,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user!.role;
      let tenantId: string | undefined;

      if (userRole === 'OPERATOR_ADMIN') {
        tenantId = request.tenant?.tenantId || request.user?.tenantId || undefined;
        if (!tenantId) {
          throw new ForbiddenError('Tenant context is required to view staff members');
        }
      } else {
        // PLATFORM_ADMIN
        tenantId = (request.query as any)?.tenantId || undefined;
      }

      const parsedQuery = staffQuerySchema.safeParse(request.query);
      const query = parsedQuery.success ? parsedQuery.data : undefined;

      const result = await listStaffMembers(tenantId, query);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  // 4. Provision New Staff Member (Driver or Conductor)
  app.post(
    '/api/v1/operator/staff',
    staffGuards,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user!.role;
      let tenantId: string;

      if (userRole === 'OPERATOR_ADMIN') {
        tenantId = request.tenant?.tenantId || request.user?.tenantId || '';
        if (!tenantId) {
          throw new ForbiddenError('Tenant context is required for operator staff creation');
        }
        const clientSuppliedTenantId = (request.body as any)?.tenantId;
        if (clientSuppliedTenantId && clientSuppliedTenantId !== tenantId) {
          throw new ForbiddenError('Cannot provision staff for another operator');
        }
      } else {
        // PLATFORM_ADMIN
        tenantId = (request.body as any)?.tenantId || '';
        if (!tenantId) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Target tenantId is required when provisioning staff as Super Admin',
            },
          });
        }
      }

      const parsed = createStaffSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid staff details',
          },
        });
      }

      const createdBy = userRole === 'OPERATOR_ADMIN' ? 'OWNER' : 'SUPER_ADMIN';
      // Super Admin creates staff under operator pool without bus assignment; Owner assigns vehicles
      const staffMember = await provisionStaffMember(tenantId, {
        ...parsed.data,
        bus: parsed.data.bus || undefined,
        busId: (parsed.data.busId && parsed.data.busId.length > 0) ? parsed.data.busId : undefined,
        createdBy,
      });
      return reply.status(201).send({
        success: true,
        data: { staff: staffMember },
      });
    }
  );

  // 5. Update Staff Member Status (Activate / Suspend)
  app.put<{ Params: { staffId: string } }>(
    '/api/v1/operator/staff/:staffId/status',
    staffGuards,
    async (request: FastifyRequest<{ Params: { staffId: string } }>, reply: FastifyReply) => {
      const { staffId } = request.params;
      const userRole = request.user!.role;
      const tenantId = userRole === 'OPERATOR_ADMIN' ? request.tenant?.tenantId : (request.body as any)?.tenantId;

      const parsed = updateStaffStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid status data',
          },
        });
      }

      const updated = await updateStaffStatus(tenantId, staffId, parsed.data.isActive);
      return reply.status(200).send({
        success: true,
        data: { staff: updated },
      });
    }
  );

  // 6. Reset Staff Password
  app.post<{ Params: { staffId: string } }>(
    '/api/v1/operator/staff/:staffId/reset-password',
    staffGuards,
    async (request: FastifyRequest<{ Params: { staffId: string } }>, reply: FastifyReply) => {
      const { staffId } = request.params;
      const userRole = request.user!.role;
      const tenantId = userRole === 'OPERATOR_ADMIN' ? request.tenant?.tenantId : (request.body as any)?.tenantId;
      const parsed = resetStaffPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid password data',
          },
        });
      }

      const result = await resetStaffPassword(
        tenantId,
        staffId,
        parsed.data.newPassword
      );
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  // 7. Get Operator Revenue Analytics & Breakdown
  app.get(
    '/api/v1/operator/revenue',
    operatorGuards,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenant!.tenantId;
      const summary = await getOperatorRevenueSummary(tenantId);
      return reply.status(200).send({
        success: true,
        data: summary,
      });
    }
  );

  // 8. Get Operator Fleet & Operations Stats
  app.get(
    '/api/v1/operator/stats',
    operatorGuards,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenant!.tenantId;
      const summary = await getOperatorRevenueSummary(tenantId);
      return reply.status(200).send({
        success: true,
        data: summary,
      });
    }
  );

  // 9. Edit Staff Member (name + bus assignment)
  app.put<{ Params: { staffId: string } }>(
    '/api/v1/operator/staff/:staffId',
    staffGuards,
    async (request: FastifyRequest<{ Params: { staffId: string } }>, reply: FastifyReply) => {
      const { staffId } = request.params;
      const userRole = request.user!.role;
      const isSuperAdmin = userRole === 'PLATFORM_ADMIN';
      const callerTenantId = isSuperAdmin
        ? null
        : (request.tenant?.tenantId || request.user?.tenantId || null);

      const parsed = updateStaffMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid staff update data',
          },
        });
      }

      const updated = await updateStaffMember(callerTenantId, staffId, parsed.data, isSuperAdmin);
      return reply.status(200).send({ success: true, data: { staff: updated } });
    }
  );

  // 10. Delete Staff Member
  app.delete<{ Params: { staffId: string } }>(
    '/api/v1/operator/staff/:staffId',
    staffGuards,
    async (request: FastifyRequest<{ Params: { staffId: string } }>, reply: FastifyReply) => {
      const { staffId } = request.params;
      const userRole = request.user!.role;
      const isSuperAdmin = userRole === 'PLATFORM_ADMIN';
      const callerTenantId = isSuperAdmin
        ? null
        : (request.tenant?.tenantId || request.user?.tenantId || null);

      const result = await deleteStaffMember(callerTenantId, staffId, isSuperAdmin);
      return reply.status(200).send({ success: true, data: result });
    }
  );
};
