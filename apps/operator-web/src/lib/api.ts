import type {
  ApiChainKey,
  ApiScanRunStatus,
  AuditEventsResponse,
  OperatorActionRequest,
  OperatorActionResponse,
  OpportunitiesResponse,
  ScanRunsResponse,
  WatchlistTargetsResponse,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const OPERATOR_ACTIONS_URL =
  typeof window === 'undefined' ? `${API_BASE_URL}/operator-actions` : '/api/operator-actions';

const EMPTY_OPPORTUNITIES_RESPONSE: OpportunitiesResponse = {
  items: [],
  count: 0,
};

const EMPTY_AUDIT_EVENTS_RESPONSE: AuditEventsResponse = {
  items: [],
  count: 0,
};

const EMPTY_WATCHLIST_TARGETS_RESPONSE: WatchlistTargetsResponse = {
  items: [],
  count: 0,
  pagination: {
    limit: 100,
    offset: 0,
    returned: 0,
  },
  filters: {
    chain: null,
    protocolKey: null,
    source: null,
    isActive: null,
    search: null,
  },
};

const EMPTY_SCAN_RUNS_RESPONSE: ScanRunsResponse = {
  items: [],
  count: 0,
  filters: {
    chain: null,
    protocolKey: null,
    scannerKey: null,
    status: null,
  },
};

export interface GetWatchlistTargetsInput {
  readonly chain?: ApiChainKey;
  readonly protocolKey?: string;
  readonly source?: string;
  readonly isActive?: boolean;
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface GetRecentScanRunsInput {
  readonly chain?: ApiChainKey;
  readonly protocolKey?: string;
  readonly scannerKey?: string;
  readonly status?: ApiScanRunStatus;
  readonly limit?: number;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

function warnApiReadFailure(endpoint: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown API read failure';

  console.warn(`Unable to load ${endpoint} from ${API_BASE_URL}: ${message}`);
}

function buildQueryString(input: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'undefined') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();

  return query.length > 0 ? `?${query}` : '';
}

export async function getOpportunities(): Promise<OpportunitiesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/opportunities`, {
      cache: 'no-store',
    });

    return parseJson<OpportunitiesResponse>(response);
  } catch (error) {
    warnApiReadFailure('/opportunities', error);

    return EMPTY_OPPORTUNITIES_RESPONSE;
  }
}

export async function getAuditEvents(): Promise<AuditEventsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/audit-events`, {
      cache: 'no-store',
    });

    return parseJson<AuditEventsResponse>(response);
  } catch (error) {
    warnApiReadFailure('/audit-events', error);

    return EMPTY_AUDIT_EVENTS_RESPONSE;
  }
}

export async function getWatchlistTargets(
  input: GetWatchlistTargetsInput = {},
): Promise<WatchlistTargetsResponse> {
  try {
    const query = buildQueryString({
      chain: input.chain,
      protocolKey: input.protocolKey,
      source: input.source,
      isActive: input.isActive,
      search: input.search?.trim() || undefined,
      limit: input.limit,
      offset: input.offset,
    });

    const response = await fetch(`${API_BASE_URL}/watchlist-targets${query}`, {
      cache: 'no-store',
    });

    return parseJson<WatchlistTargetsResponse>(response);
  } catch (error) {
    warnApiReadFailure('/watchlist-targets', error);

    return EMPTY_WATCHLIST_TARGETS_RESPONSE;
  }
}

export async function getRecentScanRuns(
  input: GetRecentScanRunsInput = {},
): Promise<ScanRunsResponse> {
  try {
    const query = buildQueryString({
      chain: input.chain,
      protocolKey: input.protocolKey,
      scannerKey: input.scannerKey,
      status: input.status,
      limit: input.limit,
    });

    const response = await fetch(`${API_BASE_URL}/scan-runs${query}`, {
      cache: 'no-store',
    });

    return parseJson<ScanRunsResponse>(response);
  } catch (error) {
    warnApiReadFailure('/scan-runs', error);

    return EMPTY_SCAN_RUNS_RESPONSE;
  }
}

export async function requestOperatorAction(
  input: OperatorActionRequest,
): Promise<OperatorActionResponse> {
  const response = await fetch(OPERATOR_ACTIONS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseJson<OperatorActionResponse>(response);
}