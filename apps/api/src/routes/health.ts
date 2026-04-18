import type { FastifyInstance } from 'fastify';
import { sql, type DatabaseClient } from '@protocol-atlas/db';

export async function registerHealthRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.get('/health', async () => {
    await db.execute(sql`select 1`);

    return {
      status: 'ok',
      service: 'protocol-atlas-api',
    };
  });
}
