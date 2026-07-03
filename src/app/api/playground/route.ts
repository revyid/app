import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

async function runGo(code: string): Promise<{ output: string; error?: string }> {
  const body = new URLSearchParams({ version: '2', body: code, withVet: 'true' });
  const res = await fetch('https://go.dev/_/compile', { method: 'POST', body });
  const data = await res.json();
  const lines: string[] = [];
  if (data.Errors) {
    data.Errors.forEach((e: string) => lines.push(e));
    return { output: lines.join('\n'), error: 'compile' };
  }
  if (data.Events?.length) {
    data.Events.forEach((e: any) => lines.push(e.Message.replace(/\n$/, '')));
  }
  return { output: lines.join('\n') || '(no output)' };
}

async function runRust(code: string): Promise<{ output: string; error?: string }> {
  const res = await fetch('https://play.rust-lang.org/execute.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      edition: '2021',
      mode: 'debug',
      crateType: 'bin',
      tests: false,
    }),
  });
  const data = await res.json();
  const lines: string[] = [];
  if (data.stderr) lines.push(data.stderr.replace(/\n$/, ''));
  if (data.stdout) lines.push(data.stdout.replace(/\n$/, ''));
  return { output: lines.join('\n') || '(no output)', error: data.stderr ? 'compile' : undefined };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);

  try {
    const { lang, code } = await request.json();

    if (!lang || !code) {
      return NextResponse.json({ error: 'Missing lang or code' }, { status: 400, headers: cors });
    }

    let result: { output: string; error?: string };

    if (lang === 'go') {
      result = await runGo(code);
    } else if (lang === 'rust') {
      result = await runRust(code);
    } else {
      return NextResponse.json({ error: `Unsupported language: ${lang}` }, { status: 400, headers: cors });
    }

    return NextResponse.json(result, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}
