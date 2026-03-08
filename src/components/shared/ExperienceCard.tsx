import { motion } from 'framer-motion';
import { Calendar, Building2, MapPin, ArrowUpRight } from 'lucide-react';
import type { Experience } from '@/types';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/motion-presets';

/**
 * M3 Filled Card — ExperienceCard
 * Ref: material-components-android/docs/components/Card.md
 * - colorSurfaceContainerHighest background (filled variant)
 * - shapeAppearanceCornerMedium (12dp)
 * - Shape morphs on press (borderRadius 24→32)
 * - M3 state layer + ripple
 */

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="pressed"
      animate="rest"
      variants={{
        rest: { y: 0, borderRadius: '24px' },
        hover: { y: -4, borderRadius: '24px' },
        pressed: { y: 0, scale: 0.97, borderRadius: '32px' },
      }}
      transition={SPRING_BOUNCY}
      className="group block cursor-pointer focus-ring"
      style={{ borderRadius: '24px' }}
    >
      <div className="relative card-filled p-0 overflow-hidden" style={{ borderRadius: 'inherit' }}>
        {/* State Layer */}
        <div className="absolute inset-0 state-layer pointer-events-none" style={{ borderRadius: 'inherit' }} />

        {/* Ripple Effect */}
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderRadius: 'inherit' }} />


        
        <div className="relative flex items-start gap-5 p-6">
          {/* Logo with M3 Shape Morphing */}
          <motion.div 
            variants={{
              rest: { rotateY: 0, borderRadius: '12px' },
              hover: { rotateY: 10, borderRadius: '16px' },
              pressed: { rotateY: 0, borderRadius: '50%' },
            }}
            transition={SPRING_BOUNCY}
            className="w-14 h-14 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 bg-primary"
            style={{ borderRadius: '12px' }}
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
                  pressed: { opacity: 1, x: 0, scale: 0.9 },
                }}
                transition={SPRING_SNAPPY}
              >
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
            
            {/* M3 Chip-style metadata */}
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground mb-3">
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-surface-variant border border-outline/10">
                <Calendar className="w-4 h-4" />
                {experience.dateRange}
              </span>
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-surface-variant border border-outline/10">
                <Building2 className="w-4 h-4" />
                {experience.company}
              </span>
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-surface-variant border border-outline/10">
                <MapPin className="w-4 h-4" />
                {experience.location}
              </span>
            </div>
            
            <p className="text-body-sm text-muted-foreground leading-relaxed">
              {experience.description}
            </p>
          </div>
        </div>
        
        {/* Side Accent with shape morph */}
        <motion.div
          variants={{
            rest: { scaleY: 0, borderRadius: '0px' },
            hover: { scaleY: 1, borderRadius: '4px' },
            pressed: { scaleY: 0.6, borderRadius: '8px' },
          }}
          transition={SPRING_SNAPPY}
          className="absolute left-0 top-4 bottom-4 w-1 origin-top bg-primary"
          style={{ borderRadius: '4px' }}
        />
      </div>
    </motion.div>
  );
}
