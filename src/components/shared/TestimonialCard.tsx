import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { Testimonial } from '@/types';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
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
      <div className="relative bg-surface rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Quote Icon Background */}
        <div className="absolute top-4 right-4 opacity-5">
          <Quote className="w-24 h-24 text-primary" />
        </div>
        
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative">
          {/* Header with Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <motion.div
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.05 },
              }}
              className="relative"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-variant ring-2 ring-surface shadow-lg">
                {testimonial.avatar ? (
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
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
            <Quote className="absolute -left-1 -top-2 w-6 h-6 text-primary/30" />
            <p className="text-foreground leading-relaxed pl-4">
              "{testimonial.quote}"
            </p>
          </div>
        </div>
        
        {/* Bottom Glow */}
        <motion.div
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        />
      </div>
    </motion.div>
  );
}
