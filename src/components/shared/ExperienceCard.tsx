import { motion } from 'framer-motion';
import { Calendar, Building2, MapPin, ArrowUpRight } from 'lucide-react';
import type { Experience } from '@/types';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/motion-presets';

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: { y: 0 },
        hover: { y: -4 },
      }}
      transition={SPRING_BOUNCY}
      className="group"
    >
      <div className="relative bg-surface squircle-card p-6 shadow-fluid hover:shadow-fluid-hover transition-shadow duration-200 overflow-hidden">
        {/* Background Gradient on Hover */}
        <motion.div
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          transition={SPRING_BOUNCY}
          className="absolute inset-0 bg-primary/5"
        />
        
        <div className="relative flex items-start gap-5">
          {/* Logo */}
          <motion.div 
            variants={{
              rest: { rotateY: 0 },
              hover: { rotateY: 10 },
            }}
            transition={SPRING_BOUNCY}
            className="w-14 h-14 squircle-md flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 bg-primary"
          >
            <span className="text-primary-foreground font-bold text-xl">
              {experience.company.charAt(0)}
            </span>
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground text-lg">
                {experience.title}
              </h3>
              <motion.div
                variants={{
                  rest: { opacity: 0, x: -10 },
                  hover: { opacity: 1, x: 0 },
                }}
                transition={SPRING_SNAPPY}
              >
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {experience.dateRange}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {experience.company}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {experience.location}
              </span>
            </div>
            
            <p className="text-body-sm text-muted-foreground leading-relaxed">
              {experience.description}
            </p>
          </div>
        </div>
        
        {/* Side Accent */}
        <motion.div
          variants={{
            rest: { scaleY: 0 },
            hover: { scaleY: 1 },
          }}
          transition={SPRING_SNAPPY}
          className="absolute left-0 top-4 bottom-4 w-1 rounded-full origin-top bg-primary"
        />
      </div>
    </motion.div>
  );
}
