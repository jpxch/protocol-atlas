import { desc } from 'drizzle-orm';
import type { DatabaseClient } from '../client.js';
import { auditEvents } from '../schema/audit-events.js';

export interface AuditEventRecord {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly eventType: string;
  readonly actorId: string | null;
  readonly data: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

function mapAuditEventRow(row: typeof auditEvents.$inferSelect): AuditEventRecord {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    eventType: row.eventType,
    actorId: row.actorId,
    data: row.data,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listRecentAuditEvents(
  db: DatabaseClient,
  limit = 20,
): Promise<AuditEventRecord[]> {
  const rows = await db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit);

  return rows.map(mapAuditEventRow);
}
