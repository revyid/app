import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SPRING_SNAPPY } from '@/lib/motion-presets';
import { M3ExpressiveIndicator } from './M3ExpressiveIndicator';

interface WelcomePreloaderProps {
  onComplete: () => void;
}

export function WelcomePreloader({ onComplete }: WelcomePreloaderProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        document.body.style.overflow = '';
        onComplete();
      }, 300);
    }, 1800);

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
      <M3ExpressiveIndicator className="w-10 h-10" />
    </motion.div>
  );
}
