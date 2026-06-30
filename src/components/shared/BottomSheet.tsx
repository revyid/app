'use client';

import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';

interface BottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function BottomSheet({ children, onClose }: BottomSheetProps) {
  const y = useMotionValue(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 200 || info.offset.y > 100) {
      animate(y, 600, { duration: 0.25, ease: [0.4, 0, 1, 1] }).then(() => onClose());
    }
  };

  return (
    <motion.div
      style={{ y }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={handleDragEnd}
      className="touch-pan-y"
    >
      {children}
    </motion.div>
  );
}
