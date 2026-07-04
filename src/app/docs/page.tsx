import { Globe, Code as CodeIcon, PlayCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Revvy Docs</h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          API documentation, interactive sandbox, and developer tools.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/docs/api-reference" className="group block p-6 rounded-2xl bg-surface border border-outline/15 hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-body-md font-semibold text-foreground group-hover:text-primary transition-colors">Revvy API</h3>
                <p className="text-label-sm text-muted-foreground">GitHub data proxy</p>
              </div>
            </div>
            <p className="text-body-sm text-muted-foreground">RESTful API for GitHub profiles, repos, and events.</p>
          </Link>

          <Link href="/docs/curl-ts" className="group block p-6 rounded-2xl bg-surface border border-outline/15 hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CodeIcon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-body-md font-semibold text-foreground group-hover:text-primary transition-colors">curl-ts</h3>
                <p className="text-label-sm text-muted-foreground">cURL for TypeScript</p>
              </div>
            </div>
            <p className="text-body-sm text-muted-foreground">Parse and execute curl commands in browser and Node.js.</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/docs/api-reference/sandbox" className="group block p-6 rounded-2xl bg-surface border border-outline/15 hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-tertiary" />
              </div>
              <div>
                <h3 className="text-body-md font-semibold text-foreground group-hover:text-primary transition-colors">Sandbox</h3>
                <p className="text-label-sm text-muted-foreground">Run code in-browser</p>
              </div>
            </div>
            <p className="text-body-sm text-muted-foreground">JavaScript, Python, TypeScript, cURL — all with real HTTP support.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
