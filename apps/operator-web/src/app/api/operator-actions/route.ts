import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  const response = await fetch(`${API_BASE_URL}/operator-actions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: await request.text(),
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
