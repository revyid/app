'use client';

import { Link } from '@/i18n/navigation';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-label-sm text-muted-foreground/60 font-mono mb-3">
      {items.map((crumb, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-0.5">/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
          ) : (
            <span className="text-foreground/80">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
