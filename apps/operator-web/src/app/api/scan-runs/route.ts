import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = await fetch(`${API_BASE_URL}/scan-runs${url.search}`, {
    cache: 'no-store',
  });
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
