import type { ChainKey } from './chain.js';

export type OpportunityKind =
  | 'liquidation'
  | 'reward'
  | 'fee-collection'
  | 'market-inefficiency'
  | 'other';

export type OpportunityStatus =
  | 'discovered'
  | 'review-pending'
  | 'simulating'
  | 'approved'
  | 'skipped'
  | 'blocked'
  | 'expired'
  | 'executed'
  | 'failed';

export type FreshnessState = 'fresh' | 'aging' | 'stale';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface OpportunityMoney {
  readonly grossUsd: string | null;
  readonly netUsd: string | null;
  readonly gasCostUsd: string | null;
}

export interface OpportunityRecord {
  readonly id: string;
  readonly scannerKey: string;
  readonly dedupeKey: string;
  readonly chain: ChainKey;
  readonly protocolKey: string;
  readonly title: string;
  readonly kind: OpportunityKind;
  readonly status: OpportunityStatus;
  readonly freshness: FreshnessState;
  readonly riskLevel: RiskLevel;
  readonly targetAddress: string | null;
  readonly money: OpportunityMoney;
  readonly discoveredAt: string;
  readonly updatedAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
