'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Loader2, RotateCcw } from 'lucide-react';

type LogFn = (line: string) => void;

function makeCon(log: LogFn) {
  return {
    log: (...a: unknown[]) => log(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
    warn: (...a: unknown[]) => log('Warning: ' + a.join(' ')),
    error: (...a: unknown[]) => log('Error: ' + a.join(' ')),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms / 1000}s`)), ms))]);
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
      try { const body = await cloned.json(); log(JSON.stringify(body, null, 2)); }
      catch { log(await res.text()); }
      return res;
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e.name === 'AbortError' ? 'request timed out' : e.message) : String(e);
      log(`Error: ${msg}`);
      throw e instanceof Error ? e : new Error(msg);
    } finally { clearTimeout(timer); }
  };
}

async function runJS(code: string, log: LogFn): Promise<void> {
  const fn = new Function('fetch', 'console', `return (async()=>{\n${code}\n})()`);
  await withTimeout(Promise.resolve(fn(makeSandboxedFetch(log), makeCon(log))), 20000, 'Script');
}

let pyodideInst: any = null;
let pyodidePromise: Promise<any> | null = null;

async function getPyodide(): Promise<any> {
  if (pyodideInst) return pyodideInst;
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    try {
      if (!(window as any).loadPyodide) {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        document.head.appendChild(s);
        await new Promise<void>((res, rej) => { s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Python runtime')); });
      }
      const py = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' });
      await py.loadPackage('micropip');
      await py.runPythonAsync(`import micropip\nawait micropip.install(["requests", "pyodide-http"])\nimport pyodide_http\npyodide_http.patch_all()`);
      pyodideInst = py;
      return py;
    } catch (e) { pyodidePromise = null; throw e; }
  })();
  return pyodidePromise;
}

async function runPython(code: string, log: LogFn): Promise<void> {
  log('# Loading Python runtime (Pyodide / WebAssembly)...\n');
  const py = await getPyodide();
  log('# Runtime ready — running your code.\n');
  const filterNoise = (l: string) => !l.includes('InsecureRequestWarning') && !l.includes('warnings.warn') && !l.includes('urllib3');
  py.setStdout({ batched: (t: string) => t.split('\n').filter(Boolean).filter(filterNoise).forEach(l => log(l)) });
  py.setStderr({ batched: (t: string) => t.split('\n').filter(Boolean).filter(filterNoise).forEach(l => log('Error: ' + l)) });
  await withTimeout(py.runPythonAsync(code), 25000, 'Python script');
}

let tsCompiler: any = null;
async function getTsCompiler(): Promise<any> {
  if (tsCompiler) return tsCompiler;
  if (!(window as any).ts) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.min.js';
    document.head.appendChild(s);
    await new Promise<void>((res, rej) => { s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load TypeScript compiler')); });
  }
  tsCompiler = (window as any).ts;
  return tsCompiler;
}

async function runTypeScript(code: string, log: LogFn): Promise<void> {
  log('# Transpiling TypeScript to JavaScript...\n');
  const ts = await getTsCompiler();
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true } }).outputText;
  log('# Running transpiled code...\n');
  await runJS(js, log);
}

async function runCurl(code: string, log: LogFn): Promise<void> {
  try {
    const { CurlParser, browserCurl } = await import('@/lib/curl-browser');
    CurlParser(code);
    log(`> ${code.replace(/\n\s*/g, ' ').trim()}`);
    log('');
    const res = await browserCurl(code);
    log(`< HTTP/1.1 ${res.status} ${res.statusText}`);
    for (const [k, v] of Object.entries(res.headers)) log(`< ${k}: ${v}`);
    if (res.duration) log(`< time: ${res.duration}ms`);
    log('');
    if (typeof res.body === 'object') log(JSON.stringify(res.body, null, 2));
    else log(String(res.body));
  } catch (e: any) { log(`Error: ${e.message}`); }
}

/* ─── UI Components ────────────────────────────────────────────────── */

type Lang = 'JavaScript' | 'Python' | 'TypeScript' | 'cURL';
const LANGS: Lang[] = ['JavaScript', 'Python', 'TypeScript', 'cURL'];
const EXAMPLES = [
  { id: 'user', label: 'User Profile', path: 'users/revyid' },
  { id: 'repos', label: 'Repos', path: 'users/revyid/repos' },
  { id: 'events', label: 'Events', path: 'users/revyid/events' },
  { id: 'shorten', label: 'Shorten URL', path: '__shorten__' },
  { id: 'stats', label: 'URL Stats', path: '__stats__' },
];

const LANG_INFO: Record<Lang, string> = {
  JavaScript: 'Runs natively in your browser — real fetch, real response.',
  Python: 'Real CPython via Pyodide (WebAssembly); requests patched to use browser network.',
  TypeScript: 'Transpiles to JS via official TS compiler, then runs natively.',
  cURL: 'Parses curl commands and executes via server proxy — no CORS restrictions.',
};

function sdkCode(lang: Lang, p: string): string {
  const k = 'rv_your_key';

  // GitHub API examples
  if (p !== '__shorten__' && p !== '__stats__') {
    const url = `https://revy.my.id/api/github?path=${p}`;
    switch (lang) {
      case 'JavaScript': return `const API_KEY = '${k}';\nconst BASE = 'https://revy.my.id/api/github';\n\nasync function getData(path) {\n  const res = await fetch(\`\${BASE}?path=\${path}\`, {\n    headers: { 'x-api-key': API_KEY }\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n}\n\nconst data = await getData('${p}');\nconsole.log(data);`;
      case 'Python': return `import requests\n\nAPI_KEY = "${k}"\nBASE = "https://revy.my.id/api/github"\n\nres = requests.get(\n    f"{BASE}?path=${p}",\n    headers={"x-api-key": API_KEY},\n    timeout=10,\n)\nres.raise_for_status()\nprint(res.status_code)\nprint(res.json())`;
      case 'TypeScript': return `interface ApiResponse {\n  login: string;\n  name: string | null;\n  public_repos: number;\n  followers: number;\n}\n\nconst API_KEY: string = '${k}';\nconst BASE: string = 'https://revy.my.id/api/github';\n\nasync function getData(path: string): Promise<ApiResponse> {\n  const res = await fetch(\`\${BASE}?path=\${path}\`, {\n    headers: { 'x-api-key': API_KEY }\n  });\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json() as Promise<ApiResponse>;\n}\n\nconst data: ApiResponse = await getData('${p}');\nconsole.log(data);`;
      case 'cURL': return `curl -s -H "x-api-key: ${k}" \\\n  "${url}"`;
    }
  }

  // URL Shortener examples
  if (p === '__shorten__') {
    switch (lang) {
      case 'JavaScript': return `const API_KEY = '${k}';\n\nconst res = await fetch('https://revy.my.id/api/shorten', {\n  method: 'POST',\n  headers: {\n    'x-api-key': API_KEY,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    url: 'https://github.com/revyid/app',\n    slug: 'my-app'\n  })\n});\n\nconst data = await res.json();\nconsole.log(data.short_url);  // https://revy.my.id/s/my-app`;
      case 'Python': return `import requests\n\nAPI_KEY = "${k}"\n\nres = requests.post(\n    "https://revy.my.id/api/shorten",\n    headers={"x-api-key": API_KEY},\n    json={"url": "https://github.com/revyid/app", "slug": "my-app"},\n    timeout=10,\n)\nres.raise_for_status()\ndata = res.json()\nprint(data["short_url"])  # https://revy.my.id/s/my-app`;
      case 'TypeScript': return `const API_KEY: string = '${k}';\n\nconst res = await fetch('https://revy.my.id/api/shorten', {\n  method: 'POST',\n  headers: {\n    'x-api-key': API_KEY,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    url: 'https://github.com/revyid/app',\n    slug: 'my-app'\n  })\n});\n\nconst data: { short_url: string } = await res.json();\nconsole.log(data.short_url);  // https://revy.my.id/s/my-app`;
      case 'cURL': return `curl -s -X POST https://revy.my.id/api/shorten \\\n  -H "x-api-key: ${k}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://github.com/revyid/app","slug":"my-app"}'`;
    }
  }

  if (p === '__stats__') {
    switch (lang) {
      case 'JavaScript': return `const API_KEY = '${k}';\nconst SLUG = 'my-app';\n\nconst res = await fetch(\n  \`https://revy.my.id/api/shorten?slug=\${SLUG}\`,\n  { headers: { 'x-api-key': API_KEY } }\n);\n\nconst data = await res.json();\nconsole.log(\`Clicks: \${data.clicks}\`);`;
      case 'Python': return `import requests\n\nAPI_KEY = "${k}"\nSLUG = "my-app"\n\nres = requests.get(\n    f"https://revy.my.id/api/shorten?slug={SLUG}",\n    headers={"x-api-key": API_KEY},\n    timeout=10,\n)\nres.raise_for_status()\ndata = res.json()\nprint(f"Clicks: {data['clicks']}")`;
      case 'TypeScript': return `const API_KEY: string = '${k}';\nconst SLUG: string = 'my-app';\n\nconst res = await fetch(\n  \`https://revy.my.id/api/shorten?slug=\${SLUG}\`,\n  { headers: { 'x-api-key': API_KEY } }\n);\n\nconst data: { clicks: number } = await res.json();\nconsole.log(\`Clicks: \${data.clicks}\`);`;
      case 'cURL': return `curl -s -H "x-api-key: ${k}" \\\n  "https://revy.my.id/api/shorten?slug=my-app"`;
    }
  }

  return '';
}

