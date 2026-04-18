import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '@protocol-atlas/db';
import { listActiveWatchlistTargets } from '@protocol-atlas/db';

const watchlistTargetsQuerySchema = z.object({
  chain: z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']).default('arbitrum'),
  protocolKey: z.string().min(1).default('aave-v3'),
  limit: z.coerce.number().int().positive().max(5000).default(500),
});

export async function registerWatchlistTargetRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.get('/watchlist-targets', async (request) => {
    const query = watchlistTargetsQuerySchema.parse(request.query);
    const items = await listActiveWatchlistTargets(db, query);

    return {
      items,
      count: items.length,
      filters: query,
    };
  });
}
