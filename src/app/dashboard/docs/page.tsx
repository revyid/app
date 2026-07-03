'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, BookOpen, Key, Shield, Zap, Globe, Terminal, FileText, Monitor, Smartphone, Code, AlertTriangle, Lock, RefreshCw, Database } from 'lucide-react';
import Link from 'next/link';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-variant/80 rounded-t-xl border border-outline/20 border-b-0">
        <span className="text-label-sm text-muted-foreground font-mono">{language}</span>
        <button onClick={copy} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 bg-surface-variant/50 rounded-b-xl border border-outline/20 border-t-0 overflow-x-auto"><code className="text-body-sm font-mono text-foreground whitespace-pre-wrap">{code}</code></pre>
    </div>
  );
}

function ResponseBlock({ code, status = '200 OK' }: { code: string; status?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const isError = status.startsWith('4') || status.startsWith('5');
  const bgClass = isError ? 'bg-error/10' : 'bg-success-container/30';
  const borderClass = isError ? 'border-error/20' : 'border-success/20';
  const textClass = isError ? 'text-error' : 'text-success';
  return (
    <div className="relative group my-3">
      <div className={`flex items-center justify-between px-4 py-1.5 ${bgClass} rounded-t-xl border ${borderClass} border-b-0`}>
        <span className={`text-label-sm ${textClass} font-mono`}>Response {status}</span>
        <button onClick={copy} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 bg-surface-variant/50 rounded-b-xl border border-outline/20 border-t-0 overflow-x-auto"><code className="text-body-sm font-mono text-foreground whitespace-pre">{code}</code></pre>
    </div>
  );
}

function EndpointCard({ method, path, desc, auth = true }: { method: string; path: string; desc: string; auth?: boolean }) {
  const color = method === 'GET' ? 'bg-success/15 text-success border-success/30' : method === 'POST' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-error/15 text-error border-error/30';
  return (
    <div className="flex items-start gap-3 p-4 bg-surface-variant/30 rounded-xl border border-outline/10">
      <span className={`px-2 py-0.5 rounded text-label-sm font-mono font-medium shrink-0 ${color}`}>{method}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-body-sm font-mono text-foreground break-all">{path}</code>
          {auth && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-body-sm text-muted-foreground mt-1">{desc}</p>
      </div>
    </div>
  );
}

const sections = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'quickstart', label: 'Quick Start', icon: Zap },
  { id: 'authentication', label: 'Authentication', icon: Key },
  { id: 'endpoints', label: 'Endpoints', icon: Globe },
  { id: 'schemas', label: 'Response Schemas', icon: Database },
  { id: 'rate-limits', label: 'Rate Limits', icon: Shield },
  { id: 'errors', label: 'Error Handling', icon: FileText },
  { id: 'sdks', label: 'SDKs & Libraries', icon: Code },
  { id: 'examples', label: 'Code Examples', icon: Terminal },
  { id: 'platforms', label: 'Platform Support', icon: Monitor },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface-variant transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-title-sm font-semibold text-foreground">API Documentation</span>
          </div>
          <span className="text-label-sm text-muted-foreground font-mono">v1.0</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Sidebar Navigation */}
        <nav className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
          <div className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm transition-colors ${
                  activeSection === id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl space-y-12">
          {/* Overview */}
          <section id="overview">
            <h1 className="text-headline-sm font-bold text-foreground mb-2">Revvy API</h1>
            <p className="text-body-md text-muted-foreground mb-6">
              RESTful proxy API for accessing GitHub data. Create an API key, authenticate requests, and query user profiles, repositories, and events with built-in rate limiting and caching.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Key className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">API Keys</p>
                <p className="text-body-sm text-muted-foreground">Unlimited</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Shield className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">Rate Limited</p>
                <p className="text-body-sm text-muted-foreground">100 req/hr</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Zap className="w-6 h-6 text-tertiary mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">Cached</p>
                <p className="text-body-sm text-muted-foreground">5 min TTL</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Lock className="w-6 h-6 text-error mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">Required</p>
                <p className="text-body-sm text-muted-foreground">Auth only</p>
              </div>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quickstart">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Quick Start</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">1</div>
                <div>
                  <p className="text-body-md font-medium text-foreground">Get your API key</p>
                  <p className="text-body-sm text-muted-foreground">Go to <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard &rarr; API Keys</Link> and create a new key. Keys start with <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">rv_</code>.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">2</div>
                <div>
                  <p className="text-body-md font-medium text-foreground">Make your first request</p>
                  <CodeBlock code={`curl -H "x-api-key: rv_your_key_here" \\\n  "https://revy.my.id/api/github?path=users/revyid"`} />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0">3</div>
                <div>
                  <p className="text-body-md font-medium text-foreground">Get the response</p>
                  <ResponseBlock code={`{\n  "login": "revyid",\n  "name": "REVYID",\n  "bio": "~",\n  "public_repos": 11,\n  "followers": 1,\n  "created_at": "2024-08-30T23:13:12Z"\n}`} />
                </div>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Authentication</h2>
            <p className="text-body-md text-muted-foreground mb-4">
              All requests require an API key via the <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">x-api-key</code> header. Requests without a valid key return <code className="px-1.5 py-0.5 bg-surface-variant rounded text-error font-mono text-body-sm">401 Unauthorized</code>.
            </p>
            <h3 className="text-title-sm font-semibold text-foreground mb-3">Header Format</h3>
            <CodeBlock code={`x-api-key: rv_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`} language="http" />
            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-6">Creating Keys</h3>
            <p className="text-body-sm text-muted-foreground mb-2">
              Visit <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard &rarr; API Keys</Link> to create, view, and delete keys. Keys are shown <strong className="text-foreground">only once</strong> at creation time.
            </p>
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 mt-4">
              <p className="text-body-sm text-warning font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Security Note</p>
              <p className="text-body-sm text-muted-foreground mt-1">Store your API key securely. If lost, delete the old key and create a new one. Never expose keys in client-side code or public repositories.</p>
            </div>
          </section>

          {/* Endpoints */}
          <section id="endpoints">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Endpoints</h2>
            <p className="text-body-md text-muted-foreground mb-6">
              Base URL: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">https://revy.my.id/api/github</code>
            </p>

            <div className="space-y-3 mb-8">
              <EndpointCard method="GET" path="/api/github?path=users/{username}" desc="Get user profile and public information" />
              <EndpointCard method="GET" path="/api/github?path=users/{username}/repos" desc="List user repositories (sorted by last updated)" />
              <EndpointCard method="GET" path="/api/github?path=users/{username}/events" desc="List user public events (pushes, issues, PRs, forks, etc.)" />
              <EndpointCard method="GET" path="/api/github?path=repos/{owner}/{repo}" desc="Get detailed repository information" />
            </div>

            {/* User Profile */}
            <h3 className="text-title-sm font-semibold text-foreground mb-3">User Profile</h3>
            <p className="text-body-sm text-muted-foreground mb-2">Returns public profile information for a GitHub user.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/torvalds"`} />
            <ResponseBlock code={`{\n  "login": "torvalds",\n  "id": 1024025,\n  "node_id": "MDQ6VXNlcjEwMjQwMjU=",\n  "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",\n  "html_url": "https://github.com/torvalds",\n  "name": "Linus Torvalds",\n  "bio": "Some people war over ideology. I war over code.",\n  "blog": "https://github.com/torvalds",\n  "location": "Portland, OR",\n  "email": null,\n  "public_repos": 7,\n  "public_gists": 0,\n  "followers": 234000,\n  "following": 0,\n  "created_at": "2011-09-03T15:26:22Z",\n  "updated_at": "2026-07-01T12:56:54Z"\n}`} />

            {/* User Repos */}
            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-8">User Repositories</h3>
            <p className="text-body-sm text-muted-foreground mb-2">List all public repositories for a user, sorted by last updated.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/torvalds/repos"`} />
            <ResponseBlock code={`[\n  {\n    "id": 123456,\n    "name": "linux",\n    "full_name": "torvalds/linux",\n    "description": "Linux kernel source tree",\n    "html_url": "https://github.com/torvalds/linux",\n    "stargazers_count": 180000,\n    "watchers_count": 180000,\n    "forks_count": 55000,\n    "language": "C",\n    "topics": ["linux", "kernel", "os"],\n    "created_at": "2011-09-03T15:26:22Z",\n    "updated_at": "2026-07-02T10:00:00Z",\n    "pushed_at": "2026-07-02T10:00:00Z"\n  },\n  ...\n]`} />

            {/* Repo Details */}
            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-8">Repository Details</h3>
            <p className="text-body-sm text-muted-foreground mb-2">Get comprehensive information about a specific repository including stars, forks, issues, and more.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=repos/facebook/react"`} />
            <ResponseBlock code={`{\n  "id": 10270250,\n  "name": "react",\n  "full_name": "facebook/react",\n  "description": "The library for web and native user interfaces.",\n  "html_url": "https://github.com/facebook/react",\n  "stargazers_count": 234000,\n  "watchers_count": 234000,\n  "forks_count": 47000,\n  "open_issues_count": 1200,\n  "language": "JavaScript",\n  "topics": ["javascript", "ui", "frontend"],\n  "license": { "name": "MIT License" },\n  "created_at": "2013-05-24T16:15:54Z",\n  "updated_at": "2026-07-02T10:00:00Z"\n}`} />

            {/* User Events */}
            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-8">User Events</h3>
            <p className="text-body-sm text-muted-foreground mb-2">List recent public events for a user including pushes, issues, PRs, forks, stars, and more.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/torvalds/events"`} />
            <ResponseBlock code={`[\n  {\n    "id": "40123456789",\n    "type": "PushEvent",\n    "actor": {\n      "login": "torvalds",\n      "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4"\n    },\n    "repo": {\n      "name": "torvalds/linux",\n      "url": "https://api.github.com/repos/torvalds/linux"\n    },\n    "payload": {\n      "size": 3,\n      "commits": [\n        {\n          "sha": "abc123...",\n          "message": "Merge tag 'v6.10-rc1' of git://git.kernel.org/...",\n          "author": { "name": "Linus Torvalds", "email": "torvalds@linux-foundation.org" }\n        }\n      ]\n    },\n    "public": true,\n    "created_at": "2026-07-02T14:30:00Z"\n  },\n  ...\n]`} />
          </section>

          {/* Response Schemas */}
          <section id="schemas">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Response Schemas</h2>
            <p className="text-body-md text-muted-foreground mb-6">
              All responses are JSON. Here are the key fields for each endpoint.
            </p>

            <h3 className="text-title-sm font-semibold text-foreground mb-3">User Profile</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-outline/20">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    ['login', 'string', 'GitHub username'],
                    ['id', 'number', 'GitHub user ID'],
                    ['name', 'string | null', 'Display name'],
                    ['bio', 'string | null', 'User biography'],
                    ['blog', 'string | null', 'Website URL'],
                    ['location', 'string | null', 'Physical location'],
                    ['email', 'string | null', 'Public email'],
                    ['public_repos', 'number', 'Total public repositories'],
                    ['followers', 'number', 'Follower count'],
                    ['following', 'number', 'Following count'],
                    ['created_at', 'string', 'Account creation date (ISO 8601)'],
                    ['updated_at', 'string', 'Last profile update (ISO 8601)'],
                  ].map(([field, type, desc]) => (
                    <tr key={field} className="border-b border-outline/10">
                      <td className="py-2 px-3 font-mono text-primary text-label-sm">{field}</td>
                      <td className="py-2 px-3 font-mono text-label-sm text-muted-foreground">{type}</td>
                      <td className="py-2 px-3 text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-8">Repository</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-outline/20">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    ['name', 'string', 'Repository name'],
                    ['full_name', 'string', 'Owner/name format'],
                    ['description', 'string | null', 'Repository description'],
                    ['html_url', 'string', 'GitHub web URL'],
                    ['stargazers_count', 'number', 'Star count'],
                    ['forks_count', 'number', 'Fork count'],
                    ['open_issues_count', 'number', 'Open issues count'],
                    ['language', 'string | null', 'Primary language'],
                    ['topics', 'string[]', 'Repository topics/tags'],
                    ['created_at', 'string', 'Creation date (ISO 8601)'],
                    ['updated_at', 'string', 'Last update (ISO 8601)'],
                    ['pushed_at', 'string', 'Last push (ISO 8601)'],
                  ].map(([field, type, desc]) => (
                    <tr key={field} className="border-b border-outline/10">
                      <td className="py-2 px-3 font-mono text-primary text-label-sm">{field}</td>
                      <td className="py-2 px-3 font-mono text-label-sm text-muted-foreground">{type}</td>
                      <td className="py-2 px-3 text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-8">Event</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-outline/20">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Field</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    ['id', 'string', 'Event ID'],
                    ['type', 'string', 'Event type (PushEvent, IssuesEvent, PullRequestEvent, etc.)'],
                    ['actor', 'object', 'User who triggered the event { login, avatar_url }'],
                    ['repo', 'object', 'Repository { name, url }'],
                    ['payload', 'object', 'Event-specific data (commits, issue, PR, etc.)'],
                    ['public', 'boolean', 'Whether the event is public'],
                    ['created_at', 'string', 'Event timestamp (ISO 8601)'],
                  ].map(([field, type, desc]) => (
                    <tr key={field} className="border-b border-outline/10">
                      <td className="py-2 px-3 font-mono text-primary text-label-sm">{field}</td>
                      <td className="py-2 px-3 font-mono text-label-sm text-muted-foreground">{type}</td>
                      <td className="py-2 px-3 text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Rate Limits</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">Per-User Limit</h3>
                <p className="text-body-sm text-muted-foreground">
                  <strong className="text-foreground">100 requests per hour</strong> &mdash; shared across all your API keys. Creating multiple keys does not multiply your quota.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">Rate Limit Response</h3>
                <p className="text-body-sm text-muted-foreground mb-2">When you exceed the limit:</p>
                <ResponseBlock code={`HTTP/1.1 429 Too Many Requests\nRetry-After: 3600\n\n{\n  "error": "Rate limit exceeded."\n}`} status="429 Too Many Requests" />
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">GitHub API Limits</h3>
                <p className="text-body-sm text-muted-foreground">
                  Server-side, the proxy uses GitHub tokens (up to 5 rotated). Authenticated requests: <strong className="text-foreground">5,000 req/hr</strong>. Your API key limit (100/hr) applies on top.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">Caching</h3>
                <p className="text-body-sm text-muted-foreground">
                  Responses are cached server-side for <strong className="text-foreground">5 minutes</strong> (300s). Cached responses include <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">Cache-Control: public, s-maxage=300, stale-while-revalidate=600</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Error Handling */}
          <section id="errors">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Error Handling</h2>
            <p className="text-body-md text-muted-foreground mb-4">
              All errors return a JSON body with an <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">error</code> field describing the issue.
            </p>
            <div className="space-y-3">
              {[
                { code: '400', label: 'Bad Request', desc: 'Missing or invalid ?path= parameter', color: 'text-warning', example: '{"error":"Missing ?path= parameter"}' },
                { code: '401', label: 'Unauthorized', desc: 'Missing, invalid, or expired API key', color: 'text-error', example: '{"error":"API key required"}' },
                { code: '403', label: 'Forbidden', desc: 'Requested path is not in the allowed list', color: 'text-error', example: '{"error":"Path not allowed"}' },
                { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded (100 req/hr per user)', color: 'text-warning', example: '{"error":"Rate limit exceeded."}' },
                { code: '502', label: 'Bad Gateway', desc: 'GitHub API returned an error or timed out', color: 'text-error', example: '{"error":"GitHub API error: 500"}' },
              ].map(({ code, label, desc, color, example }) => (
                <div key={code} className="p-3 rounded-xl bg-surface-variant/30 border border-outline/10">
                  <div className="flex items-start gap-3">
                    <code className={`text-label-sm font-mono font-bold ${color}`}>{code}</code>
                    <div className="flex-1">
                      <span className="text-body-sm font-medium text-foreground">{label}</span>
                      <span className="text-body-sm text-muted-foreground"> &mdash; {desc}</span>
                      <div className="mt-2">
                        <code className="text-label-sm font-mono text-muted-foreground bg-surface px-2 py-1 rounded">{example}</code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SDKs */}
          <section id="sdks">
            <h2 className="text-title-lg font-bold text-foreground mb-4">SDKs &amp; Libraries</h2>
            <p className="text-body-md text-muted-foreground mb-6">
              The API works with any HTTP client. Here are community-maintained wrappers and official examples.
            </p>

            <h3 className="text-title-sm font-semibold text-foreground mb-3">Official Support</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { lang: 'cURL', desc: 'Command-line HTTP client', icon: Terminal },
                { lang: 'JavaScript', desc: 'Fetch API / Node.js / Bun / Deno', icon: Code },
                { lang: 'Python', desc: 'requests / httpx / aiohttp', icon: Code },
                { lang: 'Go', desc: 'net/http / resty', icon: Code },
                { lang: 'Rust', desc: 'reqwest / ureq', icon: Code },
                { lang: 'PHP', desc: 'Guzzle / cURL', icon: Code },
              ].map(({ lang, desc, icon: Icon }) => (
                <div key={lang} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-outline/10">
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-body-sm font-medium text-foreground">{lang}</p>
                    <p className="text-label-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Code Examples */}
          <section id="examples">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Code Examples</h2>

            <h3 className="text-title-sm font-semibold text-foreground mb-3">cURL</h3>
            <CodeBlock code={`# Get user profile\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/revyid"\n\n# Get user repos\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/revyid/repos"\n\n# Get repo details\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=repos/revyid/app"\n\n# Get user events\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/revyid/events"`} />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">JavaScript / TypeScript</h3>
            <CodeBlock code={`const API_KEY = 'rv_your_key';\nconst BASE = 'https://revy.my.id/api/github';\n\n// Fetch user profile\nasync function getUser(username: string) {\n  const res = await fetch(\n    \`\${BASE}?path=users/\${username}\`,\n    { headers: { 'x-api-key': API_KEY } }\n  );\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n}\n\n// Fetch with error handling & retry\nasync function safeFetch(path: string, retries = 2) {\n  for (let i = 0; i <= retries; i++) {\n    const res = await fetch(\n      \`\${BASE}?path=\${path}\`,\n      { headers: { 'x-api-key': API_KEY } }\n    );\n\n    if (res.status === 429) {\n      const retryAfter = parseInt(res.headers.get('Retry-After') || '60');\n      console.log(\`Rate limited. Retry after \${retryAfter}s\`);\n      await new Promise(r => setTimeout(r, retryAfter * 1000));\n      continue;\n    }\n\n    if (!res.ok) {\n      const err = await res.json();\n      throw new Error(err.error);\n    }\n\n    return res.json();\n  }\n  throw new Error('Max retries exceeded');\n}\n\n// Usage\nconst user = await getUser('revyid');\nconsole.log(\`\${user.name} — \${user.public_repos} repos\`);`} language="TypeScript" />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">Python</h3>
            <CodeBlock code={`import requests\nfrom typing import Optional\n\nAPI_KEY = "rv_your_key"\nBASE = "https://revy.my.id/api/github"\n\ndef get_user(username: str) -> dict:\n    """Fetch GitHub user profile."""\n    res = requests.get(\n        f"{BASE}?path=users/{username}",\n        headers={"x-api-key": API_KEY}\n    )\n    res.raise_for_status()\n    return res.json()\n\ndef get_repos(username: str) -> list:\n    """Fetch user repositories."""\n    res = requests.get(\n        f"{BASE}?path=users/{username}/repos",\n        headers={"x-api-key": API_KEY}\n    )\n    res.raise_for_status()\n    return res.json()\n\ndef get_repo(owner: str, repo: str) -> dict:\n    """Fetch repository details."""\n    res = requests.get(\n        f"{BASE}?path=repos/{owner}/{repo}",\n        headers={"x-api-key": API_KEY}\n    )\n    res.raise_for_status()\n    return res.json()\n\n# Usage\nuser = get_user("revyid")\nprint(f"{user['name']} — {user['public_repos']} repos")\n\nrepos = get_repos("revyid")\nfor r in repos[:5]:\n    print(f"  {r['name']}: {r['stargazers_count']} stars")`} language="Python" />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">Go</h3>
            <CodeBlock code={`package main\n\nimport (\n\t"encoding/json"\n\t"fmt"\n\t"io"\n\t"net/http"\n)\n\nconst (\n\tAPIKey = "rv_your_key"\n\tBase   = "https://revy.my.id/api/github"\n)\n\nfunc getUser(username string) (map[string]any, error) {\n\treq, _ := http.NewRequest("GET", Base+"?path=users/"+username, nil)\n\treq.Header.Set("x-api-key", APIKey)\n\n\tresp, err := http.DefaultClient.Do(req)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tdefer resp.Body.Close()\n\n\tbody, _ := io.ReadAll(resp.Body)\n\tvar result map[string]any\n\tjson.Unmarshal(body, &result)\n\treturn result, nil\n}\n\nfunc main() {\n\tuser, _ := getUser("revyid")\n\tfmt.Printf("%s — %.0f repos\\n", user["name"], user["public_repos"])\n}`} language="Go" />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">Rust</h3>
            <CodeBlock code={`use serde::Deserialize;\nuse reqwest::Client;\n\n#[derive(Deserialize)]\nstruct GitHubUser {\n    login: String,\n    name: Option<String>,\n    public_repos: u32,\n    followers: u32,\n}\n\nasync fn get_user(username: &str) -> Result<GitHubUser, Box<dyn std::error::Error>> {\n    let client = Client::new();\n    let user: GitHubUser = client\n        .get(format!("https://revy.my.id/api/github?path=users/{username}"))\n        .header("x-api-key", "rv_your_key")\n        .send().await?\n        .json().await?;\n    Ok(user)\n}\n\n#[tokio::main]\nasync fn main() {\n    let user = get_user("revyid").await.unwrap();\n    println!("{} — {} repos", user.name.unwrap_or_default(), user.public_repos);\n}`} language="Rust" />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">PHP</h3>
            <CodeBlock code={`<?php\n$apiKey = 'rv_your_key';\n$base = 'https://revy.my.id/api/github';\n\nfunction getUser(string $username): array {\n    global $apiKey, $base;\n    $ch = curl_init(\"{$base}?path=users/{$username}\");\n    curl_setopt_array($ch, [\n        CURLOPT_HTTPHEADER => [\"x-api-key: {$apiKey}\"],\n        CURLOPT_RETURNTRANSFER => true,\n    ]);\n    $response = curl_exec($ch);\n    curl_close($ch);\n    return json_decode($response, true);\n}\n\n$user = getUser('revyid');\necho \"{$user['name']} — {$user['public_repos']} repos\\n\";\n?>`} language="PHP" />
          </section>

          {/* Platform Support */}
          <section id="platforms">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Platform Support</h2>
            <p className="text-body-md text-muted-foreground mb-6">
              The API is a standard REST/JSON endpoint. Any platform with HTTP support can use it.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { platform: 'Linux', status: 'Full', notes: 'curl, wget, any HTTP client', icon: Terminal },
                { platform: 'macOS', status: 'Full', notes: 'curl, Swift, any HTTP client', icon: Terminal },
                { platform: 'Windows', status: 'Full', notes: 'curl, PowerShell, .NET, any HTTP client', icon: Monitor },
                { platform: 'iOS', status: 'Full', notes: 'URLSession, Alamofire, any HTTP client', icon: Smartphone },
                { platform: 'Android', status: 'Full', notes: 'OkHttp, Retrofit, Ktor, any HTTP client', icon: Smartphone },
                { platform: 'Web (Browser)', status: 'Full', notes: 'Fetch API, axios, any HTTP client', icon: Globe },
                { platform: 'Serverless', status: 'Full', notes: 'Vercel, AWS Lambda, Cloudflare Workers', icon: Zap },
                { platform: 'Embedded / IoT', status: 'Full', notes: 'ArduinoHttpClient, ESP-IDF, any TCP/HTTP', icon: RefreshCw },
              ].map(({ platform, status, notes, icon: Icon }) => (
                <div key={platform} className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-outline/10">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-medium text-foreground">{platform}</p>
                      <span className="px-1.5 py-0.5 rounded text-label-sm font-medium bg-success/15 text-success">{status}</span>
                    </div>
                    <p className="text-label-sm text-muted-foreground mt-1">{notes}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline/10 mt-6">
              <h3 className="text-title-sm font-semibold text-foreground mb-2">Runtime Requirements</h3>
              <ul className="space-y-2 text-body-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> No SDK required &mdash; any HTTP client works</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> No CORS restrictions for server-side requests</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Browser requests restricted to same-origin (use a backend proxy for client-side)</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> HTTPS required for all requests</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Edge runtime compatible (Vercel Edge, Cloudflare Workers)</li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-outline/10 pt-6 mt-12">
            <p className="text-body-sm text-muted-foreground">
              Questions? Contact <a href="mailto:revy8k@gmail.com" className="text-primary hover:underline">revy8k@gmail.com</a> or open an issue on <a href="https://github.com/revyid/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
