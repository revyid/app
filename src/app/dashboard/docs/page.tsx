'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronRight, Play, Send, RotateCcw, Key, Shield, Zap, Globe, Terminal, Code as CodeIcon, Lock, Server, BookOpen, Square } from 'lucide-react';
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

function CodeBlock({ children, lang = 'bash' }: { children: string; lang?: string }) {
  return (
    <div className="my-2 rounded-xl border border-outline/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-variant/80 border-b border-outline/20">
        <span className="text-label-sm text-muted-foreground font-mono">{lang}</span>
        <CopyBtn text={children} />
      </div>
      <pre className="p-3 bg-surface-variant/50 overflow-x-auto"><code className="text-body-sm font-mono text-foreground whitespace-pre">{children}</code></pre>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`px-2 py-0.5 rounded text-label-sm font-mono font-medium shrink-0 ${color}`}>{children}</span>;
}

/* ─── Accordion (one open at a time) ──────────────────────────────── */

function Accordion({ items, id }: { items: { key: string; title: string; subtitle?: string; badge?: { color: string; text: string }; content: React.ReactNode }[]; id: string }) {
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

/* ─── Tabs (left sidebar) ─────────────────────────────────────────── */

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'endpoints', label: 'Endpoints', icon: Globe },
  { id: 'try-it', label: 'Try It', icon: Play },
  { id: 'sdks', label: 'SDKs', icon: CodeIcon },
] as const;
type TabId = typeof TABS[number]['id'];

/* ─── Endpoint data ───────────────────────────────────────────────── */

const ENDPOINTS = [
  {
    key: 'user-profile', method: 'GET', title: 'User Profile',
    subtitle: '/api/github?path=users/{username}',
    desc: 'Get public profile information for any GitHub user.',
    example: { path: 'users/torvalds', response: `{
  "login": "torvalds",
  "id": 1024025,
  "name": "Linus Torvalds",
  "bio": "Some people war over ideology. I war over code.",
  "blog": "https://github.com/torvalds",
  "location": "Portland, OR",
  "public_repos": 7,
  "followers": 234000,
  "following": 0,
  "created_at": "2011-09-03T15:26:22Z"
}` },
    fields: [
      ['login', 'string', 'GitHub username'], ['name', 'string | null', 'Display name'],
      ['bio', 'string | null', 'User biography'], ['public_repos', 'number', 'Public repos count'],
      ['followers', 'number', 'Follower count'], ['created_at', 'string', 'ISO 8601 date'],
    ],
  },
  {
    key: 'user-repos', method: 'GET', title: 'User Repositories',
    subtitle: '/api/github?path=users/{username}/repos',
    desc: 'List all public repositories, sorted by last updated.',
    example: { path: 'users/revyid/repos', response: `[
  {
    "name": "app",
    "full_name": "revyid/app",
    "description": "Portfolio & API",
    "stargazers_count": 2,
    "forks_count": 0,
    "language": "TypeScript",
    "updated_at": "2026-07-02T10:00:00Z"
  }
]` },
    fields: [
      ['name', 'string', 'Repository name'], ['full_name', 'string', 'owner/name'],
      ['stargazers_count', 'number', 'Stars'], ['language', 'string | null', 'Primary language'],
      ['updated_at', 'string', 'ISO 8601 date'],
    ],
  },
  {
    key: 'user-events', method: 'GET', title: 'User Events',
    subtitle: '/api/github?path=users/{username}/events',
    desc: 'Recent public activity: pushes, issues, PRs, forks, stars.',
    example: { path: 'users/revyid/events', response: `[
  {
    "id": "40123456789",
    "type": "PushEvent",
    "actor": { "login": "revyid" },
    "repo": { "name": "revyid/app" },
    "payload": { "size": 3, "commits": [{ "message": "fix: API key" }] },
    "created_at": "2026-07-02T14:30:00Z"
  }
]` },
    fields: [
      ['type', 'string', 'PushEvent, IssuesEvent, PullRequestEvent, etc.'],
      ['actor', 'object', '{ login, avatar_url }'], ['payload', 'object', 'Event-specific data'],
      ['created_at', 'string', 'ISO 8601 timestamp'],
    ],
  },
  {
    key: 'repo-details', method: 'GET', title: 'Repository Details',
    subtitle: '/api/github?path=repos/{owner}/{repo}',
    desc: 'Full info about a specific repository.',
    example: { path: 'repos/facebook/react', response: `{
  "name": "react",
  "full_name": "facebook/react",
  "description": "The library for web and native user interfaces.",
  "stargazers_count": 234000,
  "forks_count": 47000,
  "language": "JavaScript",
  "topics": ["javascript", "ui"],
  "license": { "name": "MIT License" }
}` },
    fields: [
      ['name', 'string', 'Repository name'], ['stargazers_count', 'number', 'Stars'],
      ['forks_count', 'number', 'Forks'], ['language', 'string | null', 'Primary language'],
      ['topics', 'string[]', 'Repository tags'],
    ],
  },
];

