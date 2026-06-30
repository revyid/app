'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SmoothScroll } from '@/components/shared/SmoothScroll';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </SmoothScroll>
  );
}
