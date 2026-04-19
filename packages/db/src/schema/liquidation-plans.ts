import { index, integer, jsonb, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type {
  ChainKey,
  LiquidationPlanConfidence,
  LiquidationPlanStatus,
} from '@protocol-atlas/core';

export const liquidationPlans = pgTable(
  'liquidation_plans',
  {
    id: text('id').primaryKey(),
    candidateOpportunityId: text('candidate_opportunity_id').notNull(),
    scannerKey: text('scanner_key').notNull(),
    chain: text('chain').$type<ChainKey>().notNull(),
    protocolKey: text('protocol_key').notNull(),
    userAddress: text('user_address').notNull(),
    debtAsset: text('debt_asset'),
    debtSymbol: text('debt_symbol'),
    collateralAsset: text('collateral_asset'),
    collateralSymbol: text('collateral_symbol'),
    debtToCover: numeric('debt_to_cover', { precision: 78, scale: 0 }),
    debtToCoverUsd: numeric('debt_to_cover_usd', { precision: 20, scale: 8 }),
    estimatedCollateralSeized: numeric('estimated_collateral_seized', {
      precision: 78,
      scale: 0,
    }),
    estimatedCollateralSeizedUsd: numeric('estimated_collateral_seized_usd', {
      precision: 20,
      scale: 8,
    }),
    liquidationBonusBps: integer('liquidation_bonus_bps'),
    flashloanPremiumBps: integer('flashloan_premium_bps'),
    gasCostUsd: numeric('gas_cost_usd', { precision: 20, scale: 8 }),
    priorityFeeUsd: numeric('priority_fee_usd', { precision: 20, scale: 8 }),
    slippageBps: integer('slippage_bps'),
    netProfitUsd: numeric('net_profit_usd', { precision: 20, scale: 8 }),
    confidence: text('confidence').$type<LiquidationPlanConfidence>().notNull(),
    status: text('status').$type<LiquidationPlanStatus>().notNull(),
    reason: text('reason').notNull(),
    blockNumber: text('block_number'),
    payload: jsonb('payload').$type<Readonly<Record<string, unknown>>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    liquidationPlansCandidateIdx: index('liquidation_plans_candidate_idx').on(
      table.candidateOpportunityId,
    ),
    liquidationPlansChainIdx: index('liquidation_plans_chain_idx').on(table.chain),
    liquidationPlansStatusIdx: index('liquidation_plans_status_idx').on(table.status),
    liquidationPlansUpdatedAtIdx: index('liquidation_plans_updated_at_idx').on(table.updatedAt),
  }),
);
