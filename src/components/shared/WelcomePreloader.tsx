import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SPRING_SNAPPY } from '@/lib/motion-presets';

interface WelcomePreloaderProps {
  onComplete: () => void;
}

import { M3ExpressiveIndicator } from './M3ExpressiveIndicator';

export function WelcomePreloader({ onComplete }: WelcomePreloaderProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Block scroll during loading
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        document.body.style.overflow = '';
        onComplete();
      }, 500);
    }, 2800);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isExiting ? '-100%' : 0 }}
      transition={{ ...SPRING_SNAPPY, damping: 20 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface"
    >
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm px-8">
        <M3ExpressiveIndicator className="w-14 h-14" />
      </div>
    </motion.div>
  );
}
