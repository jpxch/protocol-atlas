export type OpportunityStatus = 'ready' | 'review' | 'blocked' | 'simulating' | 'stale';

export type OpportunityAction = 'rescan' | 'refresh-review' | 'simulate' | 'approve' | 'skip';

export interface OpportunityRecord {
  readonly id: string;
  readonly title: string;
  readonly chain: 'Ethereum' | 'Arbitrum' | 'Optimism' | 'Base' | 'Polygon';
  readonly protocol: string;
  readonly kind: 'liquidation' | 'reward' | 'fee-collection' | 'market';
  readonly grossUsd: number;
  readonly netUsd: number;
  readonly status: OpportunityStatus;
  readonly freshness: 'fresh' | 'aging' | 'stale';
  readonly updatedAtLabel: string;
  readonly riskLabel: 'Low' | 'Medium' | 'High';
}

export const mockOpportunities: readonly OpportunityRecord[] = [
  {
    id: 'opp_arb_aave_001',
    title: 'Aave V3 liquidation window',
    chain: 'Arbitrum',
    protocol: 'Aave',
    kind: 'liquidation',
    grossUsd: 842.19,
    netUsd: 691.32,
    status: 'ready',
    freshness: 'fresh',
    updatedAtLabel: '2m ago',
    riskLabel: 'Medium',
  },
  {
    id: 'opp_base_velo_002',
    title: 'Unclaimed rewards batch',
    chain: 'Base',
    protocol: 'Velodrome',
    kind: 'reward',
    grossUsd: 191.44,
    netUsd: 168.11,
    status: 'review',
    freshness: 'fresh',
    updatedAtLabel: '4m ago',
    riskLabel: 'Low',
  },
  {
    id: 'opp_op_uni_003',
    title: 'Stale fee collection',
    chain: 'Optimism',
    protocol: 'Uniswap V3',
    kind: 'fee-collection',
    grossUsd: 74.08,
    netUsd: 41.73,
    status: 'blocked',
    freshness: 'stale',
    updatedAtLabel: '19m ago',
    riskLabel: 'High',
  },
  {
    id: 'opp_eth_morpho_004',
    title: 'Morpho reward claim surface',
    chain: 'Ethereum',
    protocol: 'Morpho',
    kind: 'reward',
    grossUsd: 318.22,
    netUsd: 287.54,
    status: 'simulating',
    freshness: 'aging',
    updatedAtLabel: '7m ago',
    riskLabel: 'Medium',
  },
  {
    id: 'opp_poly_qs_005',
    title: 'QuickSwap fee sweep',
    chain: 'Polygon',
    protocol: 'QuickSwap',
    kind: 'fee-collection',
    grossUsd: 129.87,
    netUsd: 103.68,
    status: 'review',
    freshness: 'aging',
    updatedAtLabel: '11m ago',
    riskLabel: 'Low',
  },
  {
    id: 'opp_base_mkt_006',
    title: 'Market inefficiency pocket',
    chain: 'Base',
    protocol: 'Aerodrome',
    kind: 'market',
    grossUsd: 566.9,
    netUsd: 472.04,
    status: 'ready',
    freshness: 'fresh',
    updatedAtLabel: '1m ago',
    riskLabel: 'High',
  },
] as const;
