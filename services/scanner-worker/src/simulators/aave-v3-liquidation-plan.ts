import AaveOracleArtifact from '@aave/core-v3/artifacts/contracts/interfaces/IAaveOracle.sol/IAaveOracle.json' with { type: 'json' };
import PoolAddressesProviderArtifact from '@aave/core-v3/artifacts/contracts/interfaces/IPoolAddressesProvider.sol/IPoolAddressesProvider.json' with { type: 'json' };
import PoolArtifact from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json' with { type: 'json' };
import type { LiquidationPlanRecord } from '@protocol-atlas/core';
import type { Abi, Address, PublicClient } from 'viem';

const POOL_ABI = PoolArtifact.abi as Abi;
const POOL_ADDRESSES_PROVIDER_ABI = PoolAddressesProviderArtifact.abi as Abi;
const AAVE_ORACLE_ABI = AaveOracleArtifact.abi as Abi;

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const satisfies Abi;

const AAVE_ORACLE_DECIMALS = 8;
const BPS = 10_000;
const CLOSE_FACTOR_HF_THRESHOLD = 0.95;
const DEFAULT_CLOSE_FACTOR_BPS = 5_000;
const MAX_CLOSE_FACTOR_BPS = 10_000;
const DEFAULT_GAS_COST_USD = 12;
const DEFAULT_PRIORITY_FEE_USD = 3;
const DEFAULT_SLIPPAGE_BPS = 50;

interface ReservePosition {
  readonly asset: Address;
  readonly symbol: string;
  readonly decimals: number;
  readonly priceUsd: number;
  readonly liquidationBonusBps: number;
  readonly collateralBalance: bigint;
  readonly stableDebt: bigint;
  readonly variableDebt: bigint;
  readonly collateralEnabled: boolean;
}

interface PlanInput {
  readonly publicClient: PublicClient;
  readonly poolAddress: Address;
  readonly scannerKey: string;
  readonly chain: LiquidationPlanRecord['chain'];
  readonly protocolKey: string;
  readonly candidateOpportunityId: string;
  readonly userAddress: Address;
  readonly healthFactor: number;
  readonly observedAt: string;
}

function formatUsd(value: number): string {
  return value.toFixed(8);
}

function pow10(decimals: number): bigint {
  return 10n ** BigInt(decimals);
}

function bigintToDecimalNumber(value: bigint, decimals: number): number {
  const divisor = pow10(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionString = fraction.toString().padStart(decimals, '0').slice(0, 8);

  return Number(`${whole.toString()}.${fractionString}`);
}

function decimalNumberToBigint(value: number, decimals: number): bigint {
  if (!Number.isFinite(value) || value <= 0) {
    return 0n;
  }

  return BigInt(Math.floor(value * 10 ** decimals));
}

function getConfigData(value: unknown): bigint {
  if (Array.isArray(value)) {
    const first = value[0] as { data?: unknown } | undefined;

    if (typeof first?.data === 'bigint') {
      return first.data;
    }
  }

  const record = value as { data?: unknown } | undefined;

  if (typeof record?.data === 'bigint') {
    return record.data;
  }

  return 0n;
}

function getReserveDataAddress(value: unknown, index: number): Address | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const item = value[index];

  return typeof item === 'string' && /^0x[a-fA-F0-9]{40}$/.test(item) ? (item as Address) : null;
}

function getUserConfigBit(userConfigData: bigint, reserveId: number, bitOffset: 0 | 1): boolean {
  const bit = BigInt(reserveId * 2 + bitOffset);

  return ((userConfigData >> bit) & 1n) === 1n;
}

function getConfigBits(data: bigint, start: number, length: number): number {
  const mask = (1n << BigInt(length)) - 1n;

  return Number((data >> BigInt(start)) & mask);
}

function tokenAmountUsd(amount: bigint, decimals: number, priceUsd: number): number {
  return bigintToDecimalNumber(amount, decimals) * priceUsd;
}

