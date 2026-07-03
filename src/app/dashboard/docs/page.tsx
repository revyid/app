'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronRight, Play, Square, Pencil, BookOpen, Globe, Code as CodeIcon, PlayCircle } from 'lucide-react';
import Link from 'next/link';

/* ─── Primitives ──────────────────────────────────────────────────── */

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const go = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); };
  return (
    <button onClick={go} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
      {ok ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`px-2 py-0.5 rounded text-label-sm font-mono font-medium shrink-0 ${color}`}>{children}</span>;
}

/* ─── Accordion ───────────────────────────────────────────────────── */

function Accordion({ items }: { items: { key: string; title: string; subtitle?: string; badge?: { color: string; text: string }; content: React.ReactNode }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.key} className="rounded-xl border border-outline/15 bg-surface overflow-hidden">
          <button onClick={() => setOpen(open === item.key ? null : item.key)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-variant/30 transition-colors">
            {open === item.key ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-foreground">{item.title}</p>
              {item.subtitle && <p className="text-label-sm text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>}
            </div>
            {item.badge && <Badge color={item.badge.color}>{item.badge.text}</Badge>}
          </button>
          {open === item.key && <div className="px-4 pb-4 pt-1 border-t border-outline/10">{item.content}</div>}
        </div>
      ))}
    </div>
  );
}

/* ─── Tabs config ─────────────────────────────────────────────────── */

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'endpoints', label: 'Endpoints', icon: Globe },
  { id: 'try-it', label: 'Try It', icon: PlayCircle },
  { id: 'sdks', label: 'SDKs', icon: CodeIcon },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Endpoint data ───────────────────────────────────────────────── */

const ENDPOINTS = [
  {
    key: 'user-profile', method: 'GET', title: 'User Profile',
    subtitle: '/api/github?path=users/{username}',
    desc: 'Get public profile information for any GitHub user.',
    example: { path: 'users/torvalds', response: `{\n  "login": "torvalds",\n  "id": 1024025,\n  "name": "Linus Torvalds",\n  "bio": "Some people war over ideology. I war over code.",\n  "public_repos": 7,\n  "followers": 234000,\n  "created_at": "2011-09-03T15:26:22Z"\n}` },
    fields: [['login','string','GitHub username'],['name','string | null','Display name'],['bio','string | null','User biography'],['public_repos','number','Public repos count'],['followers','number','Follower count'],['created_at','string','ISO 8601 date']],
  },
  {
    key: 'user-repos', method: 'GET', title: 'User Repositories',
    subtitle: '/api/github?path=users/{username}/repos',
    desc: 'List all public repositories, sorted by last updated.',
    example: { path: 'users/revyid/repos', response: `[\n  {\n    "name": "app",\n    "full_name": "revyid/app",\n    "stargazers_count": 2,\n    "language": "TypeScript",\n    "updated_at": "2026-07-02T10:00:00Z"\n  }\n]` },
    fields: [['name','string','Repository name'],['full_name','string','owner/name'],['stargazers_count','number','Stars'],['language','string | null','Primary language']],
  },
  {
    key: 'user-events', method: 'GET', title: 'User Events',
    subtitle: '/api/github?path=users/{username}/events',
    desc: 'Recent public activity: pushes, issues, PRs, forks.',
    example: { path: 'users/revyid/events', response: `[\n  {\n    "id": "40123456789",\n    "type": "PushEvent",\n    "actor": { "login": "revyid" },\n    "repo": { "name": "revyid/app" },\n    "created_at": "2026-07-02T14:30:00Z"\n  }\n]` },
    fields: [['type','string','PushEvent, IssuesEvent, PullRequestEvent, etc.'],['actor','object','{ login, avatar_url }'],['created_at','string','ISO 8601 timestamp']],
  },
  {
    key: 'repo-details', method: 'GET', title: 'Repository Details',
    subtitle: '/api/github?path=repos/{owner}/{repo}',
    desc: 'Full info about a specific repository.',
    example: { path: 'repos/facebook/react', response: `{\n  "name": "react",\n  "stargazers_count": 234000,\n  "forks_count": 47000,\n  "language": "JavaScript"\n}` },
    fields: [['name','string','Repository name'],['stargazers_count','number','Stars'],['forks_count','number','Forks'],['language','string | null','Primary language']],
  },
];

