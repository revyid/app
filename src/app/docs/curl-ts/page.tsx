'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
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

export default function CurlTsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">curl-ts</h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          cURL for TypeScript — parse and execute curl commands in browser and Node.js.
        </p>
        <a href="https://github.com/Revy4k/cURL-ts" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-primary hover:underline text-body-sm font-medium">
          GitHub Repository <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Install</h2>
        <CodeBlock code="npm install curl-ts" lang="bash" />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Quick Start</h2>
        <CodeBlock lang="typescript" code={`import { curl } from 'curl-ts';\n\nconst res = await curl(\n  'curl -H "x-api-key: rv_xxx" "https://api.example.com/data"\n);\nconsole.log(res.body);`} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Parse Only</h2>
        <p className="text-body-sm text-muted-foreground mb-2">Parse a curl command string into a structured options object, without executing.</p>
        <CodeBlock lang="typescript" code={`import { parseCurlCommand } from 'curl-ts';\n\nconst options = parseCurlCommand(\n  'curl -X POST -d \'{"a":1}\' https://api.example.com'\n);\n\nconsole.log(options.method);  // "POST"\nconsole.log(options.body);    // \'{"a":1}\'\nconsole.log(options.url);     // "https://api.example.com"`} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">With Proxy (bypass CORS)</h2>
        <p className="text-body-sm text-muted-foreground mb-2">Pass a proxy URL to execute requests server-side, bypassing browser CORS restrictions.</p>
        <CodeBlock lang="typescript" code={`import { curl } from 'curl-ts';\n\nconst res = await curl(\n  'curl -H "Authorization: Bearer token" "https://api.example.com/data"',\n  '/api/curl-proxy'  // Your server-side proxy endpoint\n);\nconsole.log(res.body);`} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Supported Flags</h2>
        <div className="rounded-xl border border-outline/15 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="bg-surface-variant/50 border-b border-outline/15">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Flag</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
            </tr></thead>
            <tbody>
              {[
                ['-X, --request', 'HTTP method (GET, POST, PUT, DELETE, etc.)'],
                ['-H, --header', 'Custom header (repeatable for multiple headers)'],
                ['-d, --data, --data-raw', 'Request body (auto-sets method to POST)'],
                ['-F, --form', 'Multipart form data field'],
                ['-A, --user-agent', 'User-Agent header string'],
                ['-u, --user', 'Basic authentication (user:pass format)'],
                ['-b, --cookie', 'Cookie header string'],
                ['-c, --cookie-jar', 'Cookie jar filename (parsed, not written)'],
                ['-e, --referer', 'Referer header'],
                ['-L, --location', 'Follow HTTP redirects'],
                ['-v, --verbose', 'Verbose output flag'],
                ['-i, --include', 'Include response headers in output'],
                ['-G, --get', 'Force GET method with data as query params'],
                ['-k, --insecure', 'Skip SSL verification (ignored in browser)'],
                ['-s, --silent', 'Silent mode (parsed but no effect)'],
                ['--max-time', 'Request timeout in seconds'],
                ['--connect-timeout', 'Connection timeout in seconds'],
                ['--data-urlencode', 'URL-encoded form data'],
                ['--compressed', 'Enable compression flag'],
              ].map(([f, d]) => (
                <tr key={f} className="border-b border-outline/10 last:border-0">
                  <td className="py-1.5 px-3 font-mono text-primary whitespace-nowrap">{f}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Features</h2>
        <ul className="space-y-2 text-body-sm text-muted-foreground">
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Short flag combos: <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">-Lvk</code> expands to <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">-L -v -k</code></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Long option syntax: <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">--request=POST</code></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Line continuations: <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">\</code> + newline</li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Single and double quoted strings</li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Escaped characters inside quotes</li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Multiple <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">-H</code> headers (no overwrite)</li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Headers with multiple colons: <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">Authorization: Bearer a:b:c</code></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Empty and valueless headers</li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Multipart form data with <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">-F</code></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Cookie jar flag: <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">-c cookies.txt</code></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> URL before or after body data</li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Multiple <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">-d</code> concatenated with <code className="px-1 py-0.5 bg-surface-variant rounded text-primary font-mono text-[11px]">&amp;</code></li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-3">Types</h2>
        <CodeBlock lang="typescript" code={`interface CurlOptions {\n  method?: string;\n  url: string;\n  headers: Record<string, string>;\n  body?: string | Record<string, string> | [string, string][];\n  timeout?: number;\n  verbose: boolean;\n  user?: string;\n  redirect: 'follow' | 'error' | 'manual';\n  userAgent: string;\n  referer?: string;\n  cookie?: string;\n  cookieJar?: string;\n  insecure: boolean;\n  compressed: boolean;\n}\n\ninterface CurlResponse<T = any> {\n  status: number;\n  statusText: string;\n  headers: Record<string, string>;\n  body: T;\n  url: string;\n  ok: boolean;\n  duration: number;\n  curlCommand: string;\n}`} />
      </section>
    </div>
  );
}
