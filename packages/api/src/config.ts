export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  host: process.env.API_HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || './kanbang.db',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production-min-32-chars',
  rp: {
    id: process.env.RP_ID || 'localhost',
    name: process.env.RP_NAME || 'KanBang',
    origin: process.env.RP_ORIGIN || 'http://localhost:3000',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};
