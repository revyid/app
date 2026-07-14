'use client';

import { Globe, Link2, PlayCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const APIS = [
  {
    href: '/docs/api-reference/github',
    icon: Globe,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'GitHub API',
    desc: 'Proxy for GitHub profiles, repositories, and activity.',
    tags: ['REST', 'API Key'],
  },
  {
    href: '/docs/api-reference/shorten',
    icon: Link2,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
    title: 'URL Shortener',
    desc: 'Create short links, track clicks, manage URLs.',
    tags: ['REST', 'Session Token'],
  },
  {
    href: '/docs/sandbox',
    icon: PlayCircle,
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary/10',
    title: 'Code Sandbox',
    desc: 'Run JavaScript, Python, TypeScript, cURL in-browser — plus Go, Rust, PHP via server-side glot.io proxy.',
    tags: ['Interactive'],
  },
  {
    href: '/api/portfolio',
    icon: Globe,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Portfolio API',
    desc: 'Public, edge-cached (1h) read access to the full portfolio dataset (profile, projects, skills, experience, etc.). No auth required.',
    tags: ['REST', 'Public', 'Cached'],
  },
];

export default function ApiReferencePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">API Reference</h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          REST APIs for GitHub data, URL shortening, and a live code sandbox.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Endpoints</h2>
        <div className="grid grid-cols-1 gap-4">
          {APIS.map(api => (
            <Link key={api.href} href={api.href}
              className="group block p-6 rounded-2xl bg-surface border border-outline/15 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${api.iconBg} flex items-center justify-center`}>
                  <api.icon className={`w-5 h-5 ${api.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-body-md font-semibold text-foreground group-hover:text-primary transition-colors">{api.title}</h3>
                  <p className="text-label-sm text-muted-foreground">{api.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {api.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-surface-variant text-label-sm text-muted-foreground font-mono">{tag}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Base URL</h2>
        <CodeBlock code="https://revy.my.id" />
        <p className="text-body-sm text-muted-foreground mt-2">
          All API endpoints return JSON. Get your API key from{' '}
          <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API Keys</Link>.
        </p>
      </section>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="my-3 rounded-xl border border-outline/20 overflow-hidden">
      <pre className="p-3 bg-surface-variant/50 overflow-x-auto">
        <code className="text-[13px] font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
}
