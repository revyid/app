'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useThemeStore } from '@/stores/theme-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { SmoothScroll } from '@/components/shared/SmoothScroll';
import { Toaster } from '@/components/ui/sonner';

function StoreInitializer({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((s) => s.init);
  const refreshPortfolio = usePortfolioStore((s) => s.refresh);

  useEffect(() => {
    initTheme();
    refreshPortfolio();
  }, [initTheme, refreshPortfolio]);

  return <>{children}</>;
}

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <AuthProvider>
        <StoreInitializer>
          {children}
        </StoreInitializer>
      </AuthProvider>
      {/* Sonner toaster — mounted once at the root so any component can call
          `import { toast } from 'sonner'` and have it render. Previously the
          <Toaster /> was never mounted, so toast() calls were silent no-ops. */}
      <Toaster />
    </SmoothScroll>
  );
}
