'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

interface SidebarProps {
  children: ReactNode;
}

const CRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'api-keys': 'API Keys',
  docs: 'Docs',
  'api-reference': 'API Reference',
  github: 'GitHub API',
  shorten: 'URL Shortener',
  sandbox: 'Sandbox',
  'curl-ts': 'curl-ts',
};

function SidebarShell({ children, crumbs, pathname }: { children: ReactNode; crumbs: ReactNode; pathname: string }) {
  return (
    <div className="squircle-card bg-surface border border-outline/20 p-4 space-y-2.5 noise-grain shadow-fluid w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin flex flex-col">
      {crumbs}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="space-y-2.5 flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ children }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    if (pathname === '/') return null;
    const segments = pathname.split('/').filter(Boolean);
    const items: { label: string; href?: string }[] = [{ label: 'home', href: '/' }];
    segments.forEach((seg, i) => {
      const label = CRUMB_LABELS[seg] || seg;
      const href = i < segments.length - 1 ? '/' + segments.slice(0, i + 1).join('/') : undefined;
      items.push({ label, href });
    });
    return <Breadcrumbs items={items} />;
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-8 top-4 bottom-4 w-72 z-10">
        <div className="h-full flex items-center">
          <SidebarShell crumbs={crumbs} pathname={pathname}>{children}</SidebarShell>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-80 flex-shrink-0" />

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-full bg-surface border border-outline/20 shadow-elevation-2 active:scale-95 transition-transform"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 bg-surface border-r border-outline/20 overflow-y-auto"
            >
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-title-sm font-semibold text-foreground">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors" aria-label="Close menu">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {crumbs}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="space-y-2.5"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
