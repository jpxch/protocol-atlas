import { index, jsonb, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type {
  ChainKey,
  FreshnessState,
  OpportunityKind,
  OpportunityStatus,
  RiskLevel,
} from '@protocol-atlas/core';

export const opportunities = pgTable(
  'opportunities',
  {
    id: text('id').primaryKey(),
    scannerKey: text('scanner_key').notNull(),
    dedupeKey: text('dedupe_key').notNull(),
    chain: text('chain').$type<ChainKey>().notNull(),
    protocolKey: text('protocol_key').notNull(),
    title: text('title').notNull(),
    kind: text('kind').$type<OpportunityKind>().notNull(),
    status: text('status').$type<OpportunityStatus>().notNull(),
    freshness: text('freshness').$type<FreshnessState>().notNull(),
    riskLevel: text('risk_level').$type<RiskLevel>().notNull(),
    targetAddress: text('target_address'),
    grossUsd: numeric('gross_usd', { precision: 20, scale: 8 }),
    netUsd: numeric('net_usd', { precision: 20, scale: 8 }),
    gasCostUsd: numeric('gas_cost_usd', { precision: 20, scale: 8 }),
    payload: jsonb('payload').$type<Readonly<Record<string, unknown>>>().notNull(),
    discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    opportunitiesChainIdx: index('opportunities_chain_idx').on(table.chain),
    opportunitiesProtocolIdx: index('opportunities_protocol_idx').on(table.protocolKey),
    opportunitiesStatusIdx: index('opportunities_status_idx').on(table.status),
    opportunitiesUpdatedAtIdx: index('opportunities_updated_at_idx').on(table.updatedAt),
  }),
);
