import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '@ruralbus/database';
import { withSystemContext, buses as busesTable } from '@ruralbus/database';
import { requireRole } from '../plugins/rbac.js';
import { createOperatorSchema, updateOperatorAdminSchema } from '@ruralbus/shared-validators';
import {
  createOperatorAndOwner,
  listOperatorsWithDetails,
  updateOperatorStatus,
  updateOperatorDetails,
  deleteOperator,
} from '../services/staff.service.js';

export const tenantRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 1. Get Authenticated Tenant Context
  app.get(
    '/api/v1/tenant/context',
    {
      preHandler: [app.authenticate, app.requireTenant],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenant?.tenantId || request.user?.tenantId;
      if (!tenantId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Tenant context required' },
        });
      }

      const [operator] = await withSystemContext(async (tx) => {
        return tx
          .select({
            id: schema.operators.id,
            companyName: schema.operators.companyName,
            businessCode: schema.operators.businessCode,
            contactEmail: schema.operators.contactEmail,
            contactPhone: schema.operators.contactPhone,
            status: schema.operators.status,
            createdAt: schema.operators.createdAt,
          })
          .from(schema.operators)
          .where(eq(schema.operators.id, tenantId))
          .limit(1);
      });

      return reply.status(200).send({
        success: true,
        data: {
          tenant: {
            id: operator?.id || tenantId,
            tenantId: operator?.id || tenantId,
            name: operator?.companyName || 'Transport Operator',
            companyName: operator?.companyName || 'Transport Operator',
            slug: operator?.businessCode?.toLowerCase() || 'operator',
            businessCode: operator?.businessCode || 'TRANSIT',
            status: operator?.status || 'ACTIVE',
            contactEmail: operator?.contactEmail,
            contactPhone: operator?.contactPhone,
            role: request.user?.role,
            userId: request.user?.sub,
          },
        },
      });
    }
  );

  // 2. Get Fleet Buses for Current Tenant (Demonstrating RLS Isolation)
  app.get(
    '/api/v1/tenant/buses',
    {
      preHandler: [app.authenticate, app.requireTenant],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const buses = await request.withTenant(async (tx) => {
        return tx.select().from(schema.buses);
      });

      return reply.status(200).send({
        success: true,
        data: {
          buses,
        },
      });
    }
  );

  // 3. Get All Registered Transport Operators (Accessible to Authenticated Users)
  app.get(
    '/api/v1/tenant/operators',
    {
      preHandler: [app.authenticate],
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const operatorsList = await listOperatorsWithDetails();

      return reply.status(200).send({
        success: true,
        data: {
          operators: operatorsList,
        },
      });
    }
  );

  // 4. Create New Transport Company & Owner Account (STRICTLY PLATFORM_ADMIN)
  app.post(
    '/api/v1/tenant/operators',
    {
      preHandler: [app.authenticate, requireRole(['PLATFORM_ADMIN'])],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createOperatorSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid operator creation data',
          },
        });
      }

      const result = await createOperatorAndOwner(parsed.data);

      return reply.status(201).send({
        success: true,
        data: result,
      });
    }
  );

  // 5. Update Transport Operator Details (STRICTLY PLATFORM_ADMIN)
  // Accepts any subset of: companyName, ownerName, contactPhone, contactEmail, corridor, status
  app.put<{ Params: { tenantId: string } }>(
    '/api/v1/tenant/operators/:tenantId',
    {
      preHandler: [app.authenticate, requireRole(['PLATFORM_ADMIN'])],
    },
    async (request: FastifyRequest<{ Params: { tenantId: string } }>, reply: FastifyReply) => {
      const { tenantId } = request.params;

      const parsed = updateOperatorAdminSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid operator update data',
          },
        });
      }

      const updated = await updateOperatorDetails(tenantId, parsed.data);
      return reply.status(200).send({
        success: true,
        data: { operator: updated },
      });
    }
  );

  // 6. Delete Transport Operator (STRICTLY PLATFORM_ADMIN)
  app.delete<{ Params: { tenantId: string } }>(
    '/api/v1/tenant/operators/:tenantId',
    {
      preHandler: [app.authenticate, requireRole(['PLATFORM_ADMIN'])],
    },
    async (request: FastifyRequest<{ Params: { tenantId: string } }>, reply: FastifyReply) => {
      const { tenantId } = request.params;
      const result = await deleteOperator(tenantId);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  // 7. Get Fleet Buses for a Specific Operator (PLATFORM_ADMIN and own OPERATOR_ADMIN)
  app.get<{ Params: { tenantId: string } }>(
    '/api/v1/tenant/operators/:tenantId/buses',
    {
      preHandler: [app.authenticate, requireRole(['PLATFORM_ADMIN', 'OPERATOR_ADMIN'])],
    },
    async (request: FastifyRequest<{ Params: { tenantId: string } }>, reply: FastifyReply) => {
      const { tenantId } = request.params;
      const userRole = request.user!.role;

      // OPERATOR_ADMIN can only view their own tenant's buses
      if (userRole === 'OPERATOR_ADMIN') {
        const userTenantId = request.user?.tenantId;
        if (!userTenantId || userTenantId !== tenantId) {
          return reply.status(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Cannot access buses of another operator' },
          });
        }
      }

      const busesList = await withSystemContext(async (tx) => {
        return tx.select().from(busesTable).where(eq(busesTable.tenantId, tenantId));
      });

      return reply.status(200).send({ success: true, data: { buses: busesList } });
    }
  );
};