/* ─── SDK snippets ────────────────────────────────────────────────── */

const SDK_SNIPPETS = [
  {
    key: 'js', lang: 'JavaScript / TypeScript', sub: 'Fetch API — works in Node.js, Bun, Deno, browsers',
    code: `const API_KEY = 'rv_your_key';
const BASE = 'https://revy.my.id/api/github';

async function getUser(username) {
  const res = await fetch(
    \`\${BASE}?path=users/\${username}\`,
    { headers: { 'x-api-key': API_KEY } }
  );
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}

const user = await getUser('revyid');
console.log(\`\${user.name} — \${user.public_repos} repos\`);`,
    example: 'users/revyid',
  },
  {
    key: 'python', lang: 'Python', sub: 'requests library',
    code: `import requests

API_KEY = "rv_your_key"
BASE = "https://revy.my.id/api/github"

def get_user(username):
    res = requests.get(
        f"{BASE}?path=users/{username}",
        headers={"x-api-key": API_KEY}
    )
    res.raise_for_status()
    return res.json()

user = get_user("revyid")
print(f"{user['name']} — {user['public_repos']} repos")`,
    example: 'users/revyid',
  },
  {
    key: 'go', lang: 'Go', sub: 'net/http standard library',
    code: `package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func getUser(username string) (map[string]any, error) {
    req, _ := http.NewRequest("GET",
        "https://revy.my.id/api/github?path=users/"+username, nil)
    req.Header.Set("x-api-key", "rv_your_key")
    resp, err := http.DefaultClient.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    var result map[string]any
    json.Unmarshal(body, &result)
    return result, nil
}

func main() {
    user, _ := getUser("revyid")
    fmt.Printf("%s — %.0f repos\\n", user["name"], user["public_repos"])
}`,
    example: 'users/revyid',
  },
  {
    key: 'rust', lang: 'Rust', sub: 'reqwest + serde',
    code: `use serde::Deserialize;
use reqwest::Client;

#[derive(Deserialize)]
struct User { login: String, name: Option<String>, public_repos: u32 }

async fn get_user(u: &str) -> Result<User, Box<dyn std::error::Error>> {
    let user: User = Client::new()
        .get(format!("https://revy.my.id/api/github?path=users/{u}"))
        .header("x-api-key", "rv_your_key")
        .send().await?.json().await?;
    Ok(user)
}

#[tokio::main]
async fn main() {
    let u = get_user("revyid").await.unwrap();
    println!("{} — {} repos", u.name.unwrap_or_default(), u.public_repos);
}`,
    example: 'users/revyid',
  },
  {
    key: 'php', lang: 'PHP', sub: 'cURL',
    code: `<?php
$apiKey = 'rv_your_key';
$base = 'https://revy.my.id/api/github';

function getUser(string $username): array {
    global $apiKey, $base;
    $ch = curl_init("{$base}?path=users/{$username}");
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ["x-api-key: {$apiKey}"],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

$user = getUser('revyid');
echo "{$user['name']} — {$user['public_repos']} repos\\n";`,
    example: 'users/revyid',
  },
  {
    key: 'curl', lang: 'cURL', sub: 'Command line',
    code: `# User profile
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid"

# User repos
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/repos"

# Repo details
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=repos/facebook/react"`,
    example: 'users/revyid',
  },
];

/* ─── Terminal Try-It ─────────────────────────────────────────────── */

