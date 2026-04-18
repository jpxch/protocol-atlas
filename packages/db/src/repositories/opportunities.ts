import { and, desc, eq } from 'drizzle-orm';
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

function toOpportunityInsertValues(record: OpportunityRecord) {
  return {
    id: record.id,
    scannerKey: record.scannerKey,
    dedupeKey: record.dedupeKey,
    chain: record.chain,
    protocolKey: record.protocolKey,
    title: record.title,
    kind: record.kind,
    status: record.status,
    freshness: record.freshness,
    riskLevel: record.riskLevel,
    targetAddress: record.targetAddress,
    grossUsd: record.money.grossUsd,
    netUsd: record.money.netUsd,
    gasCostUsd: record.money.gasCostUsd,
    payload: record.payload,
    discoveredAt: new Date(record.discoveredAt),
    updatedAt: new Date(record.updatedAt),
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

export async function upsertOpportunity(
  db: DatabaseClient,
  record: OpportunityRecord,
): Promise<void> {
  const values = toOpportunityInsertValues(record);

  await db
    .insert(opportunities)
    .values(values)
    .onConflictDoUpdate({
      target: opportunities.id,
      set: {
        scannerKey: values.scannerKey,
        dedupeKey: values.dedupeKey,
        chain: values.chain,
        protocolKey: values.protocolKey,
        title: values.title,
        kind: values.kind,
        status: values.status,
        freshness: values.freshness,
        riskLevel: values.riskLevel,
        targetAddress: values.targetAddress,
        grossUsd: values.grossUsd,
        netUsd: values.netUsd,
        gasCostUsd: values.gasCostUsd,
        payload: values.payload,
        discoveredAt: values.discoveredAt,
        updatedAt: values.updatedAt,
      },
    });
}

export async function expireScannerOpportunities(
  db: DatabaseClient,
  input: {
    readonly scannerKey: string;
    readonly protocolKey: string;
    readonly chain: OpportunityRecord['chain'];
  },
): Promise<void> {
  await db
    .update(opportunities)
    .set({
      status: 'expired',
      freshness: 'stale',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(opportunities.scannerKey, input.scannerKey),
        eq(opportunities.protocolKey, input.protocolKey),
        eq(opportunities.chain, input.chain),
      ),
    );
}
