'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ProjectDetail } from '@/components/shared/ProjectDetail';
import type { Project } from '@/types';

const showcaseProjects: Project[] = [
  {
    id: 'foodhub',
    title: 'FoodHub Delivery',
    date: '2024',
    role: 'Frontend',
    category: 'Food Delivery',
    color: '#f97316',
    icon: 'Globe',
    href: '/showcase/foodhub-delivery',
    thumbnail: '/images/showcase/foodhub.webp',
    description: 'Platform food delivery dengan warm design.',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    features: ['Menu Showcase', 'Order System', 'Mobile-First'],
    status: 'live',
  },
  {
    id: 'lenslight',
    title: 'Lens Light',
    date: '2024',
    role: 'Frontend',
    category: 'Photography',
    color: '#8b5cf6',
    icon: 'Globe',
    href: '/showcase/lens-light',
    thumbnail: '/images/showcase/lenslight.webp',
    description: 'Portfolio fotografi dengan desain minimalis.',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    features: ['Gallery Grid', 'Lightbox View', 'Smooth Transitions'],
    status: 'live',
  },
  {
    id: 'kopinusantara',
    title: 'Kopi Nusantara',
    date: '2024',
    role: 'Frontend',
    category: 'Coffee Shop',
    color: '#92400e',
    icon: 'Globe',
    href: '/showcase/kopi-nusantara',
    thumbnail: '/images/showcase/kopinua.webp',
    description: 'Website coffee shop dengan tema warm dan cozy.',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    features: ['Menu Display', 'Warm Theme', 'Location Map'],
    status: 'live',
  },
  {
    id: 'bakery',
    title: 'Artisan Bakery',
    date: '2024',
    role: 'Frontend',
    category: 'Bakery',
    color: '#b45309',
    icon: 'Globe',
    href: '/showcase/artisan-bakery',
    thumbnail: '/images/showcase/bakery.webp',
    description: 'Bakery website dengan desain elegant.',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    features: ['Product Catalog', 'Elegant Typography', 'Order Online'],
    status: 'live',
  },
  {
    id: 'zenfit',
    title: 'ZenFit Studio',
    date: '2024',
    role: 'Frontend',
    category: 'Fitness',
    color: '#059669',
    icon: 'Globe',
    href: '/showcase/zenfit-studio',
    thumbnail: '/images/showcase/zenfit.webp',
    description: 'Fitness studio website dengan vibe energetic.',
    techStack: ['HTML', 'CSS', 'JavaScript'],
    features: ['Class Schedule', 'Trainer Profiles', 'Booking System'],
    status: 'live',
  },
];

export default function ShowcasePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <>
      {/* Simple navbar */}
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/80 backdrop-blur-xl border-b border-outline/10 mb-6">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-label-md font-medium">Portfolio</span>
          </a>
          <span className="text-label-sm text-muted-foreground">Showcase</span>
        </div>
      </div>

      <section className="mb-10">
        <div className="mb-6">
          <SectionLabel text="Web Projects" />
          <h1 className="text-headline-lg sm:text-headline-xl font-bold text-foreground mb-3">
            Project Showcase
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl">
            Koleksi website landing page dengan HTML, CSS, dan JavaScript murni.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showcaseProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      </section>

      <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
}
