import { motion } from 'framer-motion';
import { GraduationCap, Calendar } from 'lucide-react';
import type { Education } from '@/types';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Filled Card — EducationCard
 * Ref: material-components-android/docs/components/Card.md
 * - colorSurfaceContainerHighest background (filled variant)
 * - shapeAppearanceCornerMedium (12dp)
 * - Shape morphs on press (icon squircle→circle, card 24→32)
 * - M3 state layer + ripple
 */

interface EducationCardProps {
  education: Education;
}

export function EducationCard({ education }: EducationCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="pressed"
      animate="rest"
      variants={{
        rest: { y: 0, borderRadius: '24px' },
        hover: { y: -4, borderRadius: '24px' },
        pressed: { y: 0, scale: 0.96, borderRadius: '32px' },
      }}
      transition={SPRING_BOUNCY}
      className="group block cursor-pointer focus-ring"
      style={{ borderRadius: '24px' }}
    >
      <div className="relative card-filled p-0 overflow-hidden h-full flex flex-col" style={{ borderRadius: 'inherit' }}>
        {/* State Layer */}
        <div className="absolute inset-0 state-layer pointer-events-none" style={{ borderRadius: 'inherit' }} />

        {/* Ripple Effect */}
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderRadius: 'inherit' }} />
        
        <div className="relative p-6 flex-1 flex flex-col">
          {/* Icon Badge with M3 Shape Morphing */}
          <motion.div
            variants={{
              rest: { scale: 1, rotate: 0, borderRadius: '12px' },
              hover: { scale: 1.1, rotate: -5, borderRadius: '16px' },
              pressed: { scale: 0.9, rotate: 0, borderRadius: '50%' },
            }}
            transition={SPRING_BOUNCY}
            className="w-12 h-12 bg-surface-variant flex items-center justify-center mb-4 shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
            style={{ borderRadius: '12px' }}
          >
            <GraduationCap className="w-6 h-6 text-primary" />
          </motion.div>
          
          {/* Content */}
          <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2">
            {education.institution}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {education.degree}
          </p>
          
          {/* Year Badge — M3 Assist Chip style */}
          <div className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-3 rounded-[8px] border border-outline/10 w-fit">
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
            pressed: { opacity: 0.5, scale: 1.2 },
          }}
          transition={SPRING_BOUNCY}
          className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/10 rounded-full blur-2xl"
        />
      </div>
    </motion.div>
  );
}
