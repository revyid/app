import { NextRequest, NextResponse } from 'next/server';
import { validateSession, createApiKey, listApiKeys, deleteApiKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('cookie')?.match(/app_session_token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await validateSession(token);
  if (!result.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const keys = await listApiKeys();
  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('cookie')?.match(/app_session_token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await validateSession(token);
  if (!result.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const keyResult = await createApiKey(name);
  if (keyResult.error) return NextResponse.json({ error: keyResult.error }, { status: 400 });

  return NextResponse.json({ key: keyResult.key, id: keyResult.id, key_prefix: keyResult.key_prefix });
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('cookie')?.match(/app_session_token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await validateSession(token);
  if (!result.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const { keyId } = await request.json();
  if (!keyId) return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });

  const success = await deleteApiKey(keyId);
  if (!success) return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });

  return NextResponse.json({ success: true });
}
