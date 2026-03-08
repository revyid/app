import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRING_SNAPPY } from '@/lib/motion-presets';

interface WelcomePreloaderProps {
  onComplete: () => void;
}

import { M3ExpressiveIndicator } from './M3ExpressiveIndicator';

export function WelcomePreloader({ onComplete }: WelcomePreloaderProps) {
  const [isExiting] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setTimeout(() => {
        onComplete();
      }, 500); 
    }, 2800); // Longer loading time to simulate booting up

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isExiting ? '-100%' : 0 }}
      transition={{ ...SPRING_SNAPPY, damping: 20 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface"
    >
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm px-8">
        


        {/* Expressive Indicator */}
        <AnimatePresence>
          {!isExiting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING_SNAPPY}
            >
              <M3ExpressiveIndicator className="w-14 h-14" />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
