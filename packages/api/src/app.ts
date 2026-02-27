import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await app.register(cookie);

  app.get('/api/v1/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
