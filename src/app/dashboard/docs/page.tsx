'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronRight, Play, Send, RotateCcw, Key, Shield, Zap, Globe, Terminal, Code as CodeIcon, AlertTriangle, Lock, Server, BookOpen } from 'lucide-react';
import Link from 'next/link';

/* ─── Shared primitives ───────────────────────────────────────────── */

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); };
  return (
    <button onClick={copy} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
      {ok ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function Code({ children, lang = 'bash' }: { children: string; lang?: string }) {
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
  return <span className={`px-2 py-0.5 rounded text-label-sm font-mono font-medium ${color}`}>{children}</span>;
}

/* ─── Collapsible card ────────────────────────────────────────────── */

function Collapsible({ title, subtitle, badge, children, defaultOpen = false }: {
  title: string; subtitle?: string; badge?: { color: string; text: string };
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-outline/15 bg-surface overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-variant/30 transition-colors">
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-foreground">{title}</p>
          {subtitle && <p className="text-label-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        {badge && <Badge color={badge.color}>{badge.text}</Badge>}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-outline/10">{children}</div>}
    </div>
  );
}

/* ─── Tab navigation ──────────────────────────────────────────────── */

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
    method: 'GET', path: '/api/github?path=users/{username}',
    title: 'User Profile', desc: 'Get public profile information for any GitHub user.',
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
      ['login', 'string', 'GitHub username'],
      ['name', 'string | null', 'Display name'],
      ['bio', 'string | null', 'User biography'],
      ['public_repos', 'number', 'Total public repositories'],
      ['followers', 'number', 'Follower count'],
      ['created_at', 'string', 'Account creation date (ISO 8601)'],
    ],
  },
  {
    method: 'GET', path: '/api/github?path=users/{username}/repos',
    title: 'User Repositories', desc: 'List all public repositories, sorted by last updated.',
    example: { path: 'users/revyid/repos', response: `[
  {
    "name": "app",
    "full_name": "revyid/app",
    "description": "Portfolio & API",
    "stargazers_count": 2,
    "forks_count": 0,
    "language": "TypeScript",
    "updated_at": "2026-07-02T10:00:00Z"
  },
  ...
]` },
    fields: [
      ['name', 'string', 'Repository name'],
      ['full_name', 'string', 'owner/name format'],
      ['stargazers_count', 'number', 'Star count'],
      ['forks_count', 'number', 'Fork count'],
      ['language', 'string | null', 'Primary language'],
      ['updated_at', 'string', 'Last update (ISO 8601)'],
    ],
  },
  {
    method: 'GET', path: '/api/github?path=users/{username}/events',
    title: 'User Events', desc: 'Recent public activity: pushes, issues, PRs, forks, stars, etc.',
    example: { path: 'users/revyid/events', response: `[
  {
    "id": "40123456789",
    "type": "PushEvent",
    "actor": { "login": "revyid" },
    "repo": { "name": "revyid/app" },
    "payload": {
      "size": 3,
      "commits": [{ "message": "fix: API key enforcement" }]
    },
    "created_at": "2026-07-02T14:30:00Z"
  }
]` },
    fields: [
      ['id', 'string', 'Event ID'],
      ['type', 'string', 'PushEvent, IssuesEvent, PullRequestEvent, etc.'],
      ['actor', 'object', 'User who triggered it { login, avatar_url }'],
      ['repo', 'object', 'Repository { name, url }'],
      ['payload', 'object', 'Event-specific data (commits, issue, PR)'],
      ['created_at', 'string', 'Event timestamp (ISO 8601)'],
    ],
  },
  {
    method: 'GET', path: '/api/github?path=repos/{owner}/{repo}',
    title: 'Repository Details', desc: 'Full info about a specific repository.',
    example: { path: 'repos/facebook/react', response: `{
  "name": "react",
  "full_name": "facebook/react",
  "description": "The library for web and native user interfaces.",
  "stargazers_count": 234000,
  "forks_count": 47000,
  "open_issues_count": 1200,
  "language": "JavaScript",
  "topics": ["javascript", "ui", "frontend"],
  "license": { "name": "MIT License" },
  "created_at": "2013-05-24T16:15:54Z"
}` },
    fields: [
      ['name', 'string', 'Repository name'],
      ['stargazers_count', 'number', 'Stars'],
      ['forks_count', 'number', 'Forks'],
      ['open_issues_count', 'number', 'Open issues'],
      ['language', 'string | null', 'Primary language'],
      ['topics', 'string[]', 'Repository tags'],
    ],
  },
];

