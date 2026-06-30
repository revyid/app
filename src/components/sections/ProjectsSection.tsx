import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ProjectDetail } from '@/components/shared/ProjectDetail';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/motion-presets';
import { IconButton } from '@/components/ui/button';
import type { Project } from '@/types';

export function ProjectsSection() {
  const { data } = usePortfolio();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const didDrag = useRef(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        className="mb-10"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
          <SectionLabel text="Projects" />
          <div className="flex items-center gap-2">
            <IconButton variant="ghost" onClick={() => scroll('left')} aria-label="Scroll Left" className="rounded-full bg-surface-variant/50 hover:bg-surface-variant flex-shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </IconButton>
            <IconButton variant="ghost" onClick={() => scroll('right')} aria-label="Scroll Right" className="rounded-full bg-surface-variant/50 hover:bg-surface-variant flex-shrink-0">
              <ChevronRight className="w-5 h-5" />
            </IconButton>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          onPointerDown={() => { didDrag.current = false; }}
          onPointerMove={(e) => {
            if (!scrollRef.current) return;
            if (Math.abs(e.movementX) > 3) didDrag.current = true;
            scrollRef.current.scrollLeft -= e.movementX;
          }}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x"
        >
          {data.projects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="w-[85vw] max-w-[320px] sm:w-[350px] sm:max-w-none md:w-[400px] flex-shrink-0 snap-center sm:snap-start"
            >
              <ProjectCard project={project} onClick={() => {
                if (!didDrag.current) setSelectedProject(project);
              }} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
}
