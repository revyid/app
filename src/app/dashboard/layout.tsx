'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Key, FileText, Home, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageTransition } from '@/components/shared/PageTransition';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, children: [
    { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  ]},
  { href: '/docs', label: 'Docs', icon: FileText, children: [
    { href: '/docs', label: 'Overview', icon: FileText },
    { href: '/docs/api-reference', label: 'API Reference', icon: FileText, children: [
      { href: '/docs/api-reference/github', label: 'GitHub API', icon: FileText },
      { href: '/docs/api-reference/shorten', label: 'URL Shortener', icon: FileText },
    ]},
    { href: '/docs/sandbox', label: 'Sandbox', icon: FileText },
    { href: '/docs/curl-ts', label: 'curl-ts', icon: FileText },
  ]},
];

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(true);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-surface-variant/40 transition-colors shrink-0">
            <ChevronRight className={`w-3 h-3 text-muted-foreground/50 transition-transform ${open ? 'rotate-90' : ''}`} />
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        <Link href={item.href}
          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors ml-0.5 ${
            isActive ? 'bg-primary/8 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'
          }`}>
          <Icon className="w-4 h-4 shrink-0 opacity-60" />
          {item.label}
        </Link>
      </div>
      {hasChildren && open && (
        <div className="ml-3 border-l border-outline/10 pl-2 mt-0.5">
          {item.children!.map(child => (
            <NavItem key={child.href} item={child} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-80 lg:pr-8 py-8 lg:py-12 pb-24">
        <Sidebar>
          <nav className="space-y-0.5">
            {NAV.map(item => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </Sidebar>
        <main className="max-w-6xl mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
