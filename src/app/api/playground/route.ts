// app/api/playground/route.ts
//
// Proxies code from the docs sandbox to glot.io (https://glot.io), a free, public,
// sandboxed multi-language execution engine with a documented run API. This makes
// Go / Rust / PHP in the sandbox *actually* compile and run with the real toolchain —
// not a fake/simulated result.
//
// ⚠️ Setup required: glot.io's run API requires a personal API token (it's free).
//   1. Sign in at https://glot.io and grab your token at https://glot.io/account/token
//   2. Add it to your environment as GLOT_API_TOKEN (e.g. in .env.local / your host's
//      env settings). Without it every request below will return a clear setup error
//      instead of crashing.
//
// We previously used the public Piston API (emkc.org), but as of Feb 15 2026 Piston
// closed public access and now requires manual whitelist approval per-project — not
// practical for an open docs sandbox. glot.io's token model doesn't have that gate.
//
// Why proxy through our own server instead of calling glot.io from the browser?
// 1. Keeps the API token server-side only — it must never reach the client bundle.
// 2. Lets us normalize the response shape for the client regardless of language.
//
// Note: like virtually all public code-execution sandboxes (Go Playground, Rust
// Playground, Piston, glot.io, etc.), this runs in a container with no outbound
// network access — that's what makes it safe to expose to anonymous visitors. So
// code that calls out to https://revy.my.id/api/... will compile and run for real,
// but the HTTP call itself will fail with a connection error inside the sandbox.
// The client surfaces this with a small notice so it doesn't look like a bug.
//
// Prefer not to depend on a third party at all? Since you already run your own
// server, you can self-host glot's engine (https://github.com/glotcode/glot) or
// Piston (https://github.com/engineer-man/piston, `docker-compose up -d api`) and
// point GLOT_RUN_URL / this route at your own instance instead.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GLOT_RUN_URL = process.env.GLOT_RUN_URL || 'https://glot.io/api/run';
const GLOT_API_TOKEN = process.env.GLOT_API_TOKEN;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CODE_LENGTH = 20_000;

type LangKey = 'go' | 'rust' | 'php';

const LANGUAGES: Record<LangKey, { glotLanguage: string; filename: string }> = {
  go: { glotLanguage: 'go', filename: 'main.go' },
  rust: { glotLanguage: 'rust', filename: 'main.rs' },
  php: { glotLanguage: 'php', filename: 'main.php' },
};

interface GlotResponse {
  stdout?: string;
  stderr?: string;
  error?: string; // compiler/interpreter-level error, e.g. a syntax error before anything ran
}

export async function POST(req: NextRequest) {
  let body: { lang?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const langKey = String(body.lang ?? '').toLowerCase() as LangKey;
  const code = body.code;

  const config = LANGUAGES[langKey];
  if (!config) {
    return NextResponse.json(
      { error: `Unsupported language "${body.lang}". Expected one of: ${Object.keys(LANGUAGES).join(', ')}.` },
      { status: 400 },
    );
  }
  if (typeof code !== 'string' || code.trim().length === 0) {
    return NextResponse.json({ error: 'No code provided.' }, { status: 400 });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return NextResponse.json({ error: `Code exceeds the ${MAX_CODE_LENGTH.toLocaleString()} character limit.` }, { status: 413 });
  }

  if (!GLOT_API_TOKEN) {
    return NextResponse.json({
      error: true,
      output:
        'Sandbox is not configured yet: missing GLOT_API_TOKEN.\n' +
        'Get a free token at https://glot.io/account/token and set it as the ' +
        'GLOT_API_TOKEN environment variable on the server, then redeploy.',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const glotRes = await fetch(`${GLOT_RUN_URL}/${config.glotLanguage}/latest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${GLOT_API_TOKEN}`,
      },
      body: JSON.stringify({
        files: [{ name: config.filename, content: code }],
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (glotRes.status === 401 || glotRes.status === 403) {
      return NextResponse.json({
        error: true,
        output: 'The sandbox rejected the request (invalid or expired GLOT_API_TOKEN). Double-check the token at https://glot.io/account/token.',
      });
    }
    if (glotRes.status === 429) {
      return NextResponse.json({ error: true, output: 'The sandbox is rate-limited right now. Please try again in a moment.' });
    }
    if (!glotRes.ok) {
      const text = await glotRes.text().catch(() => '');
      return NextResponse.json({
        error: true,
        output: `Execution service returned HTTP ${glotRes.status}.${text ? `\n${text.slice(0, 1000)}` : ''}`,
      });
    }

    const data = (await glotRes.json()) as GlotResponse;

    // A non-empty `error` means the compiler/interpreter itself failed
    // (syntax error, failed compile) before producing normal output.
    if (data.error && data.error.trim()) {
      return NextResponse.json({ error: true, output: data.error.trim(), stage: 'compile' });
    }

    const combined = [data.stdout, data.stderr].filter(Boolean).join('\n').trim();
    return NextResponse.json({ error: false, output: combined || '(no output)' });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: true, output: 'The sandbox timed out. Try simpler code or fewer iterations.' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error contacting the execution sandbox.';
    return NextResponse.json({ error: true, output: message });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests with { lang, code }.' },
    { status: 405 },
  );
}
