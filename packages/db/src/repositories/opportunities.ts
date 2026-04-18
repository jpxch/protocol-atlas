import { desc } from 'drizzle-orm';
import type { OpportunityRecord } from '@protocol-atlas/core';
import type { DatabaseClient } from '../client.js';
import { opportunities } from '../schema/opportunities.js';

function mapOpportunityRow(row: typeof opportunities.$inferSelect): OpportunityRecord {
  return {
    id: row.id,
    scannerKey: row.scannerKey,
    dedupeKey: row.dedupeKey,
    chain: row.chain,
    protocolKey: row.protocolKey,
    title: row.title,
    kind: row.kind,
    status: row.status,
    freshness: row.freshness,
    riskLevel: row.riskLevel,
    targetAddress: row.targetAddress,
    money: {
      grossUsd: row.grossUsd,
      netUsd: row.netUsd,
      gasCostUsd: row.gasCostUsd,
    },
    discoveredAt: row.discoveredAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    payload: row.payload,
  };
}

export async function listOpportunities(db: DatabaseClient): Promise<OpportunityRecord[]> {
  const rows = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.updatedAt))
    .limit(100);

  return rows.map(mapOpportunityRow);
}
