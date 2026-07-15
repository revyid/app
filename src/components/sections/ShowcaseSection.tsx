'use client';

import { ArrowUpRight } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';

const previewProjects = [
  { id: 'foodhub', title: 'FoodHub Delivery', color: '#f97316', image: '/images/showcase/foodhub.webp' },
  { id: 'lenslight', title: 'Lens Light', color: '#8b5cf6', image: '/images/showcase/lenslight.webp' },
  { id: 'zenfit', title: 'ZenFit Studio', color: '#059669', image: '/images/showcase/zenfit.webp' },
];

export function ShowcaseSection() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel text="Showcase" />
        <a
          href="/showcase"
          className="flex items-center gap-1.5 text-label-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          View All
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {previewProjects.map((project) => (
          <a
            key={project.id}
            href="/showcase"
            className="group relative aspect-[16/10] rounded-2xl overflow-hidden bg-surface-variant border border-outline/10"
          >
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
              <span className="text-label-sm font-medium text-white">{project.title}</span>
            </div>
            <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
              <ArrowUpRight className="w-3.5 h-3.5 text-foreground" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
