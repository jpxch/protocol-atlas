import { and, desc, eq } from 'drizzle-orm';
import type { ChainKey } from '@protocol-atlas/core';
import type { DatabaseClient } from '../client.js';
import { scanRuns } from '../schema/scan-runs.js';

export type ScanRunStatus = 'started' | 'completed' | 'failed';

export interface ScanRunRecord {
  readonly id: string;
  readonly scannerKey: string;
  readonly protocolKey: string;
  readonly chain: ChainKey;
  readonly status: ScanRunStatus;
  readonly opportunitiesFound: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface CreateScanRunInput {
  readonly id: string;
  readonly scannerKey: string;
  readonly protocolKey: string;
  readonly chain: ChainKey;
  readonly startedAt: string;
}

export interface CompleteScanRunInput {
  readonly id: string;
  readonly status: 'completed' | 'failed';
  readonly opportunitiesFound: number;
  readonly completedAt: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ListRecentScanRunsInput {
  readonly chain?: ChainKey;
  readonly protocolKey?: string;
  readonly scannerKey?: string;
  readonly status?: ScanRunStatus;
  readonly limit?: number;
}

function mapScanRunRow(row: typeof scanRuns.$inferSelect): ScanRunRecord {
  return {
    id: row.id,
    scannerKey: row.scannerKey,
    protocolKey: row.protocolKey,
    chain: row.chain,
    status: row.status,
    opportunitiesFound: row.opportunitiesFound,
    metadata: row.metadata ?? {},
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

function buildWhereClause(input: ListRecentScanRunsInput) {
  const conditions = [];

  if (input.chain) {
    conditions.push(eq(scanRuns.chain, input.chain));
  }

  if (input.protocolKey) {
    conditions.push(eq(scanRuns.protocolKey, input.protocolKey));
  }

  if (input.scannerKey) {
    conditions.push(eq(scanRuns.scannerKey, input.scannerKey));
  }

  if (input.status) {
    conditions.push(eq(scanRuns.status, input.status));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

export async function createScanRun(db: DatabaseClient, input: CreateScanRunInput): Promise<void> {
  await db.insert(scanRuns).values({
    id: input.id,
    scannerKey: input.scannerKey,
    protocolKey: input.protocolKey,
    chain: input.chain,
    status: 'started',
    opportunitiesFound: 0,
    metadata: {},
    startedAt: new Date(input.startedAt),
    completedAt: null,
  });
}

export async function completeScanRun(
  db: DatabaseClient,
  input: CompleteScanRunInput,
): Promise<void> {
  await db
    .update(scanRuns)
    .set({
      status: input.status,
      opportunitiesFound: input.opportunitiesFound,
      metadata: input.metadata ?? {},
      completedAt: new Date(input.completedAt),
    })
    .where(eq(scanRuns.id, input.id));
}

export async function listRecentScanRuns(
  db: DatabaseClient,
  input: ListRecentScanRunsInput = {},
): Promise<ScanRunRecord[]> {
  const whereClause = buildWhereClause(input);
  const limit = input.limit ?? 20;

  const rows = whereClause
    ? await db
        .select()
        .from(scanRuns)
        .where(whereClause)
        .orderBy(desc(scanRuns.startedAt))
        .limit(limit)
    : await db.select().from(scanRuns).orderBy(desc(scanRuns.startedAt)).limit(limit);

  return rows.map(mapScanRunRow);
}
