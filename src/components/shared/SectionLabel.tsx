import { motion } from 'framer-motion';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Section Label
 * Uses M3 color tokens and typography.
 * Features a subtle animated accent line that draws in on scroll.
 */

interface SectionLabelProps {
  text: string;
}

export function SectionLabel({ text }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {/* Animated accent line */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ ...SPRING_BOUNCY, delay: 0.1 }}
        className="w-8 h-0.5 bg-primary rounded-full origin-left"
      />
      <h2 className="text-label-sm font-semibold uppercase tracking-widest text-primary">
        {text}
      </h2>
    </div>
  );
}
