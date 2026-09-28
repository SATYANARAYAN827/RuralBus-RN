import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';
import type { JwtAccessTokenPayload } from '@ruralbus/shared-types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtAccessTokenPayload;
    user: JwtAccessTokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async function (fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, _reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
          throw new UnauthorizedError('Authorization header missing');
        }
        if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
          throw new UnauthorizedError('Access token has expired');
        }
        throw new UnauthorizedError('Invalid authentication token');
      }
    }
  );
});
