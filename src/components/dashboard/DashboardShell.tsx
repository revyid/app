'use client';

import { ActiveSectionProvider } from '@/contexts/ActiveSectionContext';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ActiveSectionProvider>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </ActiveSectionProvider>
  );
}
