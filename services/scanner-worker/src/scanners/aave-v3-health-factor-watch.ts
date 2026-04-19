import PoolArtifact from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json' with { type: 'json' };
import { createPublicClient, getAbiItem, http } from 'viem';
import type { Abi, AbiEvent, Address } from 'viem';
import type { OpportunityRecord, OpportunitySignal, RiskLevel } from '@protocol-atlas/core';
import {
  completeScanRun,
  createDatabaseConnection,
  createScanRun,
  expireScannerOpportunities,
  listActiveWatchlistTargets,
  upsertLiquidationPlan,
  upsertOpportunity,
  upsertWatchlistTarget,
} from '@protocol-atlas/db';
import type { ScannerEnv } from '../env.js';
import { buildAaveV3LiquidationPlan } from '../simulators/aave-v3-liquidation-plan.js';

const POOL_ABI = PoolArtifact.abi as Abi;

const SCANNER_KEY = 'aave-v3-auto-watch';
const PROTOCOL_KEY = 'aave-v3';
const CHAIN_KEY = 'arbitrum';
const AAVE_BASE_CURRENCY_DECIMALS = 8;
const ACTIONABLE_HEALTH_FACTOR_THRESHOLD = 1;
const WATCH_CLOSE_HEALTH_FACTOR_THRESHOLD = 1.03;
const LIQUIDATION_CLOSE_FACTOR = 0.5;
const LIQUIDATION_BONUS_BPS = 500;
const DEFAULT_GAS_COST_USD = 12;
const MIN_NET_PROFIT_USD = 15;

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

function bigintToDecimalNumber(value: bigint, decimals: number): number {
  const negative = value < 0n;
  const absoluteValue = negative ? value * -1n : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = absoluteValue / divisor;
  const fraction = absoluteValue % divisor;

  const fractionString = fraction.toString().padStart(decimals, '0').slice(0, 6);

  const result = Number(`${whole.toString()}.${fractionString}`);

  return negative ? result * -1 : result;
}

function formatUsdString(value: number): string {
  return value.toFixed(2);
}

interface LiquidationEstimate {
  readonly totalDebtUsd: number;
  readonly totalCollateralUsd: number;
  readonly maxRepayUsd: number;
  readonly liquidationBonusUsd: number;
  readonly grossUsd: number;
  readonly gasCostUsd: number;
  readonly netUsd: number;
  readonly isWorthSurfacing: boolean;
}

interface LiquidationAssessment {
  readonly signal: OpportunitySignal;
  readonly reason: string;
  readonly isExecutableNow: boolean;
  readonly shouldPersist: boolean;
}

function estimateLiquidationCandidate(input: {
  readonly totalCollateralBase: bigint;
  readonly totalDebtBase: bigint;
}): LiquidationEstimate {
  const totalDebtUsd = bigintToDecimalNumber(input.totalDebtBase, AAVE_BASE_CURRENCY_DECIMALS);

  const totalCollateralUsd = bigintToDecimalNumber(
    input.totalCollateralBase,
    AAVE_BASE_CURRENCY_DECIMALS,
  );

  const maxRepayUsd = totalDebtUsd * LIQUIDATION_CLOSE_FACTOR;
  const liquidationBonusUsd = maxRepayUsd * (LIQUIDATION_BONUS_BPS / 10_000);
  const grossUsd = liquidationBonusUsd;
  const gasCostUsd = DEFAULT_GAS_COST_USD;
  const netUsd = grossUsd - gasCostUsd;

  return {
    totalDebtUsd,
    totalCollateralUsd,
    maxRepayUsd,
    liquidationBonusUsd,
    grossUsd,
    gasCostUsd,
    netUsd,
    isWorthSurfacing: netUsd >= MIN_NET_PROFIT_USD,
  };
}

function assessLiquidationSignal(input: {
  readonly healthFactor: number;
  readonly estimate: LiquidationEstimate;
}): LiquidationAssessment {
  if (input.healthFactor < ACTIONABLE_HEALTH_FACTOR_THRESHOLD) {
    if (input.estimate.netUsd >= MIN_NET_PROFIT_USD) {
      return {
        signal: 'actionable',
        reason: 'Health factor is below 1.0 and estimated net profit clears the minimum threshold.',
        isExecutableNow: true,
        shouldPersist: true,
      };
    }

    return {
      signal: 'low-margin',
      reason: 'Health factor is below 1.0, but estimated net profit is below the minimum profit floor.',
      isExecutableNow: true,
      shouldPersist: true,
    };
  }

  if (input.healthFactor < WATCH_CLOSE_HEALTH_FACTOR_THRESHOLD) {
    return {
      signal: 'watch-close',
      reason: 'Health factor is above 1.0 but close enough to monitor for a fast move into liquidation range.',
      isExecutableNow: false,
      shouldPersist: true,
    };
  }

  return {
    signal: 'watch-close',
    reason: 'Outside the watch window.',
    isExecutableNow: false,
    shouldPersist: false,
  };
}

