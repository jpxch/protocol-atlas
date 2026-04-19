import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '@protocol-atlas/db';
import { listWatchlistTargets } from '@protocol-atlas/db';

const chainSchema = z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']);

const watchlistTargetsQuerySchema = z.object({
  chain: chainSchema.optional(),
  protocolKey: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function registerWatchlistTargetRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.get('/watchlist-targets', async (request) => {
    const query = watchlistTargetsQuerySchema.parse(request.query);
    const result = await listWatchlistTargets(db, query);

    return {
      items: result.items,
      count: result.count,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        returned: result.items.length,
      },
      filters: {
        chain: query.chain ?? null,
        protocolKey: query.protocolKey ?? null,
        source: query.source ?? null,
        isActive: query.isActive ?? null,
        search: query.search ?? null,
      },
    };
  });
}