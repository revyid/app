'use client';

import dynamic from 'next/dynamic';

const MainShell = dynamic(() => import('./shell').then(m => ({ default: m.MainShell })), { ssr: false });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainShell>{children}</MainShell>;
}
