'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Key, FileText, Home, Settings, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageTransition } from '@/components/shared/PageTransition';

const NAV_SECTIONS = [
  {
    label: 'Navigation',
    items: [
      { href: '/', label: 'Home', icon: Home },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
      { href: '/docs', label: 'Docs', icon: FileText },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-80 lg:pr-8 py-8 lg:py-12 pb-24">
        <Sidebar>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-label-sm font-medium text-muted-foreground/50 uppercase tracking-wider mb-1.5 px-1">{section.label}</p>
              <nav className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/50'
                      }`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-primary/15' : 'bg-surface-variant/50'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          <div className="mt-auto pt-4 border-t border-outline/15">
            <p className="text-label-sm text-muted-foreground/40 text-center">© 2026 revyid</p>
          </div>
        </Sidebar>
        <main className="max-w-6xl mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
