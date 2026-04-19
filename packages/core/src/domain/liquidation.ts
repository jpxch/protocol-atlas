import type { ChainKey } from './chain.js';

export type LiquidationPlanStatus = 'planned' | 'blocked' | 'stale';
export type LiquidationPlanConfidence = 'low' | 'medium' | 'high';

export interface LiquidationPlanRecord {
  readonly id: string;
  readonly candidateOpportunityId: string;
  readonly scannerKey: string;
  readonly chain: ChainKey;
  readonly protocolKey: string;
  readonly userAddress: string;
  readonly debtAsset: string | null;
  readonly debtSymbol: string | null;
  readonly collateralAsset: string | null;
  readonly collateralSymbol: string | null;
  readonly debtToCover: string | null;
  readonly debtToCoverUsd: string | null;
  readonly estimatedCollateralSeized: string | null;
  readonly estimatedCollateralSeizedUsd: string | null;
  readonly liquidationBonusBps: number | null;
  readonly flashloanPremiumBps: number | null;
  readonly gasCostUsd: string | null;
  readonly priorityFeeUsd: string | null;
  readonly slippageBps: number | null;
  readonly netProfitUsd: string | null;
  readonly confidence: LiquidationPlanConfidence;
  readonly status: LiquidationPlanStatus;
  readonly reason: string;
  readonly blockNumber: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
