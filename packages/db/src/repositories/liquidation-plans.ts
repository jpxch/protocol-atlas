import { and, desc, eq } from 'drizzle-orm';
import type { ChainKey, LiquidationPlanRecord, LiquidationPlanStatus } from '@protocol-atlas/core';
import type { DatabaseClient } from '../client.js';
import { liquidationPlans } from '../schema/liquidation-plans.js';

export interface ListLiquidationPlansInput {
  readonly chain?: ChainKey;
  readonly protocolKey?: string;
  readonly status?: LiquidationPlanStatus;
  readonly candidateOpportunityId?: string;
  readonly limit?: number;
}

function mapLiquidationPlanRow(row: typeof liquidationPlans.$inferSelect): LiquidationPlanRecord {
  return {
    id: row.id,
    candidateOpportunityId: row.candidateOpportunityId,
    scannerKey: row.scannerKey,
    chain: row.chain,
    protocolKey: row.protocolKey,
    userAddress: row.userAddress,
    debtAsset: row.debtAsset,
    debtSymbol: row.debtSymbol,
    collateralAsset: row.collateralAsset,
    collateralSymbol: row.collateralSymbol,
    debtToCover: row.debtToCover,
    debtToCoverUsd: row.debtToCoverUsd,
    estimatedCollateralSeized: row.estimatedCollateralSeized,
    estimatedCollateralSeizedUsd: row.estimatedCollateralSeizedUsd,
    liquidationBonusBps: row.liquidationBonusBps,
    flashloanPremiumBps: row.flashloanPremiumBps,
    gasCostUsd: row.gasCostUsd,
    priorityFeeUsd: row.priorityFeeUsd,
    slippageBps: row.slippageBps,
    netProfitUsd: row.netProfitUsd,
    confidence: row.confidence,
    status: row.status,
    reason: row.reason,
    blockNumber: row.blockNumber,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toLiquidationPlanInsertValues(record: LiquidationPlanRecord) {
  return {
    id: record.id,
    candidateOpportunityId: record.candidateOpportunityId,
    scannerKey: record.scannerKey,
    chain: record.chain,
    protocolKey: record.protocolKey,
    userAddress: record.userAddress,
    debtAsset: record.debtAsset,
    debtSymbol: record.debtSymbol,
    collateralAsset: record.collateralAsset,
    collateralSymbol: record.collateralSymbol,
    debtToCover: record.debtToCover,
    debtToCoverUsd: record.debtToCoverUsd,
    estimatedCollateralSeized: record.estimatedCollateralSeized,
    estimatedCollateralSeizedUsd: record.estimatedCollateralSeizedUsd,
    liquidationBonusBps: record.liquidationBonusBps,
    flashloanPremiumBps: record.flashloanPremiumBps,
    gasCostUsd: record.gasCostUsd,
    priorityFeeUsd: record.priorityFeeUsd,
    slippageBps: record.slippageBps,
    netProfitUsd: record.netProfitUsd,
    confidence: record.confidence,
    status: record.status,
    reason: record.reason,
    blockNumber: record.blockNumber,
    payload: record.payload,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

function buildWhereClause(input: ListLiquidationPlansInput) {
  const conditions = [];

  if (input.chain) {
    conditions.push(eq(liquidationPlans.chain, input.chain));
  }

  if (input.protocolKey) {
    conditions.push(eq(liquidationPlans.protocolKey, input.protocolKey));
  }

  if (input.status) {
    conditions.push(eq(liquidationPlans.status, input.status));
  }

  if (input.candidateOpportunityId) {
    conditions.push(eq(liquidationPlans.candidateOpportunityId, input.candidateOpportunityId));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
}

export async function upsertLiquidationPlan(
  db: DatabaseClient,
  record: LiquidationPlanRecord,
): Promise<void> {
  const values = toLiquidationPlanInsertValues(record);

  await db
    .insert(liquidationPlans)
    .values(values)
    .onConflictDoUpdate({
      target: liquidationPlans.id,
      set: {
        candidateOpportunityId: values.candidateOpportunityId,
        scannerKey: values.scannerKey,
        chain: values.chain,
        protocolKey: values.protocolKey,
        userAddress: values.userAddress,
        debtAsset: values.debtAsset,
        debtSymbol: values.debtSymbol,
        collateralAsset: values.collateralAsset,
        collateralSymbol: values.collateralSymbol,
        debtToCover: values.debtToCover,
        debtToCoverUsd: values.debtToCoverUsd,
        estimatedCollateralSeized: values.estimatedCollateralSeized,
        estimatedCollateralSeizedUsd: values.estimatedCollateralSeizedUsd,
        liquidationBonusBps: values.liquidationBonusBps,
        flashloanPremiumBps: values.flashloanPremiumBps,
        gasCostUsd: values.gasCostUsd,
        priorityFeeUsd: values.priorityFeeUsd,
        slippageBps: values.slippageBps,
        netProfitUsd: values.netProfitUsd,
        confidence: values.confidence,
        status: values.status,
        reason: values.reason,
        blockNumber: values.blockNumber,
        payload: values.payload,
        updatedAt: values.updatedAt,
      },
    });
}

export async function listLiquidationPlans(
  db: DatabaseClient,
  input: ListLiquidationPlansInput = {},
): Promise<LiquidationPlanRecord[]> {
  const whereClause = buildWhereClause(input);
  const limit = input.limit ?? 100;

  const rows = whereClause
    ? await db
        .select()
        .from(liquidationPlans)
        .where(whereClause)
        .orderBy(desc(liquidationPlans.updatedAt))
        .limit(limit)
    : await db.select().from(liquidationPlans).orderBy(desc(liquidationPlans.updatedAt)).limit(limit);

  return rows.map(mapLiquidationPlanRow);
}
