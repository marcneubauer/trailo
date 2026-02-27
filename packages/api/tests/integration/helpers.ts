import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

export async function createTestApp() {
  const app = await buildApp({
    databaseUrl: ':memory:',
    logger: false,
  });
  await app.ready();
  return app;
}

export function getSessionCookie(response: any): string | undefined {
  const cookies = response.cookies as Array<{ name: string; value: string }>;
  return cookies?.find((c: any) => c.name === 'trailo_session')?.value;
}

export async function registerUser(
  app: FastifyInstance,
  data?: { email?: string; username?: string; password?: string },
) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: data?.email ?? 'test@example.com',
      username: data?.username ?? 'testuser',
      password: data?.password ?? 'password123',
    },
  });
  return {
    response,
    sessionCookie: getSessionCookie(response),
    body: JSON.parse(response.body),
  };
}

export async function loginUser(
  app: FastifyInstance,
  data?: { email?: string; password?: string },
) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: data?.email ?? 'test@example.com',
      password: data?.password ?? 'password123',
    },
  });
  return {
    response,
    sessionCookie: getSessionCookie(response),
    body: JSON.parse(response.body),
  };
}

export function authHeader(sessionCookie: string) {
  return { cookie: `trailo_session=${sessionCookie}` };
}
