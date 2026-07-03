// app/api/playground/route.ts
//
// Proxies code from the docs sandbox to Piston (https://github.com/engineer-man/piston),
// a free, public, sandboxed multi-language execution engine (the same engine that powers
// a lot of "run code online" tools and Discord bots). This makes Go / Rust / PHP in the
// sandbox *actually* compile and run with the real toolchain — not a fake/simulated result.
//
// Why proxy through our own server instead of calling Piston from the browser?
// 1. Keeps things future-proof if we ever want to add auth/rate limiting/caching.
// 2. Lets us normalize the response shape for the client regardless of language.
//
// Note: like virtually all public code-execution sandboxes (Go Playground, Rust
// Playground, etc.), Piston intentionally has no outbound network access — that's
// what makes it safe to expose to anonymous visitors. So code that calls out to
// https://revy.my.id/api/... will compile and run for real, but the HTTP call itself
// will fail with a connection error inside the sandbox. The client surfaces this with
// a small notice so it doesn't look like a bug.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CODE_LENGTH = 20_000;

type LangKey = 'go' | 'rust' | 'php';

const LANGUAGES: Record<LangKey, { language: string; version: string; filename: string }> = {
  go: { language: 'go', version: '*', filename: 'main.go' },
  rust: { language: 'rust', version: '*', filename: 'main.rs' },
  php: { language: 'php', version: '*', filename: 'main.php' },
};

interface PistonRunResult {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
}

interface PistonResponse {
  language?: string;
  version?: string;
  compile?: PistonRunResult;
  run?: PistonRunResult;
  message?: string;
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const pistonRes = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ name: config.filename, content: code }],
        // Keep a hard ceiling on the sandboxed run itself too.
        run_timeout: 10_000,
        compile_timeout: 10_000,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!pistonRes.ok) {
      const text = await pistonRes.text().catch(() => '');
      return NextResponse.json(
        { error: true, output: `Execution service returned HTTP ${pistonRes.status}.${text ? `\n${text.slice(0, 1000)}` : ''}` },
        { status: 200 },
      );
    }

    const data = (await pistonRes.json()) as PistonResponse;

    // Compiled languages (Go, Rust) fail at the compile step before ever running.
    if (data.compile && (data.compile.code ?? 0) !== 0) {
      const compileOutput = (data.compile.stderr || data.compile.output || 'Compilation failed.').trim();
      return NextResponse.json({ error: true, output: compileOutput, stage: 'compile' });
    }

    const run = data.run;
    if (!run) {
      return NextResponse.json({ error: true, output: data.message || 'The sandbox did not return a result.' });
    }

    const combined = [run.stdout, run.stderr].filter(Boolean).join('\n').trim();
    const exitedNonZero = typeof run.code === 'number' && run.code !== 0;

    return NextResponse.json({
      error: exitedNonZero,
      output: combined || (exitedNonZero ? `Process exited with code ${run.code}` : '(no output)'),
      exitCode: run.code ?? 0,
      version: data.version,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: true, output: 'The sandbox timed out. Try simpler code or fewer iterations.' }, { status: 200 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error contacting the execution sandbox.';
    return NextResponse.json({ error: true, output: message }, { status: 200 });
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
