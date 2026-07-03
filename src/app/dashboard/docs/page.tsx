'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Copy, Check, Play, Square, Terminal, BookOpen, Globe, Loader2, RotateCcw } from 'lucide-react';
import Link from 'next/link';

/* ─── Copy button ─────────────────────────────────────────────────── */

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const go = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); };
  return (
    <button onClick={go} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
      {ok ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'endpoints', label: 'Endpoints', icon: Globe },
  { id: 'sandbox', label: 'Sandbox', icon: Terminal },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Endpoint data ───────────────────────────────────────────────── */

const ENDPOINTS = [
  { method: 'GET', path: '/api/github?path=users/{username}', title: 'User Profile', desc: 'Returns public profile information for a GitHub user.', response: '{\n  "login": "torvalds",\n  "name": "Linus Torvalds",\n  "public_repos": 7,\n  "followers": 234000\n}', fields: [['login', 'string', 'Username'], ['name', 'string | null', 'Display name'], ['public_repos', 'number', 'Public repos'], ['followers', 'number', 'Followers']] },
  { method: 'GET', path: '/api/github?path=users/{username}/repos', title: 'User Repositories', desc: 'List all public repositories for a user.', response: '[\n  {\n    "name": "app",\n    "stargazers_count": 2,\n    "language": "TypeScript"\n  }\n]', fields: [['name', 'string', 'Repo name'], ['stargazers_count', 'number', 'Stars'], ['language', 'string | null', 'Language']] },
  { method: 'GET', path: '/api/github?path=users/{username}/events', title: 'User Events', desc: 'Recent public activity: pushes, issues, PRs.', response: '[\n  {\n    "type": "PushEvent",\n    "actor": { "login": "revyid" }\n  }\n]', fields: [['type', 'string', 'Event type'], ['actor', 'object', '{ login, avatar_url }']] },
  { method: 'GET', path: '/api/github?path=repos/{owner}/{repo}', title: 'Repository Details', desc: 'Full information about a repository.', response: '{\n  "name": "react",\n  "stargazers_count": 234000,\n  "language": "JavaScript"\n}', fields: [['name', 'string', 'Repo name'], ['stargazers_count', 'number', 'Stars'], ['language', 'string | null', 'Language']] },
];

/* ─── SDK snippets ────────────────────────────────────────────────── */

const LANGS = ['JavaScript', 'Python', 'TypeScript', 'cURL'] as const;
type Lang = typeof LANGS[number];

const PATHS = ['users/revyid', 'users/torvalds', 'repos/facebook/react'];

function sdkCode(lang: Lang, p: string): string {
  const url = `https://revy.my.id/api/github?path=${p}`;
  const k = 'rv_your_key';
  switch (lang) {
    case 'JavaScript':
      return `const API_KEY = '${k}';\nconst BASE = 'https://revy.my.id/api/github';\n\nasync function getData(path: string) {\n  const res = await fetch(\`\${BASE}?path=\${path}\`, {\n    headers: { 'x-api-key': API_KEY }\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n}\n\nconst data = await getData('${p}');\nconsole.log(data);`;
    case 'Python':
      return `import requests\n\nAPI_KEY = "${k}"\nBASE = "https://revy.my.id/api/github"\n\nres = requests.get(\n    f"{BASE}?path=${p}",\n    headers={"x-api-key": API_KEY},\n    timeout=10,\n)\nres.raise_for_status()\nprint(res.status_code)\nprint(res.json())`;
    case 'TypeScript':
      return `interface ApiResponse {\n  login: string;\n  name: string | null;\n  public_repos: number;\n  followers: number;\n}\n\nconst API_KEY: string = '${k}';\nconst BASE: string = 'https://revy.my.id/api/github';\n\nasync function getData(path: string): Promise<ApiResponse> {\n  const res = await fetch(\`\${BASE}?path=\${path}\`, {\n    headers: { 'x-api-key': API_KEY }\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json() as Promise<ApiResponse>;\n}\n\nconst data: ApiResponse = await getData('${p}');\nconsole.log(data);`;
    case 'cURL':
      return `curl -s -H "x-api-key: ${k}" \\\n  "${url}"`;
  }
}

/* ─── Sandbox engine ──────────────────────────────────────────────── */

type LogFn = (line: string) => void;

function makeCon(log: LogFn) {
  return {
    log: (...a: unknown[]) => log(a.map(x => (typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x))).join(' ')),
    warn: (...a: unknown[]) => log('Warning: ' + a.join(' ')),
    error: (...a: unknown[]) => log('Error: ' + a.join(' ')),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)),
  ]);
}

