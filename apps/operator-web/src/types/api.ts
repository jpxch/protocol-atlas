export type ApiOpportunityStatus =
  | 'discovered'
  | 'review-pending'
  | 'simulating'
  | 'approved'
  | 'skipped'
  | 'blocked'
  | 'expired'
  | 'executed'
  | 'failed';

export type ApiFreshnessState = 'fresh' | 'aging' | 'stale';
export type ApiRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApiChainKey = 'ethereum' | 'arbitrum' | 'optimism' | 'base' | 'polygon';
export type ApiScanRunStatus = 'started' | 'completed' | 'failed';
export type ApiOpportunitySignal = 'actionable' | 'watch-close' | 'low-margin';
export type ApiLiquidationPlanStatus = 'planned' | 'blocked' | 'stale';
export type ApiLiquidationPlanConfidence = 'low' | 'medium' | 'high';

export interface ApiOpportunityRecord {
  readonly id: string;
  readonly scannerKey: string;
  readonly dedupeKey: string;
  readonly chain: ApiChainKey;
  readonly protocolKey: string;
  readonly title: string;
  readonly kind: 'liquidation' | 'reward' | 'fee-collection' | 'market-inefficiency' | 'other';
  readonly status: ApiOpportunityStatus;
  readonly freshness: ApiFreshnessState;
  readonly riskLevel: ApiRiskLevel;
  readonly targetAddress: string | null;
  readonly money: {
    readonly grossUsd: string | null;
    readonly netUsd: string | null;
    readonly gasCostUsd: string | null;
  };
  readonly discoveredAt: string;
  readonly updatedAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface OpportunitiesResponse {
  readonly items: ApiOpportunityRecord[];
  readonly count: number;
}

export interface LiquidationCandidatesResponse {
  readonly items: ApiOpportunityRecord[];
  readonly count: number;
  readonly filters: {
    readonly chain: ApiChainKey | null;
    readonly protocolKey: string | null;
    readonly status: ApiOpportunityStatus | null;
    readonly riskLevel: ApiRiskLevel | null;
    readonly signal: ApiOpportunitySignal | null;
  };
}

export interface ApiLiquidationPlanRecord {
  readonly id: string;
  readonly candidateOpportunityId: string;
  readonly scannerKey: string;
  readonly chain: ApiChainKey;
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
  readonly confidence: ApiLiquidationPlanConfidence;
  readonly status: ApiLiquidationPlanStatus;
  readonly reason: string;
  readonly blockNumber: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LiquidationPlansResponse {
  readonly items: ApiLiquidationPlanRecord[];
  readonly count: number;
  readonly filters: {
    readonly chain: ApiChainKey | null;
    readonly protocolKey: string | null;
    readonly status: ApiLiquidationPlanStatus | null;
    readonly candidateOpportunityId: string | null;
  };
}

export interface ApiAuditEventRecord {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly eventType: string;
  readonly actorId: string | null;
  readonly data: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface AuditEventsResponse {
  readonly items: ApiAuditEventRecord[];
  readonly count: number;
}

export interface ApiWatchlistTargetRecord {
  readonly id: string;
  readonly chain: ApiChainKey;
  readonly protocolKey: string;
  readonly targetAddress: string;
  readonly source: string;
  readonly isActive: boolean;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface WatchlistTargetsResponse {
  readonly items: ApiWatchlistTargetRecord[];
  readonly count: number;
  readonly pagination: {
    readonly limit: number;
    readonly offset: number;
    readonly returned: number;
  };
  readonly filters: {
    readonly chain: ApiChainKey | null;
    readonly protocolKey: string | null;
    readonly source: string | null;
    readonly isActive: boolean | null;
    readonly search: string | null;
  };
}

export interface ApiScanRunRecord {
  readonly id: string;
  readonly scannerKey: string;
  readonly protocolKey: string;
  readonly chain: ApiChainKey;
  readonly status: ApiScanRunStatus;
  readonly opportunitiesFound: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface ScanRunsResponse {
  readonly items: ApiScanRunRecord[];
  readonly count: number;
  readonly filters: {
    readonly chain: ApiChainKey | null;
    readonly protocolKey: string | null;
    readonly scannerKey: string | null;
    readonly status: ApiScanRunStatus | null;
  };
}

export type OperatorActionType = 'rescan' | 'refresh-review' | 'simulate' | 'approve' | 'skip';

export interface OperatorActionRequest {
  readonly opportunityId: string;
  readonly actionType: OperatorActionType;
  readonly requestedBy: string;
  readonly note?: string;
}

export interface OperatorActionResponse {
  readonly status: 'requested';
  readonly data: {
    readonly id: string;
    readonly opportunityId: string;
    readonly actionType: OperatorActionType;
    readonly requestedBy: string;
    readonly status: 'requested' | 'accepted' | 'completed' | 'failed';
    readonly createdAt: string;
  };
}
