import { and, desc, eq } from 'drizzle-orm';
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

export async function listActiveWatchlistTargets(
  db: DatabaseClient,
  input: {
    readonly chain: ChainKey;
    readonly protocolKey: string;
    readonly limit?: number;
  },
): Promise<WatchlistTargetRecord[]> {
  const rows = await db
    .select()
    .from(watchlistTargets)
    .where(
      and(
        eq(watchlistTargets.chain, input.chain),
        eq(watchlistTargets.protocolKey, input.protocolKey),
        eq(watchlistTargets.isActive, true),
      ),
    )
    .orderBy(desc(watchlistTargets.lastSeenAt))
    .limit(input.limit ?? 5000);

  return rows.map(mapWatchlistRow);
}