/* ─── SDK code templates ──────────────────────────────────────────── */

function sdkCode(lang: string, path: string) {
  const url = `https://revy.my.id/api/github?path=${path}`;
  const key = 'rv_your_key';
  switch (lang) {
    case 'JavaScript':
      return `const API_KEY = '${key}';\nconst BASE = 'https://revy.my.id/api/github';\n\nasync function getData(path) {\n  const res = await fetch(\`\${BASE}?path=\${path}\`, {\n    headers: { 'x-api-key': API_KEY }\n  });\n  return res.json();\n}\n\nconst data = await getData('${path}');\nconsole.log(data);`;
    case 'Python':
      return `import requests\n\nAPI_KEY = "${key}"\nBASE = "https://revy.my.id/api/github"\n\nres = requests.get(\n    f"{BASE}?path=${path}",\n    headers={"x-api-key": API_KEY}\n)\nprint(res.json())`;
    case 'cURL':
      return `curl -s -H "x-api-key: ${key}" \\\n  "${url}"`;
    default:
      return `fetch("${url}", {\n  headers: { "x-api-key": "${key}" }\n}).then(r => r.json()).then(console.log);`;
  }
}

function sdkSub(lang: string) {
  switch (lang) {
    case 'JavaScript': return 'Fetch API — works in Node.js, Bun, Deno, browsers';
    case 'Python': return 'requests library';
    case 'cURL': return 'Command line';
    default: return '';
  }
}

const SDK_LANGS = ['JavaScript', 'Python', 'cURL'];
const SDK_PATHS = ['users/revyid', 'users/torvalds', 'repos/facebook/react'];

/* ─── Convert non-JS to executable JS ─────────────────────────────── */

function toExecutableJS(code: string): { js: string; note: string } {
  const trimmed = code.trim();

  // cURL: parse -H and URL
  if (trimmed.startsWith('curl')) {
    const urlMatch = trimmed.match(/"(https?:\/\/[^"]+)"/);
    const headerMatch = trimmed.match(/-H\s+"([^"]+)"/);
    const url = urlMatch?.[1] || '';
    const header = headerMatch?.[1] || '';
    const headerJS = header ? `{ '${header.split(':')[0].trim()}': '${header.split(':').slice(1).join(':').trim()}' }` : '{}';
    return {
      js: `fetch("${url}", { headers: ${headerJS} }).then(r => r.json()).then(d => console.log(d)).catch(e => console.error(e.message));`,
      note: '# Executing equivalent JavaScript fetch...',
    };
  }

  // Python: extract URL and headers
  if (trimmed.includes('import requests') || trimmed.includes('requests.get')) {
    const urlMatch = trimmed.match(/f?"([^"]+)"/);
    const headerMatch = trimmed.match(/headers\s*=\s*\{([^}]+)\}/);
    const url = urlMatch?.[1]?.replace(/\{[^}]+\}/g, (m) => {
      const varName = m.replace(/[{}]/g, '').trim();
      if (varName.startsWith('BASE')) return 'https://revy.my.id/api/github';
      if (varName === 'API_KEY') return 'rv_your_key';
      return m;
    }) || '';
    const headerStr = headerMatch?.[1] || '';
    let headerJS = '{}';
    if (headerStr.includes('x-api-key')) {
      headerJS = `{ 'x-api-key': 'rv_your_key' }`;
    }
    return {
      js: `fetch("${url}", { headers: ${headerJS} }).then(r => r.json()).then(d => console.log(d)).catch(e => console.error(e.message));`,
      note: '# Executing equivalent JavaScript fetch...',
    };
  }

  return { js: code, note: '' };
}

/* ─── Execute code in sandbox ─────────────────────────────────────── */

