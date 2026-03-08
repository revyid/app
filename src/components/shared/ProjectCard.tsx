import { motion } from 'framer-motion';
import { Calendar, User, Tag, LayoutDashboard, Wallet, Code2, ArrowUpRight } from 'lucide-react';
import type { Project } from '@/types';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/motion-presets';

interface ProjectCardProps {
  project: Project;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Wallet,
  Code2,
};

export function ProjectCard({ project }: ProjectCardProps) {
  const IconComponent = iconMap[project.icon] || LayoutDashboard;

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: { y: 0, scale: 1 },
        hover: { y: -8, scale: 1.02 },
      }}
      transition={SPRING_BOUNCY}
      className="group cursor-pointer"
    >
      <div className="relative bg-surface dark:bg-surface squircle-card overflow-hidden shadow-fluid hover:shadow-fluid-hover transition-shadow duration-200">
        {/* Image Area with Gradient Overlay */}
        <div 
          className="relative aspect-[16/10] w-full overflow-hidden bg-primary/10"
        >
          <motion.div
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.08 },
            }}
            transition={SPRING_BOUNCY}
            className="absolute inset-0"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          {/* Floating Arrow Icon */}
          <motion.div
            variants={{
              rest: { opacity: 0, scale: 0.8 },
              hover: { opacity: 1, scale: 1 },
            }}
            transition={SPRING_SNAPPY}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-elevation-2"
          >
            <ArrowUpRight className="w-5 h-5 text-foreground" />
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon with Glass Effect */}
            <motion.div 
              variants={{
                rest: { rotate: 0 },
                hover: { rotate: 8 },
              }}
              transition={SPRING_BOUNCY}
              className="w-12 h-12 squircle-md flex items-center justify-center flex-shrink-0 shadow-elevation-1 bg-primary"
            >
              <IconComponent className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-surface-variant px-2.5 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  {project.date}
                </span>
                <span className="flex items-center gap-1.5 bg-surface-variant px-2.5 py-1 rounded-full">
                  <User className="w-3.5 h-3.5" />
                  {project.role}
                </span>
                <span className="flex items-center gap-1.5 bg-surface-variant px-2.5 py-1 rounded-full">
                  <Tag className="w-3.5 h-3.5" />
                  {project.category}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Accent Line */}
        <motion.div
          variants={{
            rest: { scaleX: 0 },
            hover: { scaleX: 1 },
          }}
          transition={SPRING_SNAPPY}
          className="absolute bottom-0 left-0 right-0 h-1 origin-left bg-primary"
        />
      </div>
    </motion.div>
  );
}
