import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '@protocol-atlas/db';
import { listRecentScanRuns } from '@protocol-atlas/db';

const chainSchema = z.enum(['ethereum', 'arbitrum', 'optimism', 'base', 'polygon']);
const scanRunStatusSchema = z.enum(['started', 'completed', 'failed']);

const scanRunsQuerySchema = z.object({
  chain: chainSchema.optional(),
  protocolKey: z.string().trim().min(1).optional(),
  scannerKey: z.string().trim().min(1).optional(),
  status: scanRunStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function registerScanRunRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.get('/scan-runs', async (request) => {
    const query = scanRunsQuerySchema.parse(request.query);
    const items = await listRecentScanRuns(db, query);

    return {
      items,
      count: items.length,
      filters: {
        chain: query.chain ?? null,
        protocolKey: query.protocolKey ?? null,
        scannerKey: query.scannerKey ?? null,
        status: query.status ?? null,
      },
    };
  });
}
