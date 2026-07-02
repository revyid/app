'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, BookOpen, Key, Shield, Zap, Globe, Terminal, FileText } from 'lucide-react';
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
      <pre className="p-4 bg-surface-variant/50 rounded-b-xl border border-outline/20 border-t-0 overflow-x-auto"><code className="text-body-sm font-mono text-foreground">{code}</code></pre>
    </div>
  );
}

function ResponseBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-4 py-1.5 bg-success-container/30 rounded-t-xl border border-success/20 border-b-0">
        <span className="text-label-sm text-success font-mono">Response 200 OK</span>
        <button onClick={copy} className="text-label-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 bg-surface-variant/50 rounded-b-xl border border-outline/20 border-t-0 overflow-x-auto"><code className="text-body-sm font-mono text-foreground whitespace-pre">{code}</code></pre>
    </div>
  );
}

function EndpointCard({ method, path, desc }: { method: string; path: string; desc: string }) {
  const color = method === 'GET' ? 'bg-success/15 text-success border-success/30' : method === 'POST' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-error/15 text-error border-error/30';
  return (
    <div className="flex items-start gap-3 p-4 bg-surface-variant/30 rounded-xl border border-outline/10">
      <span className={`px-2 py-0.5 rounded text-label-sm font-mono font-medium shrink-0 ${color}`}>{method}</span>
      <div>
        <code className="text-body-sm font-mono text-foreground">{path}</code>
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
  { id: 'rate-limits', label: 'Rate Limits', icon: Shield },
  { id: 'errors', label: 'Error Handling', icon: FileText },
  { id: 'examples', label: 'Examples', icon: Terminal },
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
      <header className="sticky top-0 z-40 glass border-b border-outline/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-body-sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-title-sm font-semibold text-foreground">API Documentation</span>
          <div className="w-20" />
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
              A RESTful proxy API for accessing GitHub data. Create an API key to authenticate requests, then query user profiles, repositories, and events.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Key className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">API Keys</p>
                <p className="text-body-sm text-muted-foreground">Create unlimited keys</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Shield className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">Rate Limited</p>
                <p className="text-body-sm text-muted-foreground">100 req/hour per user</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-outline/10 text-center">
                <Zap className="w-6 h-6 text-tertiary mx-auto mb-2" />
                <p className="text-label-sm font-medium text-foreground">Cached</p>
                <p className="text-body-sm text-muted-foreground">5 min server cache</p>
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
                  <p className="text-body-sm text-muted-foreground">Go to <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API Keys</Link> and create a new key.</p>
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
                  <ResponseBlock code={`{\n  "login": "revyid",\n  "name": "Revy",\n  "bio": "Full-stack software engineer",\n  "public_repos": 11,\n  "followers": 1,\n  "created_at": "2024-01-15T00:00:00Z"\n}`} />
                </div>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Authentication</h2>
            <p className="text-body-md text-muted-foreground mb-4">
              All API requests require an API key passed via the <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">x-api-key</code> header.
            </p>
            <p className="text-body-md text-muted-foreground mb-4">
              You can create API keys from the <Link href="/dashboard/api-keys" className="text-primary hover:underline">API Keys dashboard</Link>. Each key is prefixed with <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">rv_</code> for identification.
            </p>
            <h3 className="text-title-sm font-semibold text-foreground mb-3">Header Format</h3>
            <CodeBlock code={`x-api-key: rv_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`} language="http" />
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 mt-4">
              <p className="text-body-sm text-warning font-medium">Security Note</p>
              <p className="text-body-sm text-muted-foreground mt-1">API keys are shown only once when created. Store them securely. If lost, delete the key and create a new one.</p>
            </div>
          </section>

          {/* Endpoints */}
          <section id="endpoints">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Endpoints</h2>
            <p className="text-body-md text-muted-foreground mb-6">
              Base URL: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-body-sm">https://revy.my.id/api/github</code>
            </p>

            <div className="space-y-3 mb-6">
              <EndpointCard method="GET" path="/api/github?path=users/{username}" desc="Get user profile and public information" />
              <EndpointCard method="GET" path="/api/github?path=users/{username}/repos" desc="List user repositories (sorted by updated)" />
              <EndpointCard method="GET" path="/api/github?path=users/{username}/events" desc="List user public events (pushes, issues, PRs, etc.)" />
              <EndpointCard method="GET" path="/api/github?path=repos/{owner}/{repo}" desc="Get detailed repository information" />
            </div>

            <h3 className="text-title-sm font-semibold text-foreground mb-3">User Profile</h3>
            <p className="text-body-sm text-muted-foreground mb-2">Returns public profile information for a GitHub user.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/torvalds"`} />
            <ResponseBlock code={`{\n  "login": "torvalds",\n  "id": 1024025,\n  "name": "Linus Torvalds",\n  "bio": "Some people war over ideology. I war over code.",\n  "blog": "https://github.com/torvalds",\n  "location": "Portland, OR",\n  "public_repos": 7,\n  "followers": 234000,\n  "following": 0,\n  "created_at": "2011-09-03T15:26:22Z"\n}`} />

            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-6">User Repositories</h3>
            <p className="text-body-sm text-muted-foreground mb-2">List all public repositories for a user, sorted by last updated.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/torvalds/repos"`} />
            <ResponseBlock code={`[\n  {\n    "name": "linux",\n    "full_name": "torvalds/linux",\n    "description": "Linux kernel source tree",\n    "starcharts": 180000,\n    "language": "C",\n    "updated_at": "2026-07-02T10:00:00Z"\n  },\n  ...\n]`} />

            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-6">Repository Details</h3>
            <p className="text-body-sm text-muted-foreground mb-2">Get comprehensive information about a specific repository.</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=repos/facebook/react"`} />

            <h3 className="text-title-sm font-semibold text-foreground mb-3 mt-6">User Events</h3>
            <p className="text-body-sm text-muted-foreground mb-2">List recent public events for a user (pushes, issues, PRs, forks, etc.).</p>
            <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/torvalds/events"`} />
          </section>

          {/* Rate Limits */}
          <section id="rate-limits">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Rate Limits</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">Per-User Limit</h3>
                <p className="text-body-sm text-muted-foreground">
                  <strong className="text-foreground">100 requests per hour</strong> — shared across all your API keys. If you create 3 keys, they all share the same 100 req/hr pool.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">Rate Limit Headers</h3>
                <p className="text-body-sm text-muted-foreground mb-2">When you hit the limit, the API returns:</p>
                <CodeBlock code={`HTTP/1.1 429 Too Many Requests\nRetry-After: 3600\n\n{\n  "error": "Rate limit exceeded. Max 100 requests per hour."\n}`} language="http" />
              </div>

              <div className="p-4 rounded-xl bg-surface border border-outline/10">
                <h3 className="text-title-sm font-semibold text-foreground mb-2">GitHub API Limits</h3>
                <p className="text-body-sm text-muted-foreground">
                  Server-side, the proxy uses GitHub tokens for higher limits. Unauthenticated: 60 req/hr. With token: 5,000 req/hr. Your API key rate limit (100/hr) applies on top of this.
                </p>
              </div>
            </div>
          </section>

          {/* Error Handling */}
          <section id="errors">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Error Handling</h2>
            <div className="space-y-3">
              {[
                { code: '400', label: 'Bad Request', desc: 'Missing or invalid query parameters', color: 'text-warning' },
                { code: '401', label: 'Unauthorized', desc: 'Missing or invalid API key', color: 'text-error' },
                { code: '403', label: 'Forbidden', desc: 'Requested path is not in the allowed list', color: 'text-error' },
                { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded (100 req/hr)', color: 'text-warning' },
                { code: '502', label: 'Bad Gateway', desc: 'GitHub API error or timeout', color: 'text-error' },
              ].map(({ code, label, desc, color }) => (
                <div key={code} className="flex items-start gap-3 p-3 rounded-xl bg-surface-variant/30 border border-outline/10">
                  <code className={`text-label-sm font-mono font-bold ${color}`}>{code}</code>
                  <div>
                    <span className="text-body-sm font-medium text-foreground">{label}</span>
                    <span className="text-body-sm text-muted-foreground"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          <section id="examples">
            <h2 className="text-title-lg font-bold text-foreground mb-4">Code Examples</h2>

            <h3 className="text-title-sm font-semibold text-foreground mb-3">cURL</h3>
            <CodeBlock code={`# Get user profile\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/revyid"\n\n# Get user repos\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=users/revyid/repos"\n\n# Get repo details\ncurl -H "x-api-key: rv_your_key" \\\n  "https://revy.my.id/api/github?path=repos/revyid/app"`} />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">JavaScript / Node.js</h3>
            <CodeBlock code={`const API_KEY = 'rv_your_key';\nconst BASE = 'https://revy.my.id/api/github';\n\nasync function getUser(username) {\n  const res = await fetch(\n    \`\${BASE}?path=users/\${username}\`,\n    { headers: { 'x-api-key': API_KEY } }\n  );\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  return res.json();\n}\n\nconst user = await getUser('revyid');\nconsole.log(user.name, user.public_repos);`} language="javascript" />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">Python</h3>
            <CodeBlock code={`import requests\n\nAPI_KEY = "rv_your_key"\nBASE = "https://revy.my.id/api/github"\n\ndef get_user(username: str) -> dict:\n    res = requests.get(\n        f"{BASE}?path=users/{username}",\n        headers={"x-api-key": API_KEY}\n    )\n    res.raise_for_status()\n    return res.json()\n\nuser = get_user("revyid")\nprint(f"{user['name']} — {user['public_repos']} repos")`} language="python" />

            <h3 className="text-title-sm font-semibold text-foreground mb-3">Fetch with Error Handling</h3>
            <CodeBlock code={`async function safeFetch(path) {\n  const res = await fetch(\n    \`https://revy.my.id/api/github?path=\${path}\`,\n    { headers: { 'x-api-key': 'rv_your_key' } }\n  );\n\n  if (res.status === 429) {\n    const retryAfter = res.headers.get('Retry-After');\n    console.log(\`Rate limited. Retry after \${retryAfter}s\`);\n    return null;\n  }\n\n  if (!res.ok) {\n    const err = await res.json();\n    throw new Error(err.error);\n  }\n\n  return res.json();\n}`} language="javascript" />
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