function buildOpportunityTitle(input: {
  readonly user: Address;
  readonly signal: OpportunitySignal;
  readonly estimate: LiquidationEstimate;
  readonly healthFactor: number;
}): string {
  const short = shortAddress(input.user);
  const net = formatUsdString(input.estimate.netUsd);
  const healthFactor = input.healthFactor.toFixed(4);

  switch (input.signal) {
    case 'actionable':
      return `Aave V3 liquidation opportunity ${short} · ~$${net} net`;
    case 'low-margin':
      return `Aave V3 low-margin liquidation ${short} · ~$${net} net`;
    case 'watch-close':
      return `Aave V3 watch-close borrower ${short} · HF ${healthFactor}`;
  }
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
  readonly estimate: LiquidationEstimate;
  readonly assessment: LiquidationAssessment;
}): OpportunityRecord {
  const healthFactor = formatHealthFactor(input.healthFactorRaw);
  const id = `aave-v3:arbitrum:liquidation:${input.user.toLowerCase()}`;

  return {
    id,
    scannerKey: SCANNER_KEY,
    dedupeKey: id,
    chain: CHAIN_KEY,
    protocolKey: PROTOCOL_KEY,
    title: buildOpportunityTitle({
      user: input.user,
      signal: input.assessment.signal,
      estimate: input.estimate,
      healthFactor,
    }),
    kind: 'liquidation',
    status: 'discovered',
    freshness: 'fresh',
    riskLevel: toRiskLevel(healthFactor),
    targetAddress: input.user,
    money: {
      grossUsd: formatUsdString(input.estimate.grossUsd),
      netUsd: formatUsdString(input.estimate.netUsd),
      gasCostUsd: formatUsdString(input.estimate.gasCostUsd),
    },
    discoveredAt: input.observedAt,
    updatedAt: input.observedAt,
    payload: {
      watchTarget: input.user,
      marketSignal: {
        classification: input.assessment.signal,
        reason: input.assessment.reason,
        isExecutableNow: input.assessment.isExecutableNow,
        thresholds: {
          actionableHealthFactorThreshold: ACTIONABLE_HEALTH_FACTOR_THRESHOLD,
          watchCloseHealthFactorThreshold: WATCH_CLOSE_HEALTH_FACTOR_THRESHOLD,
          minNetProfitUsd: MIN_NET_PROFIT_USD,
        },
      },
      accountData: {
        totalCollateralBase: input.totalCollateralBase.toString(),
        totalDebtBase: input.totalDebtBase.toString(),
        availableBorrowsBase: input.availableBorrowsBase.toString(),
        currentLiquidationThreshold: input.currentLiquidationThreshold.toString(),
        ltv: input.ltv.toString(),
        healthFactorRaw: input.healthFactorRaw.toString(),
        healthFactorFormatted: healthFactor,
      },
      liquidationEstimate: {
        totalCollateralUsd: formatUsdString(input.estimate.totalCollateralUsd),
        totalDebtUsd: formatUsdString(input.estimate.totalDebtUsd),
        maxRepayUsd: formatUsdString(input.estimate.maxRepayUsd),
        liquidationBonusUsd: formatUsdString(input.estimate.liquidationBonusUsd),
        grossUsd: formatUsdString(input.estimate.grossUsd),
        gasCostUsd: formatUsdString(input.estimate.gasCostUsd),
        netUsd: formatUsdString(input.estimate.netUsd),
        closeFactor: LIQUIDATION_CLOSE_FACTOR,
        liquidationBonusBps: LIQUIDATION_BONUS_BPS,
        estimateKind: 'candidate',
        caveat:
          'This is a candidate-level estimate derived from Aave account totals. Exact executable profit still requires reserve-level debt and collateral path computation.',
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

      const estimate = estimateLiquidationCandidate({
        totalCollateralBase,
        totalDebtBase,
      });

      const assessment = assessLiquidationSignal({
        healthFactor,
        estimate,
      });

      const observedAtForOpportunity = new Date().toISOString();

      await upsertWatchlistTarget(db, {
        id: buildWatchlistId(target.targetAddress as Address),
        chain: CHAIN_KEY,
        protocolKey: PROTOCOL_KEY,
        targetAddress: target.targetAddress,
        source: target.source,
        observedAt: observedAtForOpportunity,
        metadata: {
          latestHealthFactor: healthFactor,
          latestSignal: assessment.signal,
          latestSignalReason: assessment.reason,
          isExecutableNow: assessment.isExecutableNow,
          totalDebtUsd: formatUsdString(estimate.totalDebtUsd),
          totalCollateralUsd: formatUsdString(estimate.totalCollateralUsd),
          estimatedNetUsd: formatUsdString(estimate.netUsd),
          observedAt: observedAtForOpportunity,
        },
      });

      if (!assessment.shouldPersist) {
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
        observedAt: observedAtForOpportunity,
        estimate,
        assessment,
      });

      opportunities.push(opportunity);
    }

    for (const opportunity of opportunities) {
      await upsertOpportunity(db, opportunity);

      const payload = opportunity.payload;
      const accountData = payload.accountData as
        | { healthFactorFormatted?: unknown }
        | undefined;
      const healthFactor =
        typeof accountData?.healthFactorFormatted === 'number'
          ? accountData.healthFactorFormatted
          : Number(accountData?.healthFactorFormatted);

      const plan = await buildAaveV3LiquidationPlan({
        publicClient,
        poolAddress: env.aaveV3ArbitrumPoolAddress,
        scannerKey: SCANNER_KEY,
        chain: CHAIN_KEY,
        protocolKey: PROTOCOL_KEY,
        candidateOpportunityId: opportunity.id,
        userAddress: opportunity.targetAddress as Address,
        healthFactor,
        observedAt: opportunity.updatedAt,
      });

      await upsertLiquidationPlan(db, plan);
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
        monitoringThreshold: env.aaveV3HealthFactorThreshold,
        actionableHealthFactorThreshold: ACTIONABLE_HEALTH_FACTOR_THRESHOLD,
        minNetProfitUsd: MIN_NET_PROFIT_USD,
        estimatedGasCostUsd: DEFAULT_GAS_COST_USD,
        liquidationCloseFactor: LIQUIDATION_CLOSE_FACTOR,
        liquidationBonusBps: LIQUIDATION_BONUS_BPS,
        liquidationPlansAttempted: opportunities.length,
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
