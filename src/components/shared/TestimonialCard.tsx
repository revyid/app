import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { Testimonial } from '@/types';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Outlined Card — TestimonialCard
 * Ref: material-components-android/docs/components/Card.md
 * - colorSurface background (outlined variant)
 * - 1dp stroke with colorOutline
 * - shapeAppearanceCornerMedium (12dp)
 * - Shape morphs on press (avatar squircle→circle, card 24→32)
 * - M3 state layer + ripple
 */

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
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

        {/* Quote Icon Background */}
        <div className="absolute top-4 right-4 opacity-5">
          <Quote className="w-24 h-24 text-primary" />
        </div>
        

        
        <div className="relative p-6">
          {/* Header with Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <motion.div
              variants={{
                rest: { scale: 1, borderRadius: '12px' },
                hover: { scale: 1.05, borderRadius: '14px' },
                pressed: { scale: 0.95, borderRadius: '50%' },
              }}
              transition={SPRING_BOUNCY}
              className="relative overflow-hidden"
              style={{ borderRadius: '12px' }}
            >
              <div className="w-14 h-14 overflow-hidden bg-surface-variant ring-2 ring-surface shadow-lg" style={{ borderRadius: 'inherit' }}>
                {testimonial.avatar ? (
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-medium bg-surface-variant">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Online Indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface" />
            </motion.div>
            
            <div>
              <h3 className="font-semibold text-foreground text-base">
                {testimonial.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {testimonial.role}
              </p>
            </div>
          </div>
          
          {/* Quote */}
          <div className="relative">
            {/* Animated SVG Quote Mark */}
            <motion.svg 
              viewBox="0 0 24 24" 
              className="absolute -left-1 -top-2 w-6 h-6"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.3 }}
            >
              <motion.path
                d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V9c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"
                initial={false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <motion.path
                d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V9c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 5v3c0 1 0 1 1 1z"
                initial={false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
              />
            </motion.svg>
            <p className="text-foreground leading-relaxed pl-4">
              "{testimonial.quote}"
            </p>
          </div>
        </div>
        
        {/* Bottom Glow */}
        <motion.div
          variants={{
            rest: { opacity: 0, borderRadius: '0px' },
            hover: { opacity: 1, borderRadius: '4px' },
            pressed: { opacity: 0.5, borderRadius: '8px' },
          }}
          transition={SPRING_BOUNCY}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        />
      </div>
    </motion.div>
  );
}
