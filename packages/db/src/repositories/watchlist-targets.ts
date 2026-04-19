import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import type { ChainKey } from '@protocol-atlas/core';
import type { DatabaseClient } from '../client.js';
import { watchlistTargets } from '../schema/watchlist-targets.js';

export interface WatchlistTargetRecord {
  readonly id: string;
  readonly chain: ChainKey;
  readonly protocolKey: string;
  readonly targetAddress: string;
  readonly source: string;
  readonly isActive: boolean;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface UpsertWatchlistTargetInput {
  readonly id: string;
  readonly chain: ChainKey;
  readonly protocolKey: string;
  readonly targetAddress: string;
  readonly source: string;
  readonly observedAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ListWatchlistTargetsInput {
  readonly chain?: ChainKey;
  readonly protocolKey?: string;
  readonly source?: string;
  readonly isActive?: boolean;
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListWatchlistTargetsResult {
  readonly items: WatchlistTargetRecord[];
  readonly count: number;
}

function mapWatchlistRow(row: typeof watchlistTargets.$inferSelect): WatchlistTargetRecord {
  return {
    id: row.id,
    chain: row.chain,
    protocolKey: row.protocolKey,
    targetAddress: row.targetAddress,
    source: row.source,
    isActive: row.isActive,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    metadata: row.metadata,
  };
}

function buildWhereClause(input: ListWatchlistTargetsInput) {
  const conditions = [];

  if (input.chain) {
    conditions.push(eq(watchlistTargets.chain, input.chain));
  }

  if (input.protocolKey) {
    conditions.push(eq(watchlistTargets.protocolKey, input.protocolKey));
  }

  if (input.source) {
    conditions.push(eq(watchlistTargets.source, input.source));
  }

  if (typeof input.isActive === 'boolean') {
    conditions.push(eq(watchlistTargets.isActive, input.isActive));
  }

  const normalizedSearch = input.search?.trim();

  if (normalizedSearch) {
    conditions.push(ilike(watchlistTargets.targetAddress, `%${normalizedSearch}%`));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

export async function upsertWatchlistTarget(
  db: DatabaseClient,
  input: UpsertWatchlistTargetInput,
): Promise<void> {
  const observedAt = new Date(input.observedAt);

  await db
    .insert(watchlistTargets)
    .values({
      id: input.id,
      chain: input.chain,
      protocolKey: input.protocolKey,
      targetAddress: input.targetAddress,
      source: input.source,
      isActive: true,
      firstSeenAt: observedAt,
      lastSeenAt: observedAt,
      metadata: input.metadata,
    })
    .onConflictDoUpdate({
      target: watchlistTargets.id,
      set: {
        isActive: true,
        lastSeenAt: observedAt,
        metadata: input.metadata,
      },
    });
}

export async function listWatchlistTargets(
  db: DatabaseClient,
  input: ListWatchlistTargetsInput = {},
): Promise<ListWatchlistTargetsResult> {
  const whereClause = buildWhereClause(input);
  const limit = input.limit ?? 100;
  const offset = input.offset ?? 0;

  const rows = whereClause
    ? await db
        .select()
        .from(watchlistTargets)
        .where(whereClause)
        .orderBy(desc(watchlistTargets.lastSeenAt))
        .limit(limit)
        .offset(offset)
    : await db
        .select()
        .from(watchlistTargets)
        .orderBy(desc(watchlistTargets.lastSeenAt))
        .limit(limit)
        .offset(offset);

  const countRows = whereClause
    ? await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(watchlistTargets)
        .where(whereClause)
    : await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(watchlistTargets);

  return {
    items: rows.map(mapWatchlistRow),
    count: countRows[0]?.count ?? 0,
  };
}

export async function listActiveWatchlistTargets(
  db: DatabaseClient,
  input: {
    readonly chain: ChainKey;
    readonly protocolKey: string;
    readonly limit?: number;
  },
): Promise<WatchlistTargetRecord[]> {
  const result = await listWatchlistTargets(db, {
    chain: input.chain,
    protocolKey: input.protocolKey,
    isActive: true,
    limit: input.limit ?? 5000,
    offset: 0,
  });

  return result.items;
}
