import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '@protocol-atlas/db';
import { listLiquidationCandidates } from '@protocol-atlas/db';

const chainSchema = z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']);
const opportunityStatusSchema = z.enum([
  'discovered',
  'review-pending',
  'simulating',
  'approved',
  'skipped',
  'blocked',
  'expired',
  'executed',
  'failed',
]);
const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
const liquidationSignalSchema = z.enum(['actionable', 'watch-close', 'low-margin']);

const liquidationCandidatesQuerySchema = z.object({
  chain: chainSchema.optional(),
  protocolKey: z.string().trim().min(1).optional(),
  status: opportunityStatusSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  signal: liquidationSignalSchema.optional(),
  limit: z.coerce.number().int().positive().max(250).default(100),
});

export async function registerLiquidationCandidateRoutes(
  app: FastifyInstance,
  db: DatabaseClient,
) {
  app.get('/liquidation-candidates', async (request) => {
    const query = liquidationCandidatesQuerySchema.parse(request.query);
    const items = await listLiquidationCandidates(db, {
      ...(query.chain ? { chain: query.chain } : {}),
      ...(query.protocolKey ? { protocolKey: query.protocolKey } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.riskLevel ? { riskLevel: query.riskLevel } : {}),
      ...(query.signal ? { signal: query.signal } : {}),
      limit: query.limit,
    });

    return {
      items,
      count: items.length,
      filters: {
        chain: query.chain ?? null,
        protocolKey: query.protocolKey ?? null,
        status: query.status ?? null,
        riskLevel: query.riskLevel ?? null,
        signal: query.signal ?? null,
      },
    };
  });
}
