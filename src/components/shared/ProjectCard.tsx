import { motion } from 'framer-motion';
import { Calendar, User, Tag, LayoutDashboard, Wallet, Code2, ArrowUpRight, Terminal, Globe } from 'lucide-react';
import type { Project } from '@/types';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/motion-presets';

/**
 * M3 Elevated Card — ProjectCard
 * Ref: material-components-android/docs/components/Card.md
 * - colorSurfaceContainerLow background (elevated variant)
 * - shapeAppearanceCornerMedium (12dp)
 * - elevation-1 default, elevation-2 on hover
 * - Shape morphs on press (squircle → pill via borderRadius)
 * - Ripple at 20% opacity
 */

interface ProjectCardProps {
  project: Project;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Wallet,
  Code2,
  Terminal,
  Globe,
};

export function ProjectCard({ project }: ProjectCardProps) {
  const IconComponent = iconMap[project.icon] || LayoutDashboard;

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="pressed"
      animate="rest"
      variants={{
        rest: { y: 0, scale: 1, borderRadius: '24px' },
        hover: { y: -8, scale: 1.02, borderRadius: '24px' },
        pressed: { y: 0, scale: 0.97, borderRadius: '32px' },
      }}
      transition={SPRING_BOUNCY}
      className="group cursor-pointer block focus-ring"
      style={{ borderRadius: '24px' }}
    >
      <div className="relative card-filled overflow-hidden p-0" style={{ borderRadius: 'inherit' }}>
        {/* State Layer */}
        <div className="absolute inset-0 state-layer pointer-events-none" style={{ borderRadius: 'inherit' }} />

        {/* Ripple Effect */}
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderRadius: 'inherit' }} />

        {/* Image Area with Gradient Overlay */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary/10">
          <motion.div
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.08 },
              pressed: { scale: 1.02 },
            }}
            transition={SPRING_BOUNCY}
            className="absolute inset-0"
          >
            {project.thumbnail && (
              <img 
                src={project.thumbnail} 
                alt={project.title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </motion.div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          {/* Floating Arrow Icon */}
          {project.href ? (
            <motion.a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={{
                rest: { opacity: 0, scale: 0.8 },
                hover: { opacity: 1, scale: 1 },
                pressed: { opacity: 1, scale: 0.9 },
              }}
              transition={SPRING_SNAPPY}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-elevation-2 hover:bg-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight className="w-5 h-5 text-foreground" />
            </motion.a>
          ) : (
            <motion.div
              variants={{
                rest: { opacity: 0, scale: 0.8 },
                hover: { opacity: 1, scale: 1 },
                pressed: { opacity: 1, scale: 0.9 },
              }}
              transition={SPRING_SNAPPY}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-elevation-2"
            >
              <ArrowUpRight className="w-5 h-5 text-foreground" />
            </motion.div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon with M3 Shape Morphing */}
            <motion.div 
              variants={{
                rest: { rotate: 0, borderRadius: '12px' },
                hover: { rotate: 8, borderRadius: '16px' },
                pressed: { rotate: 0, borderRadius: '20px' },
              }}
              transition={SPRING_BOUNCY}
              className="w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-elevation-1 bg-primary"
              style={{ borderRadius: '12px' }}
            >
              <IconComponent className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              
              {/* M3 Chip-style metadata tags */}
              <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-[8px] border border-outline/10">
                  <Calendar className="w-3.5 h-3.5" />
                  {project.date}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-[8px] border border-outline/10">
                  <User className="w-3.5 h-3.5" />
                  {project.role}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-2.5 rounded-[8px] border border-outline/10">
                  <Tag className="w-3.5 h-3.5" />
                  {project.category}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Accent Line with shape morphing */}
        <motion.div
          variants={{
            rest: { scaleX: 0, borderRadius: '0px' },
            hover: { scaleX: 1, borderRadius: '2px' },
            pressed: { scaleX: 0.8, borderRadius: '4px' },
          }}
          transition={SPRING_SNAPPY}
          className="absolute bottom-0 left-0 right-0 h-1 origin-left bg-primary"
        />
      </div>
    </motion.div>
  );
}
