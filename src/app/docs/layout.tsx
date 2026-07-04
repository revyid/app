import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs — Revvy',
  description: 'API documentation, code sandbox, and developer tools.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
