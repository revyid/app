'use client';

import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('@/views/HomePage').then(m => ({ default: m.HomePage })), { ssr: false });

export default function Page() {
  return <HomePage />;
}
