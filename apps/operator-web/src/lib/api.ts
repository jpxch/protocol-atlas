import type {
  AuditEventsResponse,
  OperatorActionRequest,
  OperatorActionResponse,
  OpportunitiesResponse,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

export async function getOpportunities(): Promise<OpportunitiesResponse> {
  const response = await fetch(`${API_BASE_URL}/opportunities`, {
    cache: 'no-store',
  });

  return parseJson<OpportunitiesResponse>(response);
}

export async function getAuditEvents(): Promise<AuditEventsResponse> {
  const response = await fetch(`${API_BASE_URL}/audit-events`, {
    cache: 'no-store',
  });

  return parseJson<AuditEventsResponse>(response);
}

export async function requestOperatorAction(
  input: OperatorActionRequest,
): Promise<OperatorActionResponse> {
  const response = await fetch(`${API_BASE_URL}/operator-actions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseJson<OperatorActionResponse>(response);
}
