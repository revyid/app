'use client';

import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-label-sm text-muted-foreground mb-4 font-mono">
      {items.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-muted-foreground/40">/</span>
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
