import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth/index.js';
import { config } from './config.js';

export interface BuildAppOptions {
  databaseUrl?: string;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}) {
  const app = Fastify({
    logger: opts.logger ?? true,
  });

  await app.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await app.register(cookie);
  await app.register(dbPlugin, { databaseUrl: opts.databaseUrl });
  await app.register(authPlugin);

  // Health check
  app.get('/api/v1/health', async () => {
    return { status: 'ok' };
  });

  // Auth routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  return app;
}