function executeCode(code: string): Promise<string[]> {
  return new Promise((resolve) => {
    const logs: string[] = [];
    const fakeConsole = {
      log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
      error: (...args: any[]) => logs.push('Error: ' + args.join(' ')),
    };

    // Convert non-JS to executable JS
    const { js, note } = toExecutableJS(code);
    if (note) logs.push(note);

    const fakeFetch = async (url: string, opts?: any) => {
      const t0 = performance.now();
      try {
        const res = await window.fetch(url, opts);
        const ms = Math.round(performance.now() - t0);
        logs.push(`> GET ${url}`);
        logs.push(`< HTTP/1.1 ${res.status}${res.status === 200 ? ' OK' : ''}`);
        const ct = res.headers.get('content-type');
        if (ct) logs.push(`< content-type: ${ct}`);
        logs.push(`< time: ${ms}ms`);
        logs.push('');
        const clone = res.clone();
        const body = await clone.json();
        logs.push(JSON.stringify(body, null, 2));
        if (res.ok) logs.push(`\n# ${ms}ms — ${Object.keys(body).length} fields`);
        return res;
      } catch (e: any) {
        logs.push(`Error: ${e.message}`);
        return new Response('{}', { status: 500 });
      }
    };

    try {
      // Wrap in async IIFE to support top-level await
      const wrapped = `(async () => { ${js} })();`;
      const fn = new Function('fetch', 'console', wrapped);
      const result = fn(fakeFetch, fakeConsole);
      if (result && typeof result.then === 'function') {
        result.then(() => resolve(logs)).catch((e: any) => { logs.push(`Error: ${e.message}`); resolve(logs); });
      } else {
        resolve(logs);
      }
    } catch (e: any) {
      logs.push(`Error: ${e.message}`);
      resolve(logs);
    }
  });
}

/* ─── Sandbox editor + Console ────────────────────────────────────── */

function SandboxEditor({ code, onRun, running }: { code: string; onRun: (code: string) => void; running: boolean }) {
  const [src, setSrc] = useState(code);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setSrc(code); }, [code]);
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  }, [src]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#13141c] border-b border-outline/10 shrink-0">
        <div className="flex items-center gap-2">
          <Pencil className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-label-sm text-muted-foreground/60 font-mono">editor</span>
        </div>
        <button onClick={() => onRun(src)} disabled={running} className="flex items-center gap-1.5 px-3 py-1 text-label-sm font-mono rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50">
          {running ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {running ? 'Stop' : 'Run'}
        </button>
      </div>
      <textarea ref={textareaRef} value={src} onChange={e => setSrc(e.target.value)} spellCheck={false}
        className="flex-1 w-full p-3 bg-[#1a1b26] text-[#a9b1d6] font-mono text-[13px] leading-relaxed resize-none outline-none" />
    </div>
  );
}

