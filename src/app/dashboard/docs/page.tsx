'use client';

import { ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="p-4 bg-surface-variant rounded-xl text-body-sm font-mono text-foreground overflow-x-auto">{code}</pre>
      <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-outline/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-body-sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-title-sm font-semibold text-foreground">API Documentation</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-headline-sm font-semibold text-foreground mb-2">Revvy API</h1>
          <p className="text-body-md text-muted-foreground">
            Access GitHub data through our proxy API. Create an API key to get started.
          </p>
        </div>

        {/* Authentication */}
        <section className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
          <h2 className="text-title-sm font-semibold text-foreground">Authentication</h2>
          <p className="text-body-sm text-muted-foreground">
            All requests require an API key in the <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary">x-api-key</code> header.
          </p>
          <CodeBlock code={`curl -H "x-api-key: rv_your_key_here" \\
  https://revy.my.id/api/github?path=users/revyid`} />
        </section>

        {/* Rate Limits */}
        <section className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
          <h2 className="text-title-sm font-semibold text-foreground">Rate Limits</h2>
          <ul className="space-y-2 text-body-sm text-muted-foreground">
            <li>• <strong>100 requests per hour</strong> per user (shared across all keys)</li>
            <li>• Rate limit headers: <code className="px-1.5 py-0.5 bg-surface-variant rounded">Retry-After</code> on 429</li>
            <li>• Without API key: 401 Unauthorized</li>
          </ul>
        </section>

        {/* Endpoints */}
        <section className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-6">
          <h2 className="text-title-sm font-semibold text-foreground">Endpoints</h2>

          <div className="space-y-4">
            <div className="p-4 bg-surface-variant/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded text-label-sm font-mono">GET</span>
                <code className="text-body-sm font-mono text-foreground">/api/github?path=users/{'{username}'}</code>
              </div>
              <p className="text-body-sm text-muted-foreground">Get user profile and public info</p>
              <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid"`} />
            </div>

            <div className="p-4 bg-surface-variant/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded text-label-sm font-mono">GET</span>
                <code className="text-body-sm font-mono text-foreground">/api/github?path=users/{'{username}'}/repos</code>
              </div>
              <p className="text-body-sm text-muted-foreground">List user repositories</p>
              <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/repos"`} />
            </div>

            <div className="p-4 bg-surface-variant/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded text-label-sm font-mono">GET</span>
                <code className="text-body-sm font-mono text-foreground">/api/github?path=users/{'{username}'}/events</code>
              </div>
              <p className="text-body-sm text-muted-foreground">List user public events</p>
              <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=users/revyid/events"`} />
            </div>

            <div className="p-4 bg-surface-variant/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded text-label-sm font-mono">GET</span>
                <code className="text-body-sm font-mono text-foreground">/api/github?path=repos/{'{owner}'}/{'{repo}'}</code>
              </div>
              <p className="text-body-sm text-muted-foreground">Get repository details</p>
              <CodeBlock code={`curl -H "x-api-key: rv_your_key" \\
  "https://revy.my.id/api/github?path=repos/revyid/app"`} />
            </div>
          </div>
        </section>

        {/* Error Codes */}
        <section className="p-6 rounded-2xl bg-surface border border-outline/20 space-y-4">
          <h2 className="text-title-sm font-semibold text-foreground">Error Codes</h2>
          <div className="space-y-2 text-body-sm">
            <div className="flex gap-3"><code className="text-error font-mono">401</code><span className="text-muted-foreground">Missing or invalid API key</span></div>
            <div className="flex gap-3"><code className="text-error font-mono">403</code><span className="text-muted-foreground">Path not allowed</span></div>
            <div className="flex gap-3"><code className="text-warning font-mono">429</code><span className="text-muted-foreground">Rate limit exceeded (100 req/hr)</span></div>
            <div className="flex gap-3"><code className="text-error font-mono">502</code><span className="text-muted-foreground">GitHub API error or timeout</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