function usdToTokenAmount(valueUsd: number, decimals: number, priceUsd: number): bigint {
  if (priceUsd <= 0) {
    return 0n;
  }

  return decimalNumberToBigint(valueUsd / priceUsd, decimals);
}

function buildBlockedPlan(input: PlanInput, reason: string, payload: Record<string, unknown> = {}) {
  return {
    id: `${input.candidateOpportunityId}:plan`,
    candidateOpportunityId: input.candidateOpportunityId,
    scannerKey: input.scannerKey,
    chain: input.chain,
    protocolKey: input.protocolKey,
    userAddress: input.userAddress,
    debtAsset: null,
    debtSymbol: null,
    collateralAsset: null,
    collateralSymbol: null,
    debtToCover: null,
    debtToCoverUsd: null,
    estimatedCollateralSeized: null,
    estimatedCollateralSeizedUsd: null,
    liquidationBonusBps: null,
    flashloanPremiumBps: null,
    gasCostUsd: formatUsd(DEFAULT_GAS_COST_USD),
    priorityFeeUsd: formatUsd(DEFAULT_PRIORITY_FEE_USD),
    slippageBps: DEFAULT_SLIPPAGE_BPS,
    netProfitUsd: null,
    confidence: 'low',
    status: 'blocked',
    reason,
    blockNumber: null,
    payload,
    createdAt: input.observedAt,
    updatedAt: input.observedAt,
  } satisfies LiquidationPlanRecord;
}

async function readTokenSymbol(
  publicClient: PublicClient,
  tokenAddress: Address,
): Promise<string> {
  try {
    const symbol = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'symbol',
    });

    return typeof symbol === 'string' ? symbol : `${tokenAddress.slice(0, 6)}...`;
  } catch {
    return `${tokenAddress.slice(0, 6)}...`;
  }
}

async function readReservePosition(input: {
  readonly publicClient: PublicClient;
  readonly poolAddress: Address;
  readonly reserve: Address;
  readonly userAddress: Address;
  readonly priceUsd: number;
  readonly userConfigData: bigint;
}): Promise<ReservePosition | null> {
  const reserveData = await input.publicClient.readContract({
    address: input.poolAddress,
    abi: POOL_ABI,
    functionName: 'getReserveData',
    args: [input.reserve],
  });
  const configuration = await input.publicClient.readContract({
    address: input.poolAddress,
    abi: POOL_ABI,
    functionName: 'getConfiguration',
    args: [input.reserve],
  });

  const configData = getConfigData(configuration);
  const reserveId = Array.isArray(reserveData) ? Number(reserveData[7] ?? 0) : 0;
  const aTokenAddress = getReserveDataAddress(reserveData, 8);
  const stableDebtTokenAddress = getReserveDataAddress(reserveData, 9);
  const variableDebtTokenAddress = getReserveDataAddress(reserveData, 10);

  if (!aTokenAddress || !stableDebtTokenAddress || !variableDebtTokenAddress) {
    return null;
  }

  const [collateralBalance, stableDebt, variableDebt, symbol] = await Promise.all([
    input.publicClient.readContract({
      address: aTokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [input.userAddress],
    }),
    input.publicClient.readContract({
      address: stableDebtTokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [input.userAddress],
    }),
    input.publicClient.readContract({
      address: variableDebtTokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [input.userAddress],
    }),
    readTokenSymbol(input.publicClient, input.reserve),
  ]);

  return {
    asset: input.reserve,
    symbol,
    decimals: getConfigBits(configData, 48, 8),
    priceUsd: input.priceUsd,
    liquidationBonusBps: getConfigBits(configData, 32, 16),
    collateralBalance,
    stableDebt,
    variableDebt,
    collateralEnabled: getUserConfigBit(input.userConfigData, reserveId, 1),
  };
}

