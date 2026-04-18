export type ChainKey = 'ethereum' | 'arbitrum' | 'optimism' | 'base' | 'polygon';

export interface ChainDefinition {
  readonly key: ChainKey;
  readonly chainId: number;
  readonly displayName: string;
  readonly nativeSymbol: string;
  readonly rpcEnvVar: string;
}

export const CHAINS: readonly ChainDefinition[] = [
  {
    key: 'ethereum',
    chainId: 1,
    displayName: 'Ethereum',
    nativeSymbol: 'ETH',
    rpcEnvVar: 'ETHEREUM_RPC_URL',
  },
  {
    key: 'arbitrum',
    chainId: 42161,
    displayName: 'Arbitrum',
    nativeSymbol: 'ETH',
    rpcEnvVar: 'ARBITRUM_RPC_URL',
  },
  {
    key: 'optimism',
    chainId: 10,
    displayName: 'Optimism',
    nativeSymbol: 'ETH',
    rpcEnvVar: 'OPTIMISM_RPC_URL',
  },
  {
    key: 'base',
    chainId: 8453,
    displayName: 'Base',
    nativeSymbol: 'ETH',
    rpcEnvVar: 'BASE_RPC_URL',
  },
  {
    key: 'polygon',
    chainId: 137,
    displayName: 'Polygon',
    nativeSymbol: 'POL',
    rpcEnvVar: 'POLYGON_RPC_URL',
  },
] as const;

export const CHAIN_KEYS = CHAINS.map((chain) => chain.key) as readonly ChainKey[];
