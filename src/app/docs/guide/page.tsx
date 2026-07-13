'use client';

import Link from 'next/link';
import { BookOpen, Key, Link2, Globe, Code, Shield, Zap, AlertTriangle } from 'lucide-react';

const sections = [
  {
    title: 'Getting Started',
    icon: Zap,
    content: `Revy is a full-stack platform offering GitHub API access, URL shortening, and a code sandbox. To use the API, you need an API key.`,
    steps: [
      'Sign in at revy.my.id',
      'Go to Dashboard → API Keys',
      'Click "Create Key" and give it a name',
      'Copy the key — it won\'t be shown again',
      'Use the key in the \`x-api-key\` header for all API requests',
    ],
  },
  {
    title: 'Authentication',
    icon: Shield,
    content: `All API requests require an API key passed via the \`x-api-key\` header. Keys can be created with optional expiry (30 days, 90 days, 6 months, 1 year, or unlimited).`,
    code: `curl -s -H "x-api-key: rv_your_key_here" \\
  "https://revy.my.id/api/github?path=users/revyid"`,
  },
  {
    title: 'GitHub API',
    icon: Globe,
    content: `Access GitHub data through our proxy. Pass any GitHub API path as the \`path\` query parameter.`,
    endpoints: [
      { method: 'GET', path: '/api/github?path=users/{username}', desc: 'Get user profile' },
      { method: 'GET', path: '/api/github?path=users/{username}/repos', desc: 'List user repositories' },
      { method: 'GET', path: '/api/github?path=users/{username}/events', desc: 'List user events' },
      { method: 'GET', path: '/api/github?path=repos/{owner}/{repo}', desc: 'Get repository details' },
    ],
  },
  {
    title: 'URL Shortener',
    icon: Link2,
    content: `Create short URLs that redirect to your target. Track clicks and manage your links.`,
    endpoints: [
      { method: 'POST', path: '/api/shorten', desc: 'Create a short URL' },
      { method: 'GET', path: '/api/shorten?slug={slug}', desc: 'Get URL stats' },
      { method: 'DELETE', path: '/api/shorten?slug={slug}', desc: 'Delete a short URL' },
    ],
    code: `curl -s -X POST https://revy.my.id/api/shorten \\
  -H "x-api-key: rv_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://github.com/revyid/app","slug":"my-app"}'`,
  },
  {
    title: 'Rate Limits',
    icon: AlertTriangle,
    content: `Each API key has a rate limit (default: 100 requests/hour). You can monitor usage in the Dashboard. Exceeding the limit will return a 429 status code.`,
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Guide</h1>
        <p className="text-body-md text-muted-foreground">
          Everything you need to know to get started with the Revy API platform.
        </p>
      </div>

      {sections.map((section, i) => (
        <section key={i} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
              <section.icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
          </div>

          <p className="text-body-sm text-muted-foreground leading-relaxed">{section.content}</p>

          {section.steps && (
            <ol className="space-y-2 text-body-sm text-muted-foreground list-decimal list-inside">
              {section.steps.map((step, j) => (
                <li key={j} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          )}

          {section.code && (
            <div className="rounded-xl border border-outline/20 overflow-hidden">
              <div className="px-3 py-1.5 bg-surface-variant/50 border-b border-outline/10">
                <span className="text-label-sm text-muted-foreground font-mono">Example</span>
              </div>
              <pre className="p-3 bg-surface-variant/30 overflow-x-auto">
                <code className="text-[13px] font-mono text-foreground whitespace-pre">{section.code}</code>
              </pre>
            </div>
          )}

          {section.endpoints && (
            <div className="rounded-xl border border-outline/20 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-surface-variant/50 border-b border-outline/15">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Method</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Endpoint</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {section.endpoints.map((ep, j) => (
                    <tr key={j} className="border-b border-outline/10 last:border-0">
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-label-sm font-mono font-medium ${
                          ep.method === 'GET' ? 'bg-success/15 text-success' :
                          ep.method === 'POST' ? 'bg-primary/15 text-primary' :
                          'bg-error/15 text-error'
                        }`}>{ep.method}</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-foreground">{ep.path}</td>
                      <td className="py-2 px-3 text-muted-foreground">{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <div className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Need help?</h2>
        <p className="text-body-sm text-muted-foreground">
          Check the <Link href="/docs/api-reference" className="text-primary hover:underline">API Reference</Link> for detailed endpoint documentation, or try the <Link href="/docs/sandbox" className="text-primary hover:underline">Sandbox</Link> to test API calls interactively.
        </p>
      </div>
    </div>
  );
}
