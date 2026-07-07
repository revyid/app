'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SPRING_SNAPPY } from '@/lib/motion-presets';
import { LoadingIndicator } from './LoadingIndicator';

interface WelcomePreloaderProps {
  onComplete: () => void;
  isDataReady: boolean;
}

export function WelcomePreloader({ onComplete, isDataReady }: WelcomePreloaderProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isDataReady) return;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        document.body.style.overflow = '';
        onComplete();
      }, 400);
    }, 600);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isDataReady, onComplete]);

  if (!isDataReady && !isExiting) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface">
        <LoadingIndicator className="w-14 h-14" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isExiting ? '-100%' : 0 }}
      transition={{ ...SPRING_SNAPPY, damping: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface"
    >
      <LoadingIndicator className="w-14 h-14" />
    </motion.div>
  );
}
