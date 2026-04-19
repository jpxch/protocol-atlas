import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '@protocol-atlas/db';
import { listLiquidationPlans } from '@protocol-atlas/db';

const chainSchema = z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']);
const liquidationPlanStatusSchema = z.enum(['planned', 'blocked', 'stale']);

const liquidationPlansQuerySchema = z.object({
  chain: chainSchema.optional(),
  protocolKey: z.string().trim().min(1).optional(),
  status: liquidationPlanStatusSchema.optional(),
  candidateOpportunityId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(250).default(100),
});

export async function registerLiquidationPlanRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.get('/liquidation-plans', async (request) => {
    const query = liquidationPlansQuerySchema.parse(request.query);
    const items = await listLiquidationPlans(db, {
      ...(query.chain ? { chain: query.chain } : {}),
      ...(query.protocolKey ? { protocolKey: query.protocolKey } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.candidateOpportunityId
        ? { candidateOpportunityId: query.candidateOpportunityId }
        : {}),
      limit: query.limit,
    });

    return {
      items,
      count: items.length,
      filters: {
        chain: query.chain ?? null,
        protocolKey: query.protocolKey ?? null,
        status: query.status ?? null,
        candidateOpportunityId: query.candidateOpportunityId ?? null,
      },
    };
  });
}
