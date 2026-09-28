import { FastifyError, FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
    details?: Array<{ field?: string; message: string; [key: string]: unknown }>;
    stack?: string;
  };
}

export function formatErrorResponse(
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Array<{ field?: string; message: string }>;
    stack?: string;
  },
  requestId: string
): StandardErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      ...(error.details && error.details.length > 0 ? { details: error.details } : {}),
      ...(env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
    },
  };
}

export function extractDiagnosticMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';

  // Extract nested error messages if AggregateError or multierror (e.g. pg connection pool)
  const isAggregate = error.name === 'AggregateError' || Array.isArray(error.errors);
  const innerMessages: string[] = isAggregate
    ? (error.errors || [])
        .map((e: any) => e?.message || e?.code || '')
        .filter(Boolean)
    : [];

  const combined = [error.message, ...innerMessages, error.code, error.stack || ''].join(' ');

  // PostgreSQL / Database Connection Failures
  if (
    error.code === 'ECONNREFUSED' ||
    combined.includes('ECONNREFUSED') ||
    combined.includes('connect ECONNREFUSED')
  ) {
    const dbHost = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/.*@([^:]+:\d+).*/, '$1')
      : 'localhost:5432';
    return `Database connection refused (ECONNREFUSED). PostgreSQL is not running or unreachable at ${dbHost}. Please start Docker Desktop or ensure PostgreSQL is running.`;
  }

  if (combined.includes('ETIMEDOUT') || error.code === 'ETIMEDOUT') {
    return 'Database connection timed out. Please check network connectivity and database availability.';
  }

  if (isAggregate && innerMessages.length > 0) {
    return innerMessages.join('; ');
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message;
  }

  return error.code || error.name || 'An unexpected error occurred';
}

const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Centralized Error Handler
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id || 'unknown';

    // 1. Zod Schema Validation Error
    if (error instanceof ZodError || error.name === 'ZodError') {
      const zodError = error as ZodError;
      const details = zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      const payload = formatErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: 'Request payload validation failed',
          statusCode: 400,
          details,
          stack: error.stack,
        },
        requestId
      );

      request.log.warn({ requestId, details }, 'Zod validation failed');
      return reply.status(400).send(payload);
    }

    // 2. Fastify Native Schema Validation Error
    if ('validation' in error && error.validation) {
      const details = Array.isArray(error.validation)
        ? error.validation.map((v: any) => ({
            field: v.instancePath?.replace(/^\//, '') || v.params?.missingProperty || 'unknown',
            message: v.message || 'Invalid value',
          }))
        : [{ message: error.message }];

      const payload = formatErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Validation failed',
          statusCode: 400,
          details,
          stack: error.stack,
        },
        requestId
      );

      request.log.warn({ requestId, details }, 'Fastify schema validation failed');
      return reply.status(400).send(payload);
    }

    // 3. Custom Operational Application Error (AppError and subclasses)
    if (error instanceof AppError || (error as any).isOperational) {
      const appErr = error as AppError;
      const payload = formatErrorResponse(
        {
          code: appErr.code || 'APPLICATION_ERROR',
          message: appErr.message,
          statusCode: appErr.statusCode || 500,
          details: appErr.details,
          stack: error.stack,
        },
        requestId
      );

      if (appErr.statusCode >= 500) {
        request.log.error({ requestId, err: error }, `Application error [${appErr.code}]`);
      } else {
        request.log.warn({ requestId, err: error }, `Client error [${appErr.code}]`);
      }

      return reply.status(appErr.statusCode).send(payload);
    }

    // 4. Fastify HTTP Error (e.g. 400 on malformed JSON body)
    const statusCode = (error as FastifyError).statusCode || 500;
    if (statusCode < 500) {
      const payload = formatErrorResponse(
        {
          code: (error as FastifyError).code || 'BAD_REQUEST',
          message: error.message,
          statusCode,
          stack: error.stack,
        },
        requestId
      );
      request.log.warn({ requestId, err: error }, `HTTP client error [${statusCode}]`);
      return reply.status(statusCode).send(payload);
    }

    // 5. Unhandled Server Exceptions (500)
    request.log.error({ requestId, err: error }, 'Unhandled server exception');

    const message =
      env.NODE_ENV === 'production'
        ? 'An unexpected internal error occurred'
        : extractDiagnosticMessage(error);

    const payload = formatErrorResponse(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        statusCode: 500,
        stack: error.stack,
      },
      requestId
    );

    return reply.status(500).send(payload);
  });

  // 404 Route Not Found Handler
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id || 'unknown';
    const payload = formatErrorResponse(
      {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${request.method} ${request.url}`,
        statusCode: 404,
      },
      requestId
    );

    request.log.warn({ requestId, method: request.method, url: request.url }, 'Route not found');
    return reply.status(404).send(payload);
  });
};

export const errorHandlerPlugin = fp(plugin, {
  name: 'errorHandlerPlugin',
  fastify: '5.x',
});
