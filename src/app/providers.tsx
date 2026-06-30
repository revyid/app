'use client';

import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { ActiveSectionProvider } from '@/contexts/ActiveSectionContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PortfolioProvider>
      <ActiveSectionProvider>
        {children}
      </ActiveSectionProvider>
    </PortfolioProvider>
  );
}
