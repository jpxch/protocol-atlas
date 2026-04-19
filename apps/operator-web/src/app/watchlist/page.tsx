import { WatchlistBoard } from '@/features/watchlist/WatchlistBoard';
import { getRecentScanRuns, getWatchlistTargets } from '@/lib/api';
import type { ApiChainKey, ApiScanRunStatus } from '@/types/api';

type SearchParamValue = string | string[] | undefined;
type PageSearchParams = Record<string, SearchParamValue>;

interface WatchlistPageProps {
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

function parseScanRunStatus(value?: string): ApiScanRunStatus | undefined {
  switch (value) {
    case 'started':
    case 'completed':
    case 'failed':
      return value;
    default:
      return undefined;
  }
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export default async function WatchlistPage({ searchParams }: WatchlistPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);

  const chain = parseChainKey(firstValue(resolvedSearchParams.chain));
  const protocolKey = firstValue(resolvedSearchParams.protocolKey)?.trim() || undefined;
  const source = firstValue(resolvedSearchParams.source)?.trim() || undefined;
  const isActive = parseBoolean(firstValue(resolvedSearchParams.isActive));
  const search = firstValue(resolvedSearchParams.search)?.trim() || undefined;
  const limit = parsePositiveInt(firstValue(resolvedSearchParams.limit), 100);
  const offset = parseNonNegativeInt(firstValue(resolvedSearchParams.offset), 0);
  const scanStatus = parseScanRunStatus(firstValue(resolvedSearchParams.scanStatus));

  const [watchlistResponse, scanRunsResponse] = await Promise.all([
    getWatchlistTargets({
      chain,
      protocolKey,
      source,
      isActive,
      search,
      limit,
      offset,
    }),
    getRecentScanRuns({
      chain,
      protocolKey,
      status: scanStatus,
      limit: 10,
    }),
  ]);

  return (
    <WatchlistBoard watchlistResponse={watchlistResponse} scanRunsResponse={scanRunsResponse} />
  );
}
