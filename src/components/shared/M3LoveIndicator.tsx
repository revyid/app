'use client';

import { motion } from 'framer-motion';

/**
 * M3 Love Indicator
 * Heart-themed loading animation with CSS morphing.
 */

interface M3LoveIndicatorProps {
  className?: string;
}

export function M3LoveIndicator({ className = 'w-16 h-16' }: M3LoveIndicatorProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        className="w-full h-full bg-tertiary"
        animate={{
          borderRadius: [
            '50% 50% 50% 50%',
            '50% 0% 50% 50%',
            '50% 50% 0% 50%',
            '50% 0% 0% 50%',
            '50% 50% 50% 50%',
          ],
          rotate: [0, 140, 280, 420, 560],
          scale: [1, 0.95, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 3.5,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </div>
  );
}