function makeSandboxedFetch(log: LogFn) {
  return async (url: string, opts?: RequestInit) => {
    const t0 = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await window.fetch(url, { ...opts, signal: controller.signal });
      const ms = Math.round(performance.now() - t0);
      log(`> ${opts?.method || 'GET'} ${url}`);
      log(`< HTTP/1.1 ${res.status} ${res.statusText}`);
      const ct = res.headers.get('content-type');
      if (ct) log(`< content-type: ${ct}`);
      log(`< time: ${ms}ms`);
      log('');
      const cloned = res.clone();
      try {
        const body = await cloned.json();
        log(JSON.stringify(body, null, 2));
      } catch {
        log(await res.text());
      }
      return res;
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e.name === 'AbortError' ? 'request timed out' : e.message) : String(e);
      log(`Error: ${msg}`);
      throw e instanceof Error ? e : new Error(msg);
    } finally {
      clearTimeout(timer);
    }
  };
}

async function runJS(code: string, log: LogFn): Promise<void> {
  const fn = new Function('fetch', 'console', `return (async()=>{\n${code}\n})()`);
  await withTimeout(Promise.resolve(fn(makeSandboxedFetch(log), makeCon(log))), 20000, 'Script');
}

// Pyodide singleton — loaded once per session and reused across runs.
let pyodideInst: any = null;
let pyodidePromise: Promise<any> | null = null;

async function getPyodide(log: LogFn): Promise<any> {
  if (pyodideInst) return pyodideInst;
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    try {
      if (!(window as any).loadPyodide) {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        document.head.appendChild(s);
        await new Promise<void>((res, rej) => {
          s.onload = () => res();
          s.onerror = () => rej(new Error('Could not load the Python runtime from the CDN. Check your connection and try again.'));
        });
      }
      const py = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' });
      await py.loadPackage('micropip');
      // pyodide-http patches `requests`/urllib3 to route through the browser's
      // real fetch/XHR stack, so `requests.get(...)` genuinely performs the HTTP
      // call instead of failing (Pyodide has no raw sockets).
      await py.runPythonAsync(`
import micropip
await micropip.install(["requests", "pyodide-http"])
import pyodide_http
pyodide_http.patch_all()
`);
      pyodideInst = py;
      return py;
    } catch (e) {
      pyodidePromise = null; // allow retry on next run
      throw e;
    }
  })();
  return pyodidePromise;
}

async function runPython(code: string, log: LogFn): Promise<void> {
  log('# Loading Python runtime (Pyodide / WebAssembly)...\n');
  const py = await getPyodide(log);
  log('# Runtime ready — running your code.\n');
  const filterNoise = (l: string) => !l.includes('InsecureRequestWarning') && !l.includes('warnings.warn') && !l.includes('urllib3');
  py.setStdout({ batched: (t: string) => t.split('\n').filter(Boolean).filter(filterNoise).forEach(l => log(l)) });
  py.setStderr({ batched: (t: string) => t.split('\n').filter(Boolean).filter(filterNoise).forEach(l => log('Error: ' + l)) });
  await withTimeout(py.runPythonAsync(code), 25000, 'Python script');
}

// TypeScript transpiler — loaded from CDN, transpiles TS to JS
let tsCompiler: any = null;

