import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Showcase — Revy',
  description: 'Koleksi website landing page yang dibuat dengan HTML, CSS, dan JavaScript murni. SaaS, Food Delivery, Photography, Coffee Shop, Bakery, dan Fitness.',
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
