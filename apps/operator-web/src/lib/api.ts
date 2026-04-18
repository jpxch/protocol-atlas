import type {
  AuditEventsResponse,
  OperatorActionRequest,
  OperatorActionResponse,
  OpportunitiesResponse,
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
