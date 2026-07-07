'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Key, FileText, Home } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { href: '/docs', label: 'Docs', icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-80 lg:pr-8 py-8 lg:py-12 pb-24">
        <Sidebar>
          <nav className="space-y-0.5">
            {NAV.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm transition-colors ${
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/50'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-outline/15">
            <p className="text-label-sm text-muted-foreground/40 text-center">© 2026 revyid</p>
          </div>
        </Sidebar>
        <main className="max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
