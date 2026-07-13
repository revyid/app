'use client';

import { Copy, Check } from 'lucide-react';
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

function EndpointSection({ method, path, title, desc, request, response }: {
  method: string; path: string; title: string; desc: string; request?: string; response: string;
}) {
  const methodColor = method === 'GET' ? 'bg-primary/15 text-primary' : method === 'POST' ? 'bg-success/15 text-success' : 'bg-error/15 text-error';
  return (
    <section className="border-b border-outline/10 pb-8 last:border-0">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-0.5 rounded ${methodColor} text-label-sm font-mono font-medium`}>{method}</span>
        <code className="text-[13px] font-mono text-foreground">{path}</code>
      </div>
      <h3 className="text-body-md font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-body-sm text-muted-foreground mb-3">{desc}</p>
      {request && (
        <>
          <p className="text-label-sm font-medium text-foreground mb-1">Request</p>
          <CodeBlock code={request} lang="json" />
        </>
      )}
      <p className="text-label-sm font-medium text-foreground mb-1 mt-3">Response</p>
      <CodeBlock code={response} lang="json" />
    </section>
  );
}

export default function ShortenApiPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">URL Shortener</h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          Create short links, track clicks, and manage your URLs.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <p className="text-body-sm text-muted-foreground">
            Base: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">https://revy.my.id/api/shorten</code>
          </p>
          <p className="text-body-sm text-muted-foreground">
            Redirects: <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[13px]">https://revy.my.id/s/{'{slug}'}</code>
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Quick Start</h2>
        <CodeBlock code={`# Create a short URL
curl -X POST https://revy.my.id/api/shorten \\
  -H "x-api-key: rv_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://github.com/revyid/app","slug":"my-app"}'

# Result: https://revy.my.id/s/my-app

# Redirect (automatic)
curl -I https://revy.my.id/s/my-app
# → 302 Found
# → Location: https://github.com/revyid/app`} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Authentication</h2>
        <p className="text-body-sm text-muted-foreground">
          All requests require an <code className="px-1.5 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">x-api-key</code> header.
          Get your key from <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API Keys</Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Endpoints</h2>

        <EndpointSection
          method="POST" path="/api/shorten"
          title="Create Short URL"
          desc="Generate a short link. If no slug is provided, a random 7-character code is generated."
          request={`{
  "url": "https://github.com/revyid/app",
  "slug": "my-app"  // optional
}`}
          response={`{
  "id": "uuid",
  "slug": "my-app",
  "short_url": "https://revy.my.id/s/my-app",
  "original_url": "https://github.com/revyid/app",
  "created_at": "2026-07-04T12:00:00Z"
}`}
        />

        <EndpointSection
          method="GET" path="/api/shorten?slug={slug}"
          title="Get Click Stats"
          desc="Retrieve click count and metadata for a short URL you own."
          response={`{
  "id": "uuid",
  "slug": "my-app",
  "original_url": "https://github.com/revyid/app",
  "clicks": 42,
  "created_at": "2026-07-04T12:00:00Z"
}`}
        />

        <EndpointSection
          method="GET" path="/s/{slug}"
          title="Redirect"
          desc="Visit a short URL to redirect to the original. Automatically increments the click counter."
          response={`302 Found
Location: https://github.com/revyid/app`}
        />

        <EndpointSection
          method="DELETE" path="/api/shorten?slug={slug}"
          title="Delete Short URL"
          desc="Remove a short URL you own."
          response={`{ "ok": true }`}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Slug Rules</h2>
        <ul className="space-y-2 text-body-sm text-muted-foreground">
          <li>3-16 characters, lowercase alphanumeric + hyphens only</li>
          <li>If omitted, a random 7-character slug is auto-generated</li>
          <li>Slugs are unique — duplicate slugs return an error</li>
        </ul>
      </section>
    </div>
  );
}
