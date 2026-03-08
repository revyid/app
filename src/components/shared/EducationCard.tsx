import { motion } from 'framer-motion';
import { GraduationCap, Calendar } from 'lucide-react';
import type { Education } from '@/types';

interface EducationCardProps {
  education: Education;
}

export function EducationCard({ education }: EducationCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: { y: 0 },
        hover: { y: -4 },
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group"
    >
      <div className="relative bg-surface rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative">
          {/* Icon Badge */}
          <motion.div
            variants={{
              rest: { scale: 1, rotate: 0 },
              hover: { scale: 1.1, rotate: -5 },
            }}
            className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30"
          >
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          
          {/* Content */}
          <h3 className="font-semibold text-foreground text-base mb-2 line-clamp-2">
            {education.institution}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {education.degree}
          </p>
          
          {/* Year Badge */}
          <div className="inline-flex items-center gap-1.5 bg-surface-variant px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {education.year}
            </span>
          </div>
        </div>
        
        {/* Corner Decoration */}
        <motion.div
          variants={{
            rest: { opacity: 0, scale: 0.8 },
            hover: { opacity: 1, scale: 1 },
          }}
          className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/10 rounded-full blur-2xl"
        />
      </div>
    </motion.div>
  );
}
