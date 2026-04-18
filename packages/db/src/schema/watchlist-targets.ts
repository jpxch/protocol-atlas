import { boolean, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { ChainKey } from '@protocol-atlas/core';

export const watchlistTargets = pgTable(
  'watchlist_targets',
  {
    id: text('id').primaryKey(),
    chain: text('chain').$type<ChainKey>().notNull(),
    protocolKey: text('protocol_key').notNull(),
    targetAddress: text('target_address').notNull(),
    source: text('source').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata').$type<Readonly<Record<string, unknown>>>().notNull(),
  },
  (table) => ({
    watchlistTargetsChainIdx: index('watchlist_targets_chain_idx').on(table.chain),
    watchlistTargetsProtocolIdx: index('watchlist_targets_protocol_idx').on(table.protocolKey),
    watchlistTargetsAddressIdx: index('watchlist_targets_address_idx').on(table.targetAddress),
  }),
);
