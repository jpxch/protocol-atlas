import { LiquidationsBoard } from '@/features/liquidations/LiquidationsBoard';
import { getLiquidationCandidates } from '@/lib/api';
import type { GetLiquidationCandidatesInput } from '@/lib/api';
import type {
  ApiChainKey,
  ApiOpportunitySignal,
  ApiOpportunityStatus,
  ApiRiskLevel,
} from '@/types/api';

type SearchParamValue = string | string[] | undefined;
type PageSearchParams = Record<string, SearchParamValue>;

interface LiquidationsPageProps {
  readonly searchParams?: Promise<PageSearchParams> | PageSearchParams;
}

async function resolveSearchParams(
  input?: Promise<PageSearchParams> | PageSearchParams,
): Promise<PageSearchParams> {
  if (!input) {
    return {};
  }

  if (typeof (input as Promise<PageSearchParams>).then === 'function') {
    return input as Promise<PageSearchParams>;
  }

  return input as PageSearchParams;
}

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseChainKey(value?: string): ApiChainKey | undefined {
  switch (value) {
    case 'ethereum':
    case 'arbitrum':
    case 'optimism':
    case 'base':
    case 'polygon':
      return value;
    default:
      return undefined;
  }
}

function parseOpportunityStatus(value?: string): ApiOpportunityStatus | undefined {
  switch (value) {
    case 'discovered':
    case 'review-pending':
    case 'simulating':
    case 'approved':
    case 'skipped':
    case 'blocked':
    case 'expired':
    case 'executed':
    case 'failed':
      return value;
    default:
      return undefined;
  }
}

function parseRiskLevel(value?: string): ApiRiskLevel | undefined {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'critical':
      return value;
    default:
      return undefined;
  }
}

function parseSignal(value?: string): ApiOpportunitySignal | undefined {
  switch (value) {
    case 'actionable':
    case 'watch-close':
    case 'low-margin':
      return value;
    default:
      return undefined;
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export default async function LiquidationsPage({ searchParams }: LiquidationsPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);

  const chain = parseChainKey(firstValue(resolvedSearchParams.chain));
  const protocolKey = firstValue(resolvedSearchParams.protocolKey)?.trim() || undefined;
  const status = parseOpportunityStatus(firstValue(resolvedSearchParams.status));
  const riskLevel = parseRiskLevel(firstValue(resolvedSearchParams.riskLevel));
  const signal = parseSignal(firstValue(resolvedSearchParams.signal));
  const limit = parsePositiveInt(firstValue(resolvedSearchParams.limit), 100);

  const input: GetLiquidationCandidatesInput = {
    ...(chain ? { chain } : {}),
    ...(protocolKey ? { protocolKey } : {}),
    ...(status ? { status } : {}),
    ...(riskLevel ? { riskLevel } : {}),
    ...(signal ? { signal } : {}),
    limit,
  };

  const response = await getLiquidationCandidates(input);

  return <LiquidationsBoard response={response} />;
}