async function getTsCompiler(): Promise<any> {
  if (tsCompiler) return tsCompiler;
  if (!(window as any).ts) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/typescript@5.4.5/lib/typescript.min.js';
    document.head.appendChild(s);
    await new Promise<void>((res, rej) => { s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load TypeScript compiler')); });
  }
  tsCompiler = (window as any).ts;
  return tsCompiler;
}

async function runTypeScript(code: string, log: LogFn): Promise<void> {
  log('# Transpiling TypeScript to JavaScript...\n');
  const ts = await getTsCompiler();
  const js = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true },
  }).outputText;
  log('# Running transpiled code...\n');
  await runJS(js, log);
}

async function runCurl(code: string, log: LogFn): Promise<void> {
  try {
    const { browserCurl } = await import('@/lib/curl-browser');
    const res = await browserCurl(code);
    log(`> ${res.curlCommand}`);
    log('');
    log(`< HTTP/1.1 ${res.status} ${res.statusText}`);
    for (const [k, v] of Object.entries(res.headers)) log(`< ${k}: ${v}`);
    if (res.duration) log(`< time: ${res.duration}ms`);
    log('');
    if (typeof res.body === 'object') log(JSON.stringify(res.body, null, 2));
    else log(String(res.body));
  } catch (e: any) {
    log(`Error: ${e.message}`);
  }
}

/* ─── Console output ──────────────────────────────────────────────── */