/* ─── Try-It simulator ────────────────────────────────────────────── */

function TryItSimulator() {
  const [apiKey, setApiKey] = useState('');
  const [path, setPath] = useState('users/revyid');
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(`/api/github?path=${encodeURIComponent(path)}`, {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });
      const body = await res.json();
      setResponse({ status: res.status, body: JSON.stringify(body, null, 2) });
    } catch (e: any) {
      setResponse({ status: 0, body: `Error: ${e.message}` });
    }
    setLoading(false);
  }, [apiKey, path]);

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="text-label-sm font-medium text-foreground mb-1 block">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="rv_your_key_here"
            className="w-full px-3 py-2.5 text-body-sm font-mono rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="text-label-sm font-medium text-foreground mb-1 block">Path</label>
          <div className="flex gap-2">
            <span className="px-3 py-2.5 text-body-sm font-mono text-muted-foreground bg-surface-variant rounded-l-xl border border-r-0 border-border">/api/github?path=</span>
            <input
              type="text"
              value={path}
              onChange={e => setPath(e.target.value)}
              className="flex-1 px-3 py-2.5 text-body-sm font-mono rounded-r-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Quick paths */}
      <div className="flex flex-wrap gap-2">
        {['users/revyid', 'users/torvalds', 'users/torvalds/repos', 'users/revyid/events', 'repos/facebook/react'].map(p => (
          <button key={p} onClick={() => setPath(p)} className="px-2.5 py-1 text-label-sm font-mono rounded-lg bg-surface-variant hover:bg-surface-container-high text-muted-foreground hover:text-foreground transition-colors border border-outline/10">
            {p}
          </button>
        ))}
      </div>

      {/* Send button */}
      <button onClick={run} disabled={loading || !path} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Sending...' : 'Send Request'}
      </button>

      {/* Response */}
      {response && (
        <div className="rounded-xl border border-outline/20 overflow-hidden">
          <div className={`flex items-center justify-between px-3 py-1.5 border-b border-outline/20 ${response.status >= 200 && response.status < 300 ? 'bg-success/10' : response.status === 0 ? 'bg-error/10' : 'bg-warning/10'}`}>
            <span className={`text-label-sm font-mono font-medium ${response.status >= 200 && response.status < 300 ? 'text-success' : response.status === 0 ? 'text-error' : 'text-warning'}`}>
              {response.status === 0 ? 'Error' : response.status === 200 ? '200 OK' : response.status === 401 ? '401 Unauthorized' : response.status === 403 ? '403 Forbidden' : response.status === 429 ? '429 Rate Limited' : response.status === 502 ? '502 Bad Gateway' : response.status}
            </span>
            <CopyBtn text={response.body} />
          </div>
          <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-80"><code className="text-body-sm font-mono text-foreground whitespace-pre">{response.body}</code></pre>
        </div>
      )}
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
          RESTful proxy API for GitHub data. Requires an API key for every request. Responses are cached server-side for 5 minutes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Lock, label: 'Authentication', desc: 'API key required for all requests', color: 'text-error' },
          { icon: Shield, label: 'Rate Limit', desc: '100 requests per hour per user', color: 'text-secondary' },
          { icon: Zap, label: 'Caching', desc: '5 min server-side cache', color: 'text-tertiary' },
          { icon: Server, label: 'Edge Runtime', desc: 'Runs on Vercel Edge', color: 'text-primary' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="p-3 rounded-xl bg-surface border border-outline/10">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-body-sm font-medium text-foreground">{label}</p>
            <p className="text-label-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <Collapsible title="Getting Your API Key" subtitle="3 steps to make your first request" defaultOpen>
        <ol className="space-y-3 text-body-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">1</span>
            <span>Go to <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard &rarr; API Keys</Link> and create a new key. Keys start with <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono">rv_</code>.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">2</span>
            <span>Copy the key immediately &mdash; it&apos;s shown only once.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">3</span>
            <span>Use it in the <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">x-api-key</code> header with any request.</span>
          </li>
        </ol>
        <div className="mt-3">
          <Code lang="bash">{`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid"`}</Code>
        </div>
      </Collapsible>

      <Collapsible title="Rate Limits" subtitle="100 req/hr per user">
        <div className="space-y-3 text-body-sm text-muted-foreground">
          <p>Each user gets <strong className="text-foreground">100 requests per hour</strong>. All your API keys share the same pool.</p>
          <p>When you hit the limit:</p>
          <Code lang="http">{`HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{"error": "Rate limit exceeded."}`}</Code>
          <p>Server-side, GitHub tokens provide up to <strong className="text-foreground">5,000 req/hr</strong> for the proxy itself.</p>
        </div>
      </Collapsible>

      <Collapsible title="Error Codes" subtitle="How errors are returned">
        <div className="space-y-2">
          {[
            ['400', 'Bad Request', 'Missing or invalid ?path= parameter'],
            ['401', 'Unauthorized', 'Missing or invalid API key'],
            ['403', 'Forbidden', 'Path not in the allowed list'],
            ['429', 'Too Many Requests', 'Rate limit exceeded'],
            ['502', 'Bad Gateway', 'GitHub API error or timeout'],
          ].map(([code, label, desc]) => (
            <div key={code} className="flex items-center gap-3 py-1.5">
              <Badge color={code === '401' || code === '403' || code === '502' ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning'}>{code}</Badge>
              <span className="text-body-sm text-foreground font-medium">{label}</span>
              <span className="text-body-sm text-muted-foreground">&mdash; {desc}</span>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

function EndpointsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-title-lg font-bold text-foreground mb-1">Endpoints</h2>
        <p className="text-body-sm text-muted-foreground">Base URL: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono">https://revy.my.id/api/github</code></p>
      </div>

      {ENDPOINTS.map(ep => (
        <Collapsible
          key={ep.path}
          title={ep.title}
          subtitle={ep.path}
          badge={{ color: 'bg-success/15 text-success', text: ep.method }}
        >
          <p className="text-body-sm text-muted-foreground mb-3">{ep.desc}</p>

          {/* Example request */}
          <p className="text-label-sm font-medium text-foreground mb-1">Request</p>
          <Code lang="bash">{`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=${ep.example.path}"`}</Code>

          {/* Example response */}
          <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Response</p>
          <div className="rounded-xl border border-outline/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-success/10 border-b border-outline/20">
              <span className="text-label-sm font-mono text-success font-medium">200 OK</span>
              <CopyBtn text={ep.example.response} />
            </div>
            <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-60"><code className="text-body-sm font-mono text-foreground whitespace-pre">{ep.example.response}</code></pre>
          </div>

          {/* Fields table */}
          <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Fields</p>
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
                {ep.fields.map(([field, type, desc]) => (
                  <tr key={field} className="border-b border-outline/10 last:border-0">
                    <td className="py-1.5 px-3 font-mono text-label-sm text-primary">{field}</td>
                    <td className="py-1.5 px-3 font-mono text-label-sm text-muted-foreground">{type}</td>
                    <td className="py-1.5 px-3 text-label-sm text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}

function TryItTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-title-lg font-bold text-foreground mb-1">Try It</h2>
        <p className="text-body-sm text-muted-foreground">Test the API directly from your browser. Enter your API key and pick a path.</p>
      </div>
      <TryItSimulator />
    </div>
  );
}

function SDKsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-title-lg font-bold text-foreground mb-1">SDKs &amp; Examples</h2>
        <p className="text-body-sm text-muted-foreground">Works with any HTTP client. Here are examples in popular languages.</p>
      </div>

      <Collapsible title="JavaScript / TypeScript" subtitle="Fetch API, works in Node.js, Bun, Deno, browsers">
        <Code lang="TypeScript">{`const API_KEY = 'rv_your_key';
const BASE = 'https://revy.my.id/api/github';

async function getUser(username: string) {
  const res = await fetch(
    \`\${BASE}?path=users/\${username}\`,
    { headers: { 'x-api-key': API_KEY } }
  );
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}

// With retry on rate limit
async function safeFetch(path: string) {
  const res = await fetch(
    \`\${BASE}?path=\${path}\`,
    { headers: { 'x-api-key': API_KEY } }
  );
  if (res.status === 429) {
    const wait = parseInt(res.headers.get('Retry-After') || '60');
    console.log(\`Rate limited. Retry in \${wait}s\`);
    await new Promise(r => setTimeout(r, wait * 1000));
    return safeFetch(path); // retry
  }
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

const user = await getUser('revyid');
console.log(\`\${user.name} — \${user.public_repos} repos\`);`}</Code>
      </Collapsible>

      <Collapsible title="Python" subtitle="requests library">
        <Code lang="Python">{`import requests

API_KEY = "rv_your_key"
BASE = "https://revy.my.id/api/github"

def get_user(username: str) -> dict:
    res = requests.get(
        f"{BASE}?path=users/{username}",
        headers={"x-api-key": API_KEY}
    )
    res.raise_for_status()
    return res.json()

def get_repos(username: str) -> list:
    res = requests.get(
        f"{BASE}?path=users/{username}/repos",
        headers={"x-api-key": API_KEY}
    )
    res.raise_for_status()
    return res.json()

user = get_user("revyid")
print(f"{user['name']} — {user['public_repos']} repos")

for repo in get_repos("revyid")[:5]:
    print(f"  {repo['name']}: {repo['stargazers_count']} stars")`}</Code>
      </Collapsible>

      <Collapsible title="Go" subtitle="net/http standard library">
        <Code lang="Go">{`package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const (
    APIKey = "rv_your_key"
    Base   = "https://revy.my.id/api/github"
)

func getUser(username string) (map[string]any, error) {
    req, _ := http.NewRequest("GET",
        Base+"?path=users/"+username, nil)
    req.Header.Set("x-api-key", APIKey)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    var result map[string]any
    json.Unmarshal(body, &result)
    return result, nil
}

func main() {
    user, _ := getUser("revyid")
    fmt.Printf("%s — %.0f repos\\n",
        user["name"], user["public_repos"])
}`}</Code>
      </Collapsible>

      <Collapsible title="Rust" subtitle="reqwest + serde">
        <Code lang="Rust">{`use serde::Deserialize;
use reqwest::Client;

#[derive(Deserialize)]
struct GitHubUser {
    login: String,
    name: Option<String>,
    public_repos: u32,
}

async fn get_user(username: &str)
    -> Result<GitHubUser, Box<dyn std::error::Error>>
{
    let user: GitHubUser = Client::new()
        .get(format!(
            "https://revy.my.id/api/github?path=users/{username}"
        ))
        .header("x-api-key", "rv_your_key")
        .send().await?
        .json().await?;
    Ok(user)
}

#[tokio::main]
async fn main() {
    let user = get_user("revyid").await.unwrap();
    println!("{} — {} repos",
        user.name.unwrap_or_default(),
        user.public_repos);
}`}</Code>
      </Collapsible>

      <Collapsible title="PHP" subtitle="cURL">
        <Code lang="PHP">{`<?php
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
echo "{$user['name']} — {$user['public_repos']} repos\n";
?>`}</Code>
      </Collapsible>

      <Collapsible title="cURL" subtitle="Command line">
        <Code lang="bash">{`# User profile
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid"

# User repos
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/repos"

# Repo details
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=repos/facebook/react"

# User events
curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/events"`}</Code>
      </Collapsible>

      <Collapsible title="Platform Support" subtitle="Works everywhere with HTTP">
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Linux', 'curl, wget, any HTTP client'],
            ['macOS', 'curl, Swift URLSession'],
            ['Windows', 'curl, PowerShell, .NET HttpClient'],
            ['iOS', 'URLSession, Alamofire'],
            ['Android', 'OkHttp, Retrofit, Ktor'],
            ['Web Browser', 'Fetch API, axios'],
            ['Serverless', 'Vercel, Lambda, Workers'],
            ['IoT / Embedded', 'ArduinoHttpClient, ESP-IDF'],
          ].map(([platform, notes]) => (
            <div key={platform} className="p-2.5 rounded-lg bg-surface border border-outline/10">
              <p className="text-body-sm font-medium text-foreground">{platform}</p>
              <p className="text-label-sm text-muted-foreground">{notes}</p>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function DocsPage() {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-title-sm font-semibold text-foreground">API Docs</span>
          <span className="ml-auto text-label-sm text-muted-foreground font-mono">v1.0</span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-outline/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-body-sm font-medium transition-colors border-b-2 shrink-0 ${
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'endpoints' && <EndpointsTab />}
        {tab === 'try-it' && <TryItTab />}
        {tab === 'sdks' && <SDKsTab />}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="border-t border-outline/10 pt-4">
          <p className="text-label-sm text-muted-foreground">
            Questions? <a href="mailto:revy8k@gmail.com" className="text-primary hover:underline">revy8k@gmail.com</a> &middot; <a href="https://github.com/revyid/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>
          </p>
        </div>
      </div>
    </div>
  );
}
