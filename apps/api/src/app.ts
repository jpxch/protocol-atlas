import Fastify from 'fastify';
import { createDatabaseClient } from '@protocol-atlas/db';
import { getEnv } from './env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerOpportunityRoutes } from './routes/opportunities.js';
import { registerOperatorActionRoutes } from './routes/operator-actions.js';

export async function buildApp() {
  const env = getEnv();
  const db = createDatabaseClient({
    databaseUrl: env.DATABASE_URL,
  });

  const app = Fastify({
    logger: true,
  });

  await registerHealthRoutes(app, db);
  await registerOpportunityRoutes(app, db);
  await registerOperatorActionRoutes(app, db);

  return { app, env };
}
