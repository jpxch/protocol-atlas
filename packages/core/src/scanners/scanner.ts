import type { ChainKey } from '../domain/chain.js';
import type { OpportunityRecord } from '../domain/opportunity.js';
import type { RpcProviderPort } from '../providers/provider.js';

export interface ScanClock {
  now(): Date;
}

export interface ProtocolScannerContext {
  readonly chain: ChainKey;
  readonly provider: RpcProviderPort;
  readonly clock: ScanClock;
  readonly runId: string;
}

export interface ScanRunResult {
  readonly scannerKey: string;
  readonly protocolKey: string;
  readonly chain: ChainKey;
  readonly opportunities: readonly OpportunityRecord[];
  readonly startedAt: string;
  readonly completedAt: string;
}

export interface ProtocolScanner {
  readonly scannerKey: string;
  readonly protocolKey: string;
  supports(chain: ChainKey): boolean;
  scan(context: ProtocolScannerContext): Promise<ScanRunResult>;
}
