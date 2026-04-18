import type { ChainKey } from '../domain/chain.js';

export type BlockTag = bigint | 'latest' | 'safe' | 'finalized';

export interface RpcBlockRef {
  readonly number: bigint;
  readonly hash: string;
  readonly timestamp: number;
}

export interface ContractCallRequest {
  readonly to: string;
  readonly data: `0x${string}`;
  readonly blockTag?: BlockTag;
}

export interface ContractCallResult {
  readonly chain: ChainKey;
  readonly block: RpcBlockRef;
  readonly data: `0x${string}`;
}

export interface RpcProviderPort {
  getBlock(chain: ChainKey, blockTag?: BlockTag): Promise<RpcBlockRef>;
  call(chain: ChainKey, request: ContractCallRequest): Promise<ContractCallResult>;
}