function ConsoleOutput({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#13141c] border-b border-outline/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-error/80" /><div className="w-2.5 h-2.5 rounded-full bg-warning/80" /><div className="w-2.5 h-2.5 rounded-full bg-success/80" /></div>
          <span className="text-label-sm text-muted-foreground/60 font-mono ml-1">console</span>
        </div>
        {lines.length > 0 && <CopyBtn text={lines.join('\n')} />}
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-3 bg-[#1a1b26]">
        {lines.length === 0 ? (
          <div className="text-[13px] font-mono text-muted-foreground/30">Click "Run" to execute...</div>
        ) : (
          <pre className="font-mono text-[13px] leading-relaxed text-[#a9b1d6]">
            {lines.map((l, i) => {
              let color = '';
              if (l.startsWith('$') || l.startsWith('#')) color = 'text-[#bb9af7]';
              else if (l.startsWith('>')) color = 'text-[#7aa2f7]';
              else if (l.startsWith('< HTTP')) color = l.includes('200') ? 'text-[#9ece6a]' : 'text-[#f7768e]';
              else if (l.startsWith('<')) color = 'text-[#565f89]';
              else if (l.startsWith('Error')) color = 'text-[#f7768e]';
              else if (l.includes('"error"')) color = 'text-[#f7768e]';
              return <div key={i} className={color}>{l || '\u00A0'}</div>;
            })}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ─── Tab content ─────────────────────────────────────────────────── */

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title-lg font-bold text-foreground mb-2">Revvy API</h2>
        <p className="text-body-md text-muted-foreground">RESTful proxy API for GitHub data. Requires an API key for every request.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '🔐', label: 'Auth Required', desc: 'x-api-key header' },
          { icon: '🛡️', label: 'Rate Limit', desc: '100 req/hr per user' },
          { icon: '⚡', label: 'Caching', desc: '5 min server cache' },
          { icon: '🌐', label: 'Edge Runtime', desc: 'Vercel Edge' },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="p-3 rounded-xl bg-surface border border-outline/10">
            <div className="text-xl mb-1">{icon}</div>
            <p className="text-body-sm font-medium text-foreground">{label}</p>
            <p className="text-label-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="text-title-sm font-semibold text-foreground">Quick Start</h3>
        <ol className="space-y-2 text-body-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">1</span>
            <span>Create a key at <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard &rarr; API Keys</Link>.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">2</span>
            <span>Copy it immediately &mdash; shown only once.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">3</span>
            <span>Pass it via <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">x-api-key</code> header.</span>
          </li>
        </ol>
      </div>
      <div className="space-y-2">
        <h3 className="text-title-sm font-semibold text-foreground">Error Codes</h3>
        <div className="space-y-1.5">
          {[['400','Bad Request','bg-warning/15 text-warning'],['401','Unauthorized','bg-error/15 text-error'],['403','Forbidden','bg-error/15 text-error'],['429','Too Many Requests','bg-warning/15 text-warning'],['502','Bad Gateway','bg-error/15 text-error']].map(([c, l, cl]) => (
            <div key={c} className="flex items-center gap-2 text-body-sm">
              <Badge color={cl}>{c}</Badge>
              <span className="text-foreground font-medium">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EndpointsTab() {
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-muted-foreground">Base: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">https://revy.my.id/api/github</code></p>
      <Accordion items={ENDPOINTS.map(ep => ({
        key: ep.key, title: ep.title, subtitle: ep.subtitle,
        badge: { color: 'bg-success/15 text-success', text: ep.method },
        content: (
          <div className="space-y-3">
            <p className="text-body-sm text-muted-foreground">{ep.desc}</p>
            <div>
              <p className="text-label-sm font-medium text-foreground mb-1">Response</p>
              <div className="rounded-xl border border-outline/20 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-success/10 border-b border-outline/20">
                  <span className="text-label-sm font-mono text-success font-medium">200 OK</span>
                  <CopyBtn text={ep.example.response} />
                </div>
                <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-48"><code className="text-body-sm font-mono text-foreground whitespace-pre">{ep.example.response}</code></pre>
              </div>
            </div>
            <div>
              <p className="text-label-sm font-medium text-foreground mb-1">Fields</p>
              <div className="rounded-xl border border-outline/15 overflow-hidden">
                <table className="w-full text-body-sm">
                  <thead><tr className="bg-surface-variant/50 border-b border-outline/15">
                    <th className="text-left py-2 px-3 text-label-sm text-muted-foreground font-medium">Field</th>
                    <th className="text-left py-2 px-3 text-label-sm text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-label-sm text-muted-foreground font-medium">Description</th>
                  </tr></thead>
                  <tbody>
                    {ep.fields.map(([f, t, d]) => (
                      <tr key={f} className="border-b border-outline/10 last:border-0">
                        <td className="py-1.5 px-3 font-mono text-label-sm text-primary">{f}</td>
                        <td className="py-1.5 px-3 font-mono text-label-sm text-muted-foreground">{t}</td>
                        <td className="py-1.5 px-3 text-label-sm text-muted-foreground">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ),
      }))} />
    </div>
  );
}

function TryItTab() {
  const defaultCode = `const API_KEY = 'rv_your_key';\nconst BASE = 'https://revy.my.id/api/github';\n\nconst res = await fetch(\n  \`\${BASE}?path=users/revyid\`,\n  { headers: { 'x-api-key': API_KEY } }\n);\nconst data = await res.json();\nconsole.log(data);`;
  const [code, setCode] = useState(defaultCode);
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const run = async (src: string) => { setRunning(true); setLines([]); const r = await executeCode(src); setLines(r); setRunning(false); };

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-muted-foreground">Edit code, click <strong className="text-foreground">Run</strong>. Executes in-browser against the real API.</p>
      <div className="h-[500px] rounded-xl border border-outline/20 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-outline/20">
          <SandboxEditor code={code} onRun={run} running={running} />
        </div>
        <div className="flex-1 min-h-[200px]">
          <ConsoleOutput lines={lines} />
        </div>
      </div>
    </div>
  );
}

function SDKsTab() {
  const [lang, setLang] = useState('JavaScript');
  const [path, setPath] = useState('users/revyid');
  const [code, setCode] = useState(sdkCode('JavaScript', 'users/revyid'));
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const switchLang = (l: string) => { setLang(l); setCode(sdkCode(l, path)); setLines([]); };
  const switchPath = (p: string) => { setPath(p); setCode(sdkCode(lang, p)); setLines([]); };
  const run = async (src: string) => { setRunning(true); setLines([]); const r = await executeCode(src); setLines(r); setRunning(false); };

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-muted-foreground">Pick a language, edit code, click <strong className="text-foreground">Run</strong>.</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-surface-variant/50 rounded-lg p-0.5">
          {SDK_LANGS.map(l => (
            <button key={l} onClick={() => switchLang(l)} className={`px-2.5 py-1 text-label-sm font-medium rounded-md transition-colors ${lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-variant/50 rounded-lg p-0.5">
          {SDK_PATHS.map(p => (
            <button key={p} onClick={() => switchPath(p)} className={`px-2.5 py-1 text-label-sm font-mono rounded-md transition-colors ${path === p ? 'bg-surface text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{p.split('/').pop()}</button>
          ))}
        </div>
      </div>
      <p className="text-label-sm text-muted-foreground">{sdkSub(lang)}</p>
      <div className="h-[500px] rounded-xl border border-outline/20 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-outline/20">
          <SandboxEditor code={code} onRun={run} running={running} />
        </div>
        <div className="flex-1 min-h-[200px]">
          <ConsoleOutput lines={lines} />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

const NAV_SECTIONS = [
  { label: 'Guide', items: TABS.filter(t => t.id === 'overview' || t.id === 'endpoints') },
  { label: 'Tools', items: TABS.filter(t => t.id === 'try-it' || t.id === 'sdks') },
];

export default function DocsPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const renderTab = () => {
    switch (tab) {
      case 'overview': return <OverviewTab />;
      case 'endpoints': return <EndpointsTab />;
      case 'try-it': return <TryItTab />;
      case 'sdks': return <SDKsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: horizontal scrollable tabs at top */}
      <div className="lg:hidden sticky top-0 z-50 bg-background border-b border-outline/15">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors shrink-0 mr-1">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-label-sm font-medium rounded-lg transition-colors shrink-0 ${tab === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Desktop: left sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-outline/10 bg-background sticky top-0 h-screen overflow-y-auto">
          <div className="px-5 pt-6 pb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-label-sm font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm">📖</span>
              </div>
              <div>
                <p className="text-body-sm font-semibold text-foreground">Revvy API</p>
                <p className="text-label-sm text-muted-foreground/60">v1.0</p>
              </div>
            </div>
          </div>

          {NAV_SECTIONS.map(sec => (
            <div key={sec.label} className="px-3 pb-2">
              <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">{sec.label}</p>
              <div className="space-y-0.5">
                {sec.items.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors text-left ${tab === id ? 'bg-primary/8 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'}`}>
                    <Icon className="w-4 h-4 shrink-0 opacity-60" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="px-5 pt-4 pb-4 border-t border-outline/10 mt-2">
            <a href="mailto:revy8k@gmail.com" className="text-label-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors">revy8k@gmail.com</a>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 lg:py-8">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