export async function buildAaveV3LiquidationPlan(
  input: PlanInput,
): Promise<LiquidationPlanRecord> {
  const [reserves, addressesProvider, flashloanPremiumRaw, userConfig, blockNumber] =
    await Promise.all([
      input.publicClient.readContract({
        address: input.poolAddress,
        abi: POOL_ABI,
        functionName: 'getReservesList',
      }),
      input.publicClient.readContract({
        address: input.poolAddress,
        abi: POOL_ABI,
        functionName: 'ADDRESSES_PROVIDER',
      }),
      input.publicClient.readContract({
        address: input.poolAddress,
        abi: POOL_ABI,
        functionName: 'FLASHLOAN_PREMIUM_TOTAL',
      }),
      input.publicClient.readContract({
        address: input.poolAddress,
        abi: POOL_ABI,
        functionName: 'getUserConfiguration',
        args: [input.userAddress],
      }),
      input.publicClient.getBlockNumber(),
    ]);

  if (!Array.isArray(reserves) || typeof addressesProvider !== 'string') {
    return buildBlockedPlan(input, 'Unable to read Aave reserve list or addresses provider.');
  }

  const priceOracle = await input.publicClient.readContract({
    address: addressesProvider as Address,
    abi: POOL_ADDRESSES_PROVIDER_ABI,
    functionName: 'getPriceOracle',
  });

  if (typeof priceOracle !== 'string') {
    return buildBlockedPlan(input, 'Unable to resolve Aave price oracle.');
  }

  const prices = await input.publicClient.readContract({
    address: priceOracle as Address,
    abi: AAVE_ORACLE_ABI,
    functionName: 'getAssetsPrices',
    args: [reserves as Address[]],
  });

  if (!Array.isArray(prices)) {
    return buildBlockedPlan(input, 'Unable to read Aave reserve prices.');
  }

  const userConfigData = getConfigData(userConfig);
  const positions = (
    await Promise.all(
      (reserves as Address[]).map((reserve, index) =>
        readReservePosition({
          publicClient: input.publicClient,
          poolAddress: input.poolAddress,
          reserve,
          userAddress: input.userAddress,
          priceUsd: bigintToDecimalNumber((prices[index] as bigint | undefined) ?? 0n, AAVE_ORACLE_DECIMALS),
          userConfigData,
        }),
      ),
    )
  ).filter((position): position is ReservePosition => Boolean(position));

  const debtPositions = positions.filter((position) => position.stableDebt + position.variableDebt > 0n);
  const collateralPositions = positions.filter(
    (position) => position.collateralEnabled && position.collateralBalance > 0n,
  );

  if (debtPositions.length === 0 || collateralPositions.length === 0) {
    return buildBlockedPlan(input, 'No debt/collateral reserve pair is available for liquidation planning.', {
      debtReserveCount: debtPositions.length,
      collateralReserveCount: collateralPositions.length,
    });
  }

  const closeFactorBps =
    input.healthFactor <= CLOSE_FACTOR_HF_THRESHOLD ? MAX_CLOSE_FACTOR_BPS : DEFAULT_CLOSE_FACTOR_BPS;
  const flashloanPremiumBps = Number(flashloanPremiumRaw);
  let bestPlan: LiquidationPlanRecord | null = null;
  let bestNetUsd = Number.NEGATIVE_INFINITY;

  for (const debt of debtPositions) {
    const debtAmount = debt.stableDebt + debt.variableDebt;
    const debtUsd = tokenAmountUsd(debtAmount, debt.decimals, debt.priceUsd);
    const maxRepayUsd = debtUsd * (closeFactorBps / BPS);

    for (const collateral of collateralPositions) {
      if (collateral.asset.toLowerCase() === debt.asset.toLowerCase()) {
        continue;
      }

      const liquidationBonusMultiplier = collateral.liquidationBonusBps / BPS;
      const collateralUsd = tokenAmountUsd(
        collateral.collateralBalance,
        collateral.decimals,
        collateral.priceUsd,
      );
      const maxRepayByCollateralUsd = collateralUsd / liquidationBonusMultiplier;
      const debtToCoverUsd = Math.min(maxRepayUsd, maxRepayByCollateralUsd);

      if (debtToCoverUsd <= 0) {
        continue;
      }

      const grossBonusUsd = debtToCoverUsd * (liquidationBonusMultiplier - 1);
      const flashloanPremiumUsd = debtToCoverUsd * (flashloanPremiumBps / BPS);
      const slippageUsd = debtToCoverUsd * (DEFAULT_SLIPPAGE_BPS / BPS);
      const netProfitUsd =
        grossBonusUsd -
        flashloanPremiumUsd -
        slippageUsd -
        DEFAULT_GAS_COST_USD -
        DEFAULT_PRIORITY_FEE_USD;

      if (netProfitUsd <= bestNetUsd) {
        continue;
      }

      const debtToCover = usdToTokenAmount(debtToCoverUsd, debt.decimals, debt.priceUsd);
      const estimatedCollateralSeizedUsd = debtToCoverUsd * liquidationBonusMultiplier;
      const estimatedCollateralSeized = usdToTokenAmount(
        estimatedCollateralSeizedUsd,
        collateral.decimals,
        collateral.priceUsd,
      );

      bestNetUsd = netProfitUsd;
      const isExecutable = input.healthFactor < 1 && netProfitUsd > 0;

      bestPlan = {
        id: `${input.candidateOpportunityId}:plan`,
        candidateOpportunityId: input.candidateOpportunityId,
        scannerKey: input.scannerKey,
        chain: input.chain,
        protocolKey: input.protocolKey,
        userAddress: input.userAddress,
        debtAsset: debt.asset,
        debtSymbol: debt.symbol,
        collateralAsset: collateral.asset,
        collateralSymbol: collateral.symbol,
        debtToCover: debtToCover.toString(),
        debtToCoverUsd: formatUsd(debtToCoverUsd),
        estimatedCollateralSeized: estimatedCollateralSeized.toString(),
        estimatedCollateralSeizedUsd: formatUsd(estimatedCollateralSeizedUsd),
        liquidationBonusBps: collateral.liquidationBonusBps,
        flashloanPremiumBps,
        gasCostUsd: formatUsd(DEFAULT_GAS_COST_USD),
        priorityFeeUsd: formatUsd(DEFAULT_PRIORITY_FEE_USD),
        slippageBps: DEFAULT_SLIPPAGE_BPS,
        netProfitUsd: formatUsd(netProfitUsd),
        confidence: netProfitUsd > 25 ? 'medium' : 'low',
        status: isExecutable ? 'planned' : 'blocked',
        reason:
          isExecutable
            ? 'Best reserve pair clears candidate-level net profit after flashloan premium, slippage, gas, and priority fee placeholders.'
            : input.healthFactor >= 1
              ? 'Best reserve pair identified, but health factor is not below 1.0 yet.'
              : 'Best reserve pair is not profitable after flashloan premium, slippage, gas, and priority fee placeholders.',
        blockNumber: blockNumber.toString(),
        payload: {
          closeFactorBps,
          isExecutableNow: input.healthFactor < 1,
          grossBonusUsd: formatUsd(grossBonusUsd),
          flashloanPremiumUsd: formatUsd(flashloanPremiumUsd),
          slippageUsd: formatUsd(slippageUsd),
          priceOracle,
          reserveCounts: {
            total: positions.length,
            debt: debtPositions.length,
            collateral: collateralPositions.length,
          },
          caveat:
            'This plan selects exact reserves and estimates flashloan economics, but it does not yet quote an executable DEX swap route or simulate transaction calldata.',
        },
        createdAt: input.observedAt,
        updatedAt: input.observedAt,
      };
    }
  }

  return (
    bestPlan ??
    buildBlockedPlan(input, 'No valid debt/collateral reserve pair produced a liquidation plan.', {
      debtReserveCount: debtPositions.length,
      collateralReserveCount: collateralPositions.length,
    })
  );
}