function TerminalSimulator() {
  const [lines, setLines] = useState<string[]>([
    '> Welcome to Revvy API Terminal',
    '> Type a command or click "Auto" to run a demo.',
    '',
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const run = useCallback(async (cmd?: string) => {
    const line = cmd || input.trim();
    if (!line) return;
    setInput('');
    setLoading(true);

    const parts = line.split(/\s+/);
    let path = '';
    let key = '';

    // Parse: "path users/revyid" or "key rv_xxx path users/revyid"
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'path' && parts[i + 1]) path = parts[++i];
      if (parts[i] === 'key' && parts[i + 1]) key = parts[++i];
    }
    if (!path) {
      setLines(p => [...p, `$ ${line}`, '  Error: usage: path <github-path> [key <api-key>]', '']);
      setLoading(false);
      return;
    }

    const cmdStr = `path ${path}` + (key ? ` key ${key.slice(0, 8)}...` : '');
    setLines(p => [...p, `$ ${cmdStr}`, '  Loading...']);

    try {
      const headers: Record<string, string> = {};
      if (key) headers['x-api-key'] = key;
      const res = await fetch(`/api/github?path=${encodeURIComponent(path)}`, { headers });
      const body = await res.json();

      setLines(p => {
        const next = [...p];
        next.pop(); // remove "Loading..."
        if (res.ok) {
          next.push(`  [${res.status} OK]`);
          const formatted = JSON.stringify(body, null, 2).split('\n');
          formatted.forEach(l => next.push('  ' + l));
        } else {
          next.push(`  [${res.status}] ${body.error || 'Unknown error'}`);
        }
        next.push('');
        return next;
      });
    } catch (e: any) {
      setLines(p => [...p.slice(0, -1), `  Error: ${e.message}`, '']);
    }
    setLoading(false);
  }, [input]);

  const autoDemo = async () => {
    const demos = [
      'path users/revyid key rv_your_key',
      'path users/torvalds key rv_your_key',
      'path users/revyid/repos key rv_your_key',
      'path repos/facebook/react key rv_your_key',
      'path users/revyid/events key rv_your_key',
    ];
    for (const d of demos) {
      await run(d);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const clear = () => setLines(['> Terminal cleared.', '']);

  return (
    <div className="rounded-xl border border-outline/20 overflow-hidden bg-[#1a1b26]">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#13141c] border-b border-outline/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error/80" />
          <div className="w-3 h-3 rounded-full bg-warning/80" />
          <div className="w-3 h-3 rounded-full bg-success/80" />
        </div>
        <span className="text-label-sm text-muted-foreground/60 font-mono ml-2">revvy-api ~ terminal</span>
        <div className="ml-auto flex gap-2">
          <button onClick={autoDemo} disabled={loading} className="flex items-center gap-1 px-2.5 py-1 text-label-sm font-mono rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50">
            {loading ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {loading ? 'Stop' : 'Auto'}
          </button>
          <button onClick={clear} className="flex items-center gap-1 px-2.5 py-1 text-label-sm font-mono rounded-md bg-surface-variant/50 text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Output */}
      <div ref={termRef} className="p-4 h-80 overflow-y-auto font-mono text-body-sm text-[#a9b1d6]">
        {lines.map((l, i) => (
          <div key={i} className={`whitespace-pre-wrap leading-relaxed ${l.startsWith('$') ? 'text-[#7aa2f7]' : l.startsWith('  [') && l.includes('OK]') ? 'text-[#9ece6a]' : l.startsWith('  [') && l.includes('4') ? 'text-[#f7768e]' : l.startsWith('  >') ? 'text-[#bb9af7]' : ''}`}>
            {l}
          </div>
        ))}
        {loading && <span className="animate-pulse">_</span>}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#13141c] border-t border-outline/10">
        <span className="text-[#7aa2f7] font-mono text-body-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && run()}
          placeholder='path users/revyid key rv_your_key'
          disabled={loading}
          className="flex-1 bg-transparent text-[#a9b1d6] font-mono text-body-sm outline-none placeholder:text-muted-foreground/30"
        />
        <button onClick={() => run()} disabled={loading || !input.trim()} className="p-1.5 rounded-md hover:bg-surface-variant/50 transition-colors disabled:opacity-30">
          <Send className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Help */}
      <div className="px-4 py-2 bg-[#13141c] border-t border-outline/10 text-label-sm font-mono text-muted-foreground/40">
        Usage: <span className="text-muted-foreground/60">path</span> {'<github-path>'} <span className="text-muted-foreground/60">[key</span> {'<api-key>'}<span className="text-muted-foreground/60">]</span> &middot; Try: path users/revyid key rv_your_key
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
        <p className="text-body-md text-muted-foreground">
          RESTful proxy API for GitHub data. Requires an API key for every request.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Lock, label: 'Auth Required', desc: 'x-api-key header', color: 'text-error' },
          { icon: Shield, label: 'Rate Limit', desc: '100 req/hr per user', color: 'text-secondary' },
          { icon: Zap, label: 'Caching', desc: '5 min server cache', color: 'text-tertiary' },
          { icon: Server, label: 'Edge Runtime', desc: 'Vercel Edge', color: 'text-primary' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="p-3 rounded-xl bg-surface border border-outline/10">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
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
            <span>Create a key at <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard &rarr; API Keys</Link>. Keys start with <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono">rv_</code>.</span>
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
        <CodeBlock lang="bash">{`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid"`}</CodeBlock>
      </div>

      <div className="space-y-2">
        <h3 className="text-title-sm font-semibold text-foreground">Rate Limits</h3>
        <p className="text-body-sm text-muted-foreground"><strong className="text-foreground">100 requests/hour</strong> per user. All keys share the same pool.</p>
        <CodeBlock lang="http">{`HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{"error": "Rate limit exceeded."}`}</CodeBlock>
      </div>

      <div className="space-y-2">
        <h3 className="text-title-sm font-semibold text-foreground">Error Codes</h3>
        <div className="space-y-1.5">
          {[
            ['400', 'Bad Request', 'Missing or invalid ?path=', 'bg-warning/15 text-warning'],
            ['401', 'Unauthorized', 'Missing or invalid API key', 'bg-error/15 text-error'],
            ['403', 'Forbidden', 'Path not allowed', 'bg-error/15 text-error'],
            ['429', 'Too Many Requests', 'Rate limit hit', 'bg-warning/15 text-warning'],
            ['502', 'Bad Gateway', 'GitHub API error', 'bg-error/15 text-error'],
          ].map(([c, l, d, cl]) => (
            <div key={c} className="flex items-center gap-2 text-body-sm">
              <Badge color={cl}>{c}</Badge>
              <span className="text-foreground font-medium">{l}</span>
              <span className="text-muted-foreground">&mdash; {d}</span>
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
      <p className="text-body-sm text-muted-foreground">
        Base: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">https://revy.my.id/api/github</code>
      </p>
      <Accordion
        id="endpoints"
        items={ENDPOINTS.map(ep => ({
          key: ep.key,
          title: ep.title,
          subtitle: ep.subtitle,
          badge: { color: 'bg-success/15 text-success', text: ep.method },
          content: (
            <div className="space-y-3">
              <p className="text-body-sm text-muted-foreground">{ep.desc}</p>
              <div>
                <p className="text-label-sm font-medium text-foreground mb-1">Request</p>
                <CodeBlock lang="bash">{`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=${ep.example.path}"`}</CodeBlock>
              </div>
              <div>
                <p className="text-label-sm font-medium text-foreground mb-1">Response</p>
                <div className="rounded-xl border border-outline/20 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-success/10 border-b border-outline/20">
                    <span className="text-label-sm font-mono text-success font-medium">200 OK</span>
                    <CopyBtn text={ep.example.response} />
                  </div>
                  <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-60"><code className="text-body-sm font-mono text-foreground whitespace-pre">{ep.example.response}</code></pre>
                </div>
              </div>
              <div>
                <p className="text-label-sm font-medium text-foreground mb-1">Fields</p>
                <div className="rounded-xl border border-outline/15 overflow-hidden">
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="bg-surface-variant/50 border-b border-outline/15">
                        <th className="text-left py-2 px-3 text-label-sm text-muted-foreground font-medium">Field</th>
                        <th className="text-left py-2 px-3 text-label-sm text-muted-foreground font-medium">Type</th>
                        <th className="text-left py-2 px-3 text-label-sm text-muted-foreground font-medium">Description</th>
                      </tr>
                    </thead>
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
        }))}
      />
    </div>
  );
}

function TryItTab() {
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-muted-foreground">
        Run API requests from a simulated terminal. Use <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">path</code> and <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">key</code> keywords, or click <strong className="text-foreground">Auto</strong> for a guided demo.
      </p>
      <TerminalSimulator />
    </div>
  );
}

function SDKsTab() {
  const [activeSdk, setActiveSdk] = useState(SDK_SNIPPETS[0].key);
  const [runOutput, setRunOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const snippet = SDK_SNIPPETS.find(s => s.key === activeSdk)!;

  const runSnippet = async () => {
    setRunning(true);
    setRunOutput(['> Running request...', '']);
    try {
      const res = await fetch(`/api/github?path=${encodeURIComponent(snippet.example)}`, {
        headers: { 'x-api-key': 'rv_your_key' },
      });
      const body = await res.json();
      const lines: string[] = [];
      if (res.ok) {
        lines.push(`> GET /api/github?path=${snippet.example}`);
        lines.push(`> Status: ${res.status} OK`);
        lines.push('');
        const formatted = JSON.stringify(body, null, 2).split('\n');
        formatted.forEach(l => lines.push(l));
        lines.push('');
        lines.push(`> Fields: ${Object.keys(body).join(', ')}`);
      } else {
        lines.push(`> GET /api/github?path=${snippet.example}`);
        lines.push(`> Status: ${res.status}`);
        lines.push(`> Error: ${body.error || 'Unknown'}`);
      }
      setRunOutput(lines);
    } catch (e: any) {
      setRunOutput([`> Error: ${e.message}`]);
    }
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-muted-foreground">Pick a language. Click <strong className="text-foreground">Run</strong> to test the snippet output.</p>

      {/* Language tabs */}
      <div className="flex flex-wrap gap-1.5">
        {SDK_SNIPPETS.map(s => (
          <button
            key={s.key}
            onClick={() => { setActiveSdk(s.key); setRunOutput([]); }}
            className={`px-3 py-1.5 text-label-sm font-medium rounded-lg transition-colors ${
              activeSdk === s.key ? 'bg-primary text-primary-foreground' : 'bg-surface-variant text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.lang}
          </button>
        ))}
      </div>

      {/* Code */}
      <div>
        <p className="text-label-sm text-muted-foreground mb-2">{snippet.sub}</p>
        <CodeBlock lang={snippet.lang}>{snippet.code}</CodeBlock>
      </div>

      {/* Run button */}
      <button onClick={runSnippet} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {running ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {running ? 'Running...' : 'Run this snippet'}
      </button>

      {/* Console output */}
      {runOutput.length > 0 && (
        <div className="rounded-xl border border-outline/20 overflow-hidden bg-[#1a1b26]">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#13141c] border-b border-outline/10">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
            </div>
            <span className="text-label-sm text-muted-foreground/60 font-mono ml-1">output</span>
            <CopyBtn text={runOutput.join('\n')} />
          </div>
          <pre className="p-3 font-mono text-body-sm text-[#a9b1d6] overflow-x-auto max-h-80">
            {runOutput.map((l, i) => (
              <div key={i} className={`whitespace-pre-wrap leading-relaxed ${l.startsWith('>') ? 'text-[#7aa2f7]' : l.includes('Status:') && l.includes('OK') ? 'text-[#9ece6a]' : l.includes('Status:') && l.includes('4') ? 'text-[#f7768e]' : l.includes('Error:') ? 'text-[#f7768e]' : l.includes('Fields:') ? 'text-[#bb9af7]' : ''}`}>
                {l}
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

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
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-outline/15 bg-surface/50 sticky top-0 h-screen">
        <div className="px-4 py-4 border-b border-outline/15">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-label-sm font-medium">Dashboard</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm transition-colors text-left ${
                tab === id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-outline/15">
          <span className="text-label-sm text-muted-foreground/50 font-mono">API v1.0</span>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline/15 flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-label-sm transition-colors ${
              tab === id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
