import Fastify from 'fastify';
import { createDatabaseClient } from '@protocol-atlas/db';
import { getEnv } from './env.js';
import { registerAuditEventRoutes } from './routes/audit-events.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerLiquidationCandidateRoutes } from './routes/liquidation-candidates.js';
import { registerLiquidationPlanRoutes } from './routes/liquidation-plans.js';
import { registerOpportunityRoutes } from './routes/opportunities.js';
import { registerOperatorActionRoutes } from './routes/operator-actions.js';
import { registerScanRunRoutes } from './routes/scan-runs.js';
import { registerWatchlistTargetRoutes } from './routes/watchlist-targets.js';

export async function buildApp() {
  const env = getEnv();
  const db = createDatabaseClient({
    databaseUrl: env.DATABASE_URL,
  });

  const app = Fastify({
    logger: true,
  });

  await registerHealthRoutes(app, db);
  await registerLiquidationCandidateRoutes(app, db);
  await registerLiquidationPlanRoutes(app, db);
  await registerOpportunityRoutes(app, db);
  await registerAuditEventRoutes(app, db);
  await registerOperatorActionRoutes(app, db);
  await registerWatchlistTargetRoutes(app, db);
  await registerScanRunRoutes(app, db);

  return { app, env };
}
