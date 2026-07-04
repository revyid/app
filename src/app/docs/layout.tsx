'use client';

import { usePathname } from 'next/navigation';
import { ArrowLeft, BookOpen, Globe, Link2, Code as CodeIcon, PlayCircle, ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  {
    href: '/docs',
    label: 'Overview',
    icon: BookOpen,
  },
  {
    href: '/docs/api-reference',
    label: 'API Reference',
    icon: Globe,
    children: [
      { href: '/docs/api-reference/github', label: 'GitHub API', icon: Globe },
      { href: '/docs/api-reference/shorten', label: 'URL Shortener', icon: Link2 },
    ],
  },
  {
    href: '/docs/sandbox',
    label: 'Sandbox',
    icon: PlayCircle,
  },
  {
    href: '/docs/curl-ts',
    label: 'curl-ts',
    icon: CodeIcon,
  },
];

function SidebarItem({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState(true);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || (item.href !== '/docs' && pathname.startsWith(item.href));

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded hover:bg-surface-variant/40 transition-colors shrink-0"
          >
            <ChevronRight
              className={`w-3 h-3 text-muted-foreground/50 transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors ml-0.5 ${
            isActive
              ? 'bg-primary/8 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0 opacity-60" />
          {item.label}
        </Link>
      </div>
      {hasChildren && open && (
        <div className="ml-3 border-l border-outline/10 pl-2 mt-0.5">
          {item.children!.map(child => (
            <SidebarItem key={child.href} item={child} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-outline/10">
      <div className="flex items-center justify-between px-3 py-2">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <span className="text-body-sm font-semibold text-foreground">Docs</span>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors"
        >
          {open ? <X className="w-4 h-4 text-muted-foreground" /> : <Menu className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-outline/10"
          >
            <nav className="px-3 py-2 space-y-1">
              {NAV.map(item => (
                <SidebarItem key={item.href} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      <MobileNav pathname={pathname} />

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
        <nav className="px-3 pb-3">
          {NAV.map(item => (
            <SidebarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
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
