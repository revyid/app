'use client';

import { usePathname } from 'next/navigation';
import { ArrowLeft, BookOpen, Globe, Code as CodeIcon, PlayCircle } from 'lucide-react';
import Link from 'next/link';

const NAV = [
  { label: 'Getting Started', items: [
    { href: '/docs', label: 'Overview', icon: BookOpen },
  ]},
  { label: 'Revvy API', items: [
    { href: '/docs/api-reference', label: 'Endpoints', icon: Globe },
    { href: '/docs/api-reference/sandbox', label: 'Code Sandbox', icon: PlayCircle },
  ]},
  { label: 'Tools', items: [
    { href: '/docs/curl-ts', label: 'curl-ts', icon: CodeIcon },
  ]},
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-outline/10">
        <div className="flex items-center gap-2 px-3 py-2">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <span className="text-body-sm font-semibold text-foreground">Docs</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-outline/10 bg-background sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-label-sm font-medium">Home</span>
          </Link>
          <p className="text-body-sm font-semibold text-foreground">Docs</p>
          <p className="text-label-sm text-muted-foreground/50 mt-0.5">v1.0</p>
        </div>
        {NAV.map(sec => (
          <div key={sec.label} className="px-3 pb-3">
            <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">{sec.label}</p>
            {sec.items.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/docs' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors ${active ? 'bg-primary/8 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'}`}>
                  <Icon className="w-4 h-4 shrink-0 opacity-60" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 lg:py-8 pt-14 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
