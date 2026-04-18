import { createPublicClient, http } from 'viem';
import type { Address } from 'viem';
import type { OpportunityRecord, RiskLevel } from '@protocol-atlas/core';
import {
  completeScanRun,
  createDatabaseClient,
  createScanRun,
  expireScannerOpportunities,
  upsertOpportunity,
} from '@protocol-atlas/db';
import type { ScannerEnv } from '../env.js';

const AAVE_V3_POOL_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getUserAccountData',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
  },
] as const;

const SCANNER_KEY = 'aave-v3-watchlist';
const PROTOCOL_KEY = 'aave-v3';
const CHAIN_KEY = 'arbitrum';

function formatHealthFactor(value: bigint): number {
  return Number(value) / 1e18;
}

function toRiskLevel(healthFactor: number): RiskLevel {
  if (healthFactor < 0.95) {
    return 'critical';
  }

  if (healthFactor < 1) {
    return 'high';
  }

  if (healthFactor < 1.05) {
    return 'medium';
  }

  return 'low';
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function buildOpportunityRecord(input: {
  readonly user: Address;
  readonly healthFactorRaw: bigint;
  readonly totalCollateralBase: bigint;
  readonly totalDebtBase: bigint;
  readonly availableBorrowsBase: bigint;
  readonly currentLiquidationThreshold: bigint;
  readonly ltv: bigint;
  readonly observedAt: string;
}): OpportunityRecord {
  const healthFactor = formatHealthFactor(input.healthFactorRaw);
  const id = `aave-v3:arbitrum:liquidation:${input.user.toLowerCase()}`;

  return {
    id,
    scannerKey: SCANNER_KEY,
    dedupeKey: id,
    chain: CHAIN_KEY,
    protocolKey: PROTOCOL_KEY,
    title: `Aave V3 liquidation candidate ${shortAddress(input.user)}`,
    kind: 'liquidation',
    status: 'discovered',
    freshness: 'fresh',
    riskLevel: toRiskLevel(healthFactor),
    targetAddress: input.user,
    money: {
      grossUsd: null,
      netUsd: null,
      gasCostUsd: null,
    },
    discoveredAt: input.observedAt,
    updatedAt: input.observedAt,
    payload: {
      watchTarget: input.user,
      accountData: {
        totalCollateralBase: input.totalCollateralBase.toString(),
        totalDebtBase: input.totalDebtBase.toString(),
        availableBorrowsBase: input.availableBorrowsBase.toString(),
        currentLiquidationThreshold: input.currentLiquidationThreshold.toString(),
        ltv: input.ltv.toString(),
        healthFactorRaw: input.healthFactorRaw.toString(),
        healthFactorFormatted: healthFactor,
      },
      normalization: {
        grossUsd: null,
        netUsd: null,
        reason:
          'Aave account data is persisted raw first. Explicit USD normalization will be added in a later slice.',
      },
    },
  };
}

export async function runAaveV3HealthFactorWatchScanner(env: ScannerEnv): Promise<void> {
  const db = createDatabaseClient({
    databaseUrl: env.databaseUrl,
  });

  const publicClient = createPublicClient({
    transport: http(env.arbitrumRpcUrl),
  });

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  await createScanRun(db, {
    id: runId,
    scannerKey: SCANNER_KEY,
    protocolKey: PROTOCOL_KEY,
    chain: CHAIN_KEY,
    startedAt,
  });

  try {
    await expireScannerOpportunities(db, {
      scannerKey: SCANNER_KEY,
      protocolKey: PROTOCOL_KEY,
      chain: CHAIN_KEY,
    });

    const opportunities: OpportunityRecord[] = [];

    for (const user of env.aaveV3Watchlist) {
      const result = await publicClient.readContract({
        address: env.aaveV3ArbitrumPoolAddress,
        abi: AAVE_V3_POOL_ABI,
        functionName: 'getUserAccountData',
        args: [user],
      });

      const [
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactorRaw,
      ] = result;

      const healthFactor = formatHealthFactor(healthFactorRaw);

      if (totalDebtBase === 0n) {
        continue;
      }

      if (healthFactor >= env.aaveV3HealthFactorThreshold) {
        continue;
      }

      const observedAt = new Date().toISOString();

      opportunities.push(
        buildOpportunityRecord({
          user,
          healthFactorRaw,
          totalCollateralBase,
          totalDebtBase,
          availableBorrowsBase,
          currentLiquidationThreshold,
          ltv,
          observedAt,
        }),
      );
    }

    for (const opportunity of opportunities) {
      await upsertOpportunity(db, opportunity);
    }

    await completeScanRun(db, {
      id: runId,
      status: 'completed',
      opportunitiesFound: opportunities.length,
      completedAt: new Date().toISOString(),
      metadata: {
        watchlistSize: env.aaveV3Watchlist.length,
        threshold: env.aaveV3HealthFactorThreshold,
      },
    });

    console.log(
      JSON.stringify(
        {
          scannerKey: SCANNER_KEY,
          protocolKey: PROTOCOL_KEY,
          chain: CHAIN_KEY,
          runId,
          watchlistSize: env.aaveV3Watchlist.length,
          opportunitiesFound: opportunities.length,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await completeScanRun(db, {
      id: runId,
      status: 'failed',
      opportunitiesFound: 0,
      completedAt: new Date().toISOString(),
      metadata: {
        error: error instanceof Error ? error.message : 'unknown error',
      },
    });

    throw error;
  }
}