function ConsoleOutput({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div className="flex-1 min-h-[200px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#13141c] border-b border-outline/10 shrink-0">
        <span className="text-label-sm text-muted-foreground/60 font-mono">console</span>
        {lines.length > 0 && <CopyBtn text={lines.join('\n')} />}
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-3 bg-[#1a1b26]">
        {lines.length === 0 ? (
          <div className="text-[13px] font-mono text-muted-foreground/30">Output appears here...</div>
        ) : (
          <pre className="font-mono text-[13px] leading-relaxed text-[#a9b1d6] whitespace-pre-wrap break-words">
            {lines.filter(l => l !== undefined).map((l, i) => {
              let cls = '';
              const s = l || '';
              if (s.startsWith('>') || s.startsWith('#') || s.startsWith('*')) cls = 'text-[#7aa2f7]';
              else if (s.startsWith('< HTTP')) cls = /\s2\d\d\s/.test(s) ? 'text-[#9ece6a]' : 'text-[#f7768e]';
              else if (s.startsWith('<')) cls = 'text-[#565f89]';
              else if (s.toLowerCase().startsWith('error') || s.toLowerCase().startsWith('warning') || s.includes('"error"')) cls = 'text-[#f7768e]';
              return <div key={i} className={cls}>{s}</div>;
            })}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ─── Editor + Run ────────────────────────────────────────────────── */

function Editor({ code, setCode, onRun, onReset, running, lang }: {
  code: string; setCode: (s: string) => void; onRun: () => void; onReset: () => void; running: boolean; lang?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; } }, [code]);
  return (
    <div className="flex-1 min-h-[200px] flex flex-col border-b md:border-b-0 md:border-r border-outline/20">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#13141c] border-b border-outline/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-error/80" /><div className="w-2.5 h-2.5 rounded-full bg-warning/80" /><div className="w-2.5 h-2.5 rounded-full bg-success/80" /></div>
          {lang && <span className="text-label-sm text-muted-foreground/50 font-mono ml-1">{lang.toLowerCase()}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onReset} disabled={running} title="Reset to default snippet" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-variant/60 transition-colors disabled:opacity-40">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRun} disabled={running} className="flex items-center gap-1.5 px-3 py-1 text-label-sm font-mono rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50">
            {running ? <><Square className="w-3 h-3" /> Running</> : <><Play className="w-3 h-3" /> Run</>}
          </button>
        </div>
      </div>
      <textarea
        ref={ref}
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        disabled={running}
        aria-label={`${lang ?? 'code'} editor`}
        className="flex-1 w-full p-3 bg-[#1a1b26] text-[#a9b1d6] font-mono text-[13px] leading-relaxed resize-none outline-none disabled:opacity-60"
      />
    </div>
  );
}

/* ─── Tab content ─────────────────────────────────────────────────── */

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Revvy API</h1>
        <p className="text-body-md text-muted-foreground">RESTful proxy API for GitHub data. All requests require an API key via the <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">x-api-key</code> header.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['🔐', 'Auth', 'x-api-key'], ['🛡️', 'Rate Limit', '100/hr'], ['⚡', 'Cache', '5 min'], ['🌐', 'Edge', 'Vercel']].map(([i, l, d]) => (
          <div key={l} className="p-3 rounded-xl bg-surface border border-outline/10 text-center transition-colors hover:border-outline/25">
            <div className="text-xl mb-1">{i}</div>
            <p className="text-body-sm font-medium text-foreground">{l}</p>
            <p className="text-label-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Start</h2>
        <div className="space-y-3 text-body-sm text-muted-foreground">
          <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">1</span><span>Create a key at <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard &rarr; API Keys</Link>.</span></div>
          <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">2</span><span>Copy it immediately — shown only once.</span></div>
          <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">3</span><span>Pass it via the <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">x-api-key</code> header.</span></div>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Try it live</h2>
        <p className="text-body-sm text-muted-foreground">Head to the <span className="text-foreground font-medium">Sandbox</span> tab to run real JavaScript, Python, Go, Rust, PHP, or cURL against this API — right in your browser, no local setup required.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Error Codes</h2>
        <div className="space-y-1">
          {[['400', 'Bad Request'], ['401', 'Unauthorized'], ['403', 'Forbidden'], ['429', 'Rate Limited'], ['502', 'Gateway Error']].map(([c, l]) => (
            <div key={c} className="flex items-center gap-3 py-1">
              <code className={`w-8 text-center text-label-sm font-mono font-bold ${Number(c) >= 500 || c === '401' || c === '403' ? 'text-error' : 'text-warning'}`}>{c}</code>
              <span className="text-body-sm text-foreground">{l}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EndpointsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Endpoints</h1>
        <p className="text-body-sm text-muted-foreground">Base: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">https://revy.my.id/api/github</code></p>
      </div>
      {ENDPOINTS.map(ep => (
        <section key={ep.path} className="border-b border-outline/10 pb-8 last:border-0">
          <div className="flex items-center gap-3 mb-2"><span className="px-2 py-0.5 rounded bg-success/15 text-success text-label-sm font-mono font-medium">{ep.method}</span><code className="text-[13px] font-mono text-foreground">{ep.path}</code></div>
          <p className="text-body-sm text-muted-foreground mb-3">{ep.desc}</p>
          <div className="rounded-xl border border-outline/20 overflow-hidden mb-3">
            <div className="flex items-center justify-between px-3 py-1.5 bg-success/10 border-b border-outline/20"><span className="text-label-sm font-mono text-success font-medium">Response</span><CopyBtn text={ep.response} /></div>
            <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-48"><code className="text-[13px] font-mono text-foreground whitespace-pre">{ep.response}</code></pre>
          </div>
          <div className="rounded-xl border border-outline/15 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-surface-variant/50 border-b border-outline/15"><th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th><th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th><th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th></tr></thead>
              <tbody>{ep.fields.map(([f, t, d]) => (<tr key={f} className="border-b border-outline/10 last:border-0"><td className="py-1.5 px-3 font-mono text-primary">{f}</td><td className="py-1.5 px-3 font-mono text-muted-foreground">{t}</td><td className="py-1.5 px-3 text-muted-foreground">{d}</td></tr>))}</tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

const LANG_INFO: Record<Lang, string> = {
  JavaScript: 'Runs natively in your browser\'s JS engine — real fetch, real response.',
  Python: 'Runs a real CPython interpreter via Pyodide (WebAssembly); requests is patched to use your browser\'s network stack.',
  TypeScript: 'Transpiles to JavaScript in-browser via the official TypeScript compiler, then runs natively with full HTTP support.',
  cURL: 'Sends a genuine HTTP request straight from your browser, formatted like a curl transcript.',
};

function SandboxTab() {
  const [lang, setLang] = useState<Lang>('JavaScript');
  const [path, setPath] = useState('users/revyid');
  const [code, setCode] = useState(sdkCode('JavaScript', 'users/revyid'));
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const codeRef = useRef(code);
  const langRef = useRef(lang);
  codeRef.current = code;
  langRef.current = lang;

  useEffect(() => {
    if (!running) { setCode(sdkCode(lang, path)); setLines([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, path]);

  const addLine = useCallback((line: string) => setLines(prev => [...prev, line]), []);

  const run = async () => {
    const src = codeRef.current;
    const curLang = langRef.current;
    setRunning(true);
    setLines([]);
    try {
      if (curLang === 'JavaScript') await runJS(src, addLine);
      else if (curLang === 'Python') await runPython(src, addLine);
      else if (curLang === 'TypeScript') await runTypeScript(src, addLine);
      else if (curLang === 'cURL') await runCurl(src, addLine);
    } catch (e: unknown) {
      addLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setRunning(false);
  };

  const reset = () => setCode(sdkCode(lang, path));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Sandbox</h1>
        <p className="text-body-sm text-muted-foreground">{LANG_INFO[lang]} Edit the code, then hit Run.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-surface-variant/50 rounded-lg p-0.5">
          {LANGS.map(l => (
            <button key={l} onClick={() => setLang(l)} disabled={running} className={`px-2.5 py-1 text-label-sm font-medium rounded-md transition-colors disabled:opacity-50 ${lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-variant/50 rounded-lg p-0.5">
          {PATHS.map(p => (
            <button key={p} onClick={() => setPath(p)} disabled={running} className={`px-2.5 py-1 text-label-sm font-mono rounded-md transition-colors disabled:opacity-50 ${path === p ? 'bg-surface text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {p.split('/').pop()}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[500px] rounded-xl border border-outline/20 overflow-hidden flex flex-col md:flex-row">
        <Editor code={code} setCode={setCode} onRun={run} onReset={reset} running={running} lang={lang} />
        <ConsoleOutput lines={lines} />
        {running && (
          <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl shadow-lg border border-outline/20">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-body-sm font-medium text-foreground">
                {lang === 'Python' ? 'Loading Python runtime...' : lang === 'TypeScript' ? 'Transpiling TypeScript...' : lang === 'cURL' ? 'Sending request...' : 'Running...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

const NAV = [
  { label: 'Getting Started', items: ['overview'] as TabId[] },
  { label: 'Reference', items: ['endpoints'] as TabId[] },
  { label: 'Tools', items: ['sandbox'] as TabId[] },
];

export default function DocsPage() {
  const [tab, setTab] = useState<TabId>('overview');
  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-outline/10">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors shrink-0 mr-1"><ArrowLeft className="w-4 h-4 text-muted-foreground" /></Link>
          {TABS.map(({ id, label }) => (<button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 text-label-sm font-medium rounded-lg transition-colors shrink-0 whitespace-nowrap ${tab === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>{label}</button>))}
        </div>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-outline/10 bg-background sticky top-0 h-screen overflow-y-auto">
          <div className="px-5 pt-6 pb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5"><ArrowLeft className="w-4 h-4" /><span className="text-label-sm font-medium">Back</span></Link>
            <p className="text-body-sm font-semibold text-foreground">Revvy API</p><p className="text-label-sm text-muted-foreground/50 mt-0.5">v1.0</p>
          </div>
          {NAV.map(sec => (
            <div key={sec.label} className="px-3 pb-3">
              <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">{sec.label}</p>
              {sec.items.map(id => {
                const t = TABS.find(x => x.id === id)!;
                const Icon = t.icon;
                return (
                  <button key={id} onClick={() => setTab(id)} className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors text-left ${tab === id ? 'bg-primary/8 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'}`}>
                    <Icon className="w-4 h-4 shrink-0 opacity-60" />{t.label}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 lg:py-8">
            {tab === 'overview' && <OverviewTab />}
            {tab === 'endpoints' && <EndpointsTab />}
            {tab === 'sandbox' && <SandboxTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
