'use client';

import { Copy, Check, Globe } from 'lucide-react';
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

const ENDPOINTS = [
  {
    method: 'GET', path: '/api/github?path=users/{username}', title: 'User Profile',
    desc: 'Returns public profile information for a GitHub user.',
    curl: 'curl -H "x-api-key: rv_your_key" "https://revy.my.id/api/github?path=users/torvalds"',
    response: '{\n  "login": "torvalds",\n  "name": "Linus Torvalds",\n  "bio": "Some people war over ideology. I war over code.",\n  "public_repos": 7,\n  "followers": 234000,\n  "created_at": "2011-09-03T15:26:22Z"\n}',
    fields: [['login', 'string', 'Username'], ['name', 'string | null', 'Display name'], ['bio', 'string | null', 'Biography'], ['public_repos', 'number', 'Public repos'], ['followers', 'number', 'Followers'], ['created_at', 'string', 'ISO 8601 date']],
  },
  {
    method: 'GET', path: '/api/github?path=users/{username}/repos', title: 'User Repositories',
    desc: 'List all public repositories for a user, sorted by last updated.',
    curl: 'curl -H "x-api-key: rv_your_key" "https://revy.my.id/api/github?path=users/revyid/repos"',
    response: '[\n  {\n    "name": "app",\n    "full_name": "revyid/app",\n    "stargazers_count": 2,\n    "language": "TypeScript",\n    "updated_at": "2026-07-02T10:00:00Z"\n  }\n]',
    fields: [['name', 'string', 'Repo name'], ['full_name', 'string', 'owner/name'], ['stargazers_count', 'number', 'Stars'], ['language', 'string | null', 'Language'], ['updated_at', 'string', 'ISO 8601 date']],
  },
  {
    method: 'GET', path: '/api/github?path=users/{username}/events', title: 'User Events',
    desc: 'Recent public activity: pushes, issues, PRs, forks.',
    curl: 'curl -H "x-api-key: rv_your_key" "https://revy.my.id/api/github?path=users/revyid/events"',
    response: '[\n  {\n    "type": "PushEvent",\n    "actor": { "login": "revyid" },\n    "repo": { "name": "revyid/app" },\n    "created_at": "2026-07-02T14:30:00Z"\n  }\n]',
    fields: [['type', 'string', 'Event type'], ['actor', 'object', '{ login, avatar_url }'], ['repo', 'object', '{ name, url }'], ['created_at', 'string', 'ISO 8601 timestamp']],
  },
  {
    method: 'GET', path: '/api/github?path=repos/{owner}/{repo}', title: 'Repository Details',
    desc: 'Full information about a specific repository.',
    curl: 'curl -H "x-api-key: rv_your_key" "https://revy.my.id/api/github?path=repos/facebook/react"',
    response: '{\n  "name": "react",\n  "full_name": "facebook/react",\n  "stargazers_count": 234000,\n  "forks_count": 47000,\n  "language": "JavaScript"\n}',
    fields: [['name', 'string', 'Repo name'], ['stargazers_count', 'number', 'Stars'], ['forks_count', 'number', 'Forks'], ['language', 'string | null', 'Language']],
  },
];

export default function ApiEndpointsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">API Endpoints</h1>
        <p className="text-body-sm text-muted-foreground">
          Base: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">https://revy.my.id/api/github</code>
        </p>
        <p className="text-body-sm text-muted-foreground mt-2">
          All requests require an API key. Get one at <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API Keys</Link>.
        </p>
      </div>

      {ENDPOINTS.map(ep => (
        <section key={ep.path} className="border-b border-outline/10 pb-8 last:border-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-label-sm font-mono font-medium">{ep.method}</span>
            <code className="text-[13px] font-mono text-foreground">{ep.path}</code>
          </div>
          <p className="text-body-sm text-muted-foreground mb-3">{ep.desc}</p>

          <p className="text-label-sm font-medium text-foreground mb-1">Request</p>
          <div className="my-2 rounded-xl border border-outline/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-variant/80 border-b border-outline/20">
              <span className="text-label-sm text-muted-foreground font-mono">bash</span>
              <CopyBtn text={ep.curl} />
            </div>
            <pre className="p-3 bg-surface-variant/50 overflow-x-auto"><code className="text-[13px] font-mono text-foreground whitespace-pre">{ep.curl}</code></pre>
          </div>

          <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Response</p>
          <div className="rounded-xl border border-outline/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-success/10 border-b border-outline/20">
              <span className="text-label-sm font-mono text-success font-medium">200 OK</span>
              <CopyBtn text={ep.response} />
            </div>
            <pre className="p-3 bg-surface-variant/50 overflow-x-auto max-h-48"><code className="text-[13px] font-mono text-foreground whitespace-pre">{ep.response}</code></pre>
          </div>

          <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Fields</p>
          <div className="rounded-xl border border-outline/15 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-surface-variant/50 border-b border-outline/15">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
              </tr></thead>
              <tbody>{ep.fields.map(([f, t, d]) => (
                <tr key={f} className="border-b border-outline/10 last:border-0">
                  <td className="py-1.5 px-3 font-mono text-primary">{f}</td>
                  <td className="py-1.5 px-3 font-mono text-muted-foreground">{t}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{d}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
