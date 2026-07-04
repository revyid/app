'use client';

import { Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const go = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); };
  return (
    <button onClick={go} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
      {ok ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="my-3 rounded-xl border border-outline/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-variant/80 border-b border-outline/20">
        <span className="text-label-sm text-muted-foreground font-mono">{lang}</span>
        <CopyBtn text={code} />
      </div>
      <pre className="p-3 bg-surface-variant/50 overflow-x-auto"><code className="text-[13px] font-mono text-foreground whitespace-pre leading-relaxed">{code}</code></pre>
    </div>
  );
}

function EndpointSection({ method, path, title, desc, curl, response, fields }: {
  method: string; path: string; title: string; desc: string; curl: string; response: string; fields: string[][];
}) {
  const methodColor = method === 'GET' ? 'bg-primary/15 text-primary' : 'bg-success/15 text-success';
  return (
    <section className="border-b border-outline/10 pb-8 last:border-0">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-0.5 rounded ${methodColor} text-label-sm font-mono font-medium`}>{method}</span>
        <code className="text-[13px] font-mono text-foreground">{path}</code>
      </div>
      <h3 className="text-body-md font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-body-sm text-muted-foreground mb-3">{desc}</p>

      <p className="text-label-sm font-medium text-foreground mb-1">Request</p>
      <CodeBlock code={curl} />

      <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Response</p>
      <div className="rounded-xl border border-outline/20 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-success/10 border-b border-outline/20">
          <span className="text-label-sm font-mono text-success font-medium">200 OK</span>
          <CopyBtn text={response} />
        </div>
        <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-48"><code className="text-[13px] font-mono text-foreground whitespace-pre">{response}</code></pre>
      </div>

      <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Fields</p>
      <div className="rounded-xl border border-outline/15 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="bg-surface-variant/50 border-b border-outline/15">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
          </tr></thead>
          <tbody>{fields.map(([f, t, d]) => (
            <tr key={f} className="border-b border-outline/10 last:border-0">
              <td className="py-1.5 px-3 font-mono text-primary">{f}</td>
              <td className="py-1.5 px-3 font-mono text-muted-foreground">{t}</td>
              <td className="py-1.5 px-3 text-muted-foreground">{d}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function GitHubApiPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">GitHub API</h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          Proxy endpoint for GitHub data — profiles, repositories, and activity.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <p className="text-body-sm text-muted-foreground">
            Base: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">https://revy.my.id/api/github</code>
          </p>
          <p className="text-body-sm text-muted-foreground">
            Key: <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API Keys</Link>
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Quick Start</h2>
        <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/torvalds"`} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Authentication</h2>
        <p className="text-body-sm text-muted-foreground mb-2">
          All requests require an <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">x-api-key</code> header.
          Get your key from the <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard</Link>.
        </p>
        <p className="text-body-sm text-muted-foreground">
          The site&apos;s own API key (stored in Site Settings) bypasses rate limiting and is used for internal requests.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Endpoints</h2>

        <EndpointSection
          method="GET" path="/api/github?path=users/{username}"
          title="User Profile"
          desc="Fetch any GitHub user's public profile — name, bio, stats, and join date."
          curl={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/torvalds"`}
          response={`{
  "login": "torvalds",
  "name": "Linus Torvalds",
  "bio": "Some people war over ideology. I war over code.",
  "public_repos": 7,
  "followers": 234000,
  "created_at": "2011-09-03T15:26:22Z"
}`}
          fields={[
            ['login', 'string', 'Username'],
            ['name', 'string | null', 'Display name'],
            ['bio', 'string | null', 'Biography'],
            ['public_repos', 'number', 'Public repos'],
            ['followers', 'number', 'Followers'],
            ['created_at', 'string', 'ISO 8601 date'],
          ]}
        />

        <EndpointSection
          method="GET" path="/api/github?path=users/{username}/repos"
          title="User Repositories"
          desc="List all public repos for a user, sorted by last updated. Great for building portfolio dashboards."
          curl={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/repos"`}
          response={`[
  {
    "name": "app",
    "full_name": "revyid/app",
    "stargazers_count": 2,
    "language": "TypeScript",
    "updated_at": "2026-07-02T10:00:00Z"
  }
]`}
          fields={[
            ['name', 'string', 'Repo name'],
            ['full_name', 'string', 'owner/name'],
            ['stargazers_count', 'number', 'Stars'],
            ['language', 'string | null', 'Primary language'],
            ['updated_at', 'string', 'ISO 8601 date'],
          ]}
        />

        <EndpointSection
          method="GET" path="/api/github?path=users/{username}/events"
          title="User Activity"
          desc="Recent public activity — pushes, issues, PRs, and forks. Useful for activity feeds."
          curl={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/events"`}
          response={`[
  {
    "type": "PushEvent",
    "actor": { "login": "revyid" },
    "repo": { "name": "revyid/app" },
    "created_at": "2026-07-02T14:30:00Z"
  }
]`}
          fields={[
            ['type', 'string', 'Event type (PushEvent, IssuesEvent, etc.)'],
            ['actor', 'object', '{ login, avatar_url }'],
            ['repo', 'object', '{ name, url }'],
            ['created_at', 'string', 'ISO 8601 timestamp'],
          ]}
        />

        <EndpointSection
          method="GET" path="/api/github?path=repos/{owner}/{repo}"
          title="Repository Details"
          desc="Full metadata for any public repo — stars, forks, language, description, and dates."
          curl={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=repos/facebook/react"`}
          response={`{
  "name": "react",
  "full_name": "facebook/react",
  "description": "The library for web and native user interfaces.",
  "stargazers_count": 234000,
  "forks_count": 47000,
  "language": "JavaScript",
  "created_at": "2013-05-24T16:15:54Z",
  "updated_at": "2026-07-04T10:00:00Z"
}`}
          fields={[
            ['name', 'string', 'Repo name'],
            ['full_name', 'string', 'owner/name'],
            ['description', 'string | null', 'Repo description'],
            ['stargazers_count', 'number', 'Stars'],
            ['forks_count', 'number', 'Forks'],
            ['language', 'string | null', 'Primary language'],
            ['created_at', 'string', 'ISO 8601 date'],
            ['updated_at', 'string', 'ISO 8601 date'],
          ]}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Rate Limits</h2>
        <p className="text-body-sm text-muted-foreground mb-2">
          Default: 100 requests per minute per API key. The site&apos;s own key bypasses this limit.
        </p>
        <p className="text-body-sm text-muted-foreground">
          Responses are cached for 5 minutes to reduce GitHub API usage.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Errors</h2>
        <div className="rounded-xl border border-outline/15 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="bg-surface-variant/50 border-b border-outline/15">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cause</th>
            </tr></thead>
            <tbody>
              {[
                ['400', 'Missing or invalid ?path= parameter'],
                ['401', 'Missing or invalid API key'],
                ['403', 'Path not allowed (only users/*, repos/* supported)'],
                ['429', 'Rate limit exceeded (100/min per key)'],
              ].map(([s, c]) => (
                <tr key={s} className="border-b border-outline/10 last:border-0">
                  <td className="py-1.5 px-3 font-mono text-primary">{s}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