function ConsoleOutput({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div className="flex-1 min-h-[200px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-outline/10 shrink-0">
        <span className="text-label-sm text-muted-foreground/60 font-mono">console</span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-3 bg-background">
        {lines.length === 0 ? (
          <div className="text-[13px] font-mono text-muted-foreground/30">Output appears here...</div>
        ) : (
          <pre className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
            {lines.filter(l => l !== undefined).map((l, i) => {
              let cls = '';
              const s = l || '';
              if (s.startsWith('>') || s.startsWith('#') || s.startsWith('*')) cls = 'text-primary';
              else if (s.startsWith('< HTTP')) cls = /\s2\d\d\s/.test(s) ? 'text-green-500' : 'text-red-500';
              else if (s.startsWith('<')) cls = 'text-muted-foreground';
              else if (s.toLowerCase().startsWith('error') || s.toLowerCase().startsWith('warning') || s.includes('"error"')) cls = 'text-red-500';
              return <div key={i} className={cls}>{s}</div>;
            })}
          </pre>
        )}
      </div>
    </div>
  );
}

function Editor({ code, setCode, onRun, onReset, running, lang }: {
  code: string; setCode: (s: string) => void; onRun: () => void; onReset: () => void; running: boolean; lang?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; } }, [code]);
  return (
    <div className="flex-1 min-h-[200px] flex flex-col border-b md:border-b-0 md:border-r border-outline/20">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-outline/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-error/80" /><div className="w-2.5 h-2.5 rounded-full bg-warning/80" /><div className="w-2.5 h-2.5 rounded-full bg-success/80" /></div>
          {lang && <span className="text-label-sm text-muted-foreground/50 font-mono ml-1">{lang.toLowerCase()}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onReset} disabled={running} title="Reset" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-variant/60 transition-colors disabled:opacity-40">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRun} disabled={running} className="flex items-center gap-1.5 px-3 py-1 text-label-sm font-mono rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50">
            {running ? <><Square className="w-3 h-3" /> Running</> : <><Play className="w-3 h-3" /> Run</>}
          </button>
        </div>
      </div>
      <textarea ref={ref} value={code} onChange={e => setCode(e.target.value)} spellCheck={false} disabled={running}
        className="flex-1 w-full p-3 bg-background text-foreground font-mono text-[13px] leading-relaxed resize-none outline-none disabled:opacity-60" />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */

export default function SandboxPage() {
  const [lang, setLang] = useState<Lang>('JavaScript');
  const [example, setExample] = useState(EXAMPLES[0]);
  const [code, setCode] = useState(sdkCode('JavaScript', EXAMPLES[0].path));
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const codeRef = useRef(code);
  const langRef = useRef(lang);
  codeRef.current = code;
  langRef.current = lang;

  useEffect(() => { if (!running) { setCode(sdkCode(lang, example.path)); setLines([]); } }, [lang, example]);
  const addLine = useCallback((line: string) => setLines(prev => [...prev, line]), []);

  const run = async () => {
    const src = codeRef.current;
    const curLang = langRef.current;
    setRunning(true); setLines([]);
    try {
      if (curLang === 'JavaScript') await runJS(src, addLine);
      else if (curLang === 'Python') await runPython(src, addLine);
      else if (curLang === 'TypeScript') await runTypeScript(src, addLine);
      else if (curLang === 'cURL') await runCurl(src, addLine);
    } catch (e: unknown) { addLine(`Error: ${e instanceof Error ? e.message : String(e)}`); }
    setRunning(false);
  };

  const reset = () => setCode(sdkCode(lang, example.path));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Sandbox</h1>
        <p className="text-body-sm text-muted-foreground">{LANG_INFO[lang]} Edit code, then hit Run.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-surface-variant/50 rounded-lg p-0.5">
          {LANGS.map(l => (
            <button key={l} onClick={() => setLang(l)} disabled={running}
              className={`px-2.5 py-1 text-label-sm font-medium rounded-md transition-colors disabled:opacity-50 ${lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-variant/50 rounded-lg p-0.5">
          {EXAMPLES.map(ex => (
            <button key={ex.id} onClick={() => setExample(ex)} disabled={running}
              className={`px-2.5 py-1 text-label-sm font-medium rounded-md transition-colors disabled:opacity-50 ${example.id === ex.id ? 'bg-surface text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{ex.label}</button>
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
                {lang === 'Python' ? 'Loading Python...' : lang === 'TypeScript' ? 'Transpiling...' : 'Running...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
