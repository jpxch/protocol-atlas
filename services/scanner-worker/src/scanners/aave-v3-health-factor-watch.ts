import PoolArtifact from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json' with { type: 'json' };
import { createPublicClient, getAbiItem, http } from 'viem';
import type { Abi, AbiEvent, Address } from 'viem';
import type { OpportunityRecord, RiskLevel } from '@protocol-atlas/core';
import {
  completeScanRun,
  createDatabaseConnection,
  createScanRun,
  expireScannerOpportunities,
  listActiveWatchlistTargets,
  upsertOpportunity,
  upsertWatchlistTarget,
} from '@protocol-atlas/db';
import type { ScannerEnv } from '../env.js';

const POOL_ABI = PoolArtifact.abi as Abi;

const SCANNER_KEY = 'aave-v3-auto-watch';
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

function buildWatchlistId(address: Address): string {
  return `aave-v3:arbitrum:watch:${address.toLowerCase()}`;
}

function extractBorrowTarget(log: {
  readonly args?: Record<string, unknown> | readonly unknown[];
}): Address | null {
  const args = log.args;

  if (!args || Array.isArray(args)) {
    return null;
  }

  const namedArgs = args as Record<string, unknown>;
  const onBehalfOf = namedArgs.onBehalfOf;
  const user = namedArgs.user;

  if (typeof onBehalfOf === 'string' && /^0x[a-fA-F0-9]{40}$/.test(onBehalfOf)) {
    return onBehalfOf as Address;
  }

  if (typeof user === 'string' && /^0x[a-fA-F0-9]{40}$/.test(user)) {
    return user as Address;
  }

  return null;
}

async function discoverBorrowers(env: ScannerEnv): Promise<readonly Address[]> {
  const publicClient = createPublicClient({
    transport: http(env.arbitrumRpcUrl),
  });

  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock =
    latestBlock > env.aaveV3DiscoveryBlockWindow
      ? latestBlock - env.aaveV3DiscoveryBlockWindow
      : 0n;

  const borrowEvent = getAbiItem({
    abi: POOL_ABI,
    name: 'Borrow',
  });

  if (!borrowEvent || borrowEvent.type !== 'event') {
    throw new Error('Aave V3 Pool ABI is missing the Borrow event');
  }

  const logs = await publicClient.getLogs({
    address: env.aaveV3ArbitrumPoolAddress,
    event: borrowEvent as AbiEvent,
    fromBlock,
    toBlock: latestBlock,
  });

  const unique = new Set<string>();

  for (const log of logs.slice(-env.aaveV3DiscoveryMaxLogs)) {
    const target = extractBorrowTarget(log);

    if (target) {
      unique.add(target.toLowerCase());
    }
  }

  return Array.from(unique) as Address[];
}

export async function runAaveV3HealthFactorWatchScanner(env: ScannerEnv): Promise<void> {
  const { db, pool } = createDatabaseConnection({
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
    const discoveredTargets = await discoverBorrowers(env);

    const observedAt = new Date().toISOString();

    for (const address of discoveredTargets) {
      await upsertWatchlistTarget(db, {
        id: buildWatchlistId(address),
        chain: CHAIN_KEY,
        protocolKey: PROTOCOL_KEY,
        targetAddress: address,
        source: 'aave-pool-borrow-log',
        observedAt,
        metadata: {},
      });
    }

    const watchTargets = await listActiveWatchlistTargets(db, {
      chain: CHAIN_KEY,
      protocolKey: PROTOCOL_KEY,
      limit: 5000,
    });

    await expireScannerOpportunities(db, {
      scannerKey: SCANNER_KEY,
      protocolKey: PROTOCOL_KEY,
      chain: CHAIN_KEY,
    });

    const opportunities: OpportunityRecord[] = [];
    let failedTargets = 0;

    for (const target of watchTargets) {
      let result: unknown;

      try {
        result = await publicClient.readContract({
          address: env.aaveV3ArbitrumPoolAddress,
          abi: POOL_ABI,
          functionName: 'getUserAccountData',
          args: [target.targetAddress as Address],
        });
      } catch (error) {
        failedTargets += 1;

        console.warn(
          JSON.stringify({
            scannerKey: SCANNER_KEY,
            protocolKey: PROTOCOL_KEY,
            chain: CHAIN_KEY,
            targetAddress: target.targetAddress,
            error: error instanceof Error ? error.message : 'unknown target read failure',
          }),
        );

        continue;
      }

      const [
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactorRaw,
      ] = result as readonly [bigint, bigint, bigint, bigint, bigint, bigint];

      const healthFactor = formatHealthFactor(healthFactorRaw);

      if (totalDebtBase === 0n) {
        continue;
      }

      if (healthFactor >= env.aaveV3HealthFactorThreshold) {
        continue;
      }

      const opportunity = buildOpportunityRecord({
        user: target.targetAddress as Address,
        healthFactorRaw,
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        observedAt: new Date().toISOString(),
      });

      opportunities.push(opportunity);
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
        discoveredTargets: discoveredTargets.length,
        persistedTargets: watchTargets.length,
        failedTargets,
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
          discoveredTargets: discoveredTargets.length,
          persistedTargets: watchTargets.length,
          failedTargets,
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
  } finally {
    await pool.end();
  }
}
