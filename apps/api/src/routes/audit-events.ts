import type { FastifyInstance } from 'fastify';
import type { DatabaseClient } from '@protocol-atlas/db';
import { listRecentAuditEvents } from '@protocol-atlas/db';

export async function registerAuditEventRoutes(app: FastifyInstance, db: DatabaseClient) {
  app.get('/audit-events', async () => {
    const items = await listRecentAuditEvents(db, 20);

    return {
      items,
      count: items.length,
    };
  });
}
