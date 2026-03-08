import { motion } from 'framer-motion';
import { SPRING_BOUNCY } from '@/lib/motion-presets';
import { cn } from '@/lib/utils';

interface MorphIconProps {
  /** 
   * Morph target: 'menu-close', 'plus-minus', 'chevron-down-up'
   */
  type: 'menu-close' | 'plus-minus' | 'chevron-down-up';
  /** 
   * Active state determines the shape.
   * false = default (menu, plus, chevron-down)
   * true = active (close, minus, chevron-up)
   */
  isActive: boolean;
  className?: string;
  strokeWidth?: number;
}

export function MorphIcon({ type, isActive, className = "w-5 h-5", strokeWidth = 2 }: MorphIconProps) {
  
  const getPaths = () => {
    switch (type) {
      case 'menu-close':
        // Menu (Hamburger) to Close (X)
        return (
          <>
            <motion.path
              d="M4 6h16"
              initial={false}
              animate={{ d: isActive ? "M6 6l12 12" : "M4 6h16", opacity: 1 }}
              transition={SPRING_BOUNCY}
            />
            <motion.path
              d="M4 12h16"
              initial={false}
              animate={{ opacity: isActive ? 0 : 1 }}
              transition={SPRING_BOUNCY}
            />
            <motion.path
              d="M4 18h16"
              initial={false}
              animate={{ d: isActive ? "M6 18L18 6" : "M4 18h16", opacity: 1 }}
              transition={SPRING_BOUNCY}
            />
          </>
        );
      case 'plus-minus':
        // Plus to Minus
        return (
          <>
            <motion.path
              d="M12 5v14"
              initial={false}
              animate={{
                // Rotate to flat line and spin 90deg, or scale down Y
                rotate: isActive ? 90 : 0,
                scaleY: isActive ? 0 : 1,
                opacity: isActive ? 0 : 1
              }}
              style={{ transformOrigin: "center" }}
              transition={SPRING_BOUNCY}
            />
            <motion.path
              d="M5 12h14"
              initial={false}
              animate={{ rotate: isActive ? 180 : 0 }} // Smooth continuous rotation spin
              style={{ transformOrigin: "center" }}
              transition={SPRING_BOUNCY}
            />
          </>
        );
      case 'chevron-down-up':
      default:
        // Chevron Down: M6 9l6 6 6-6
        // Chevron Up: M18 15l-6-6-6 6
        return (
          <motion.path
            d="M6 9l6 6 6-6"
            initial={false}
            animate={{ d: isActive ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6" }}
            transition={SPRING_BOUNCY}
          />
        );
    }
  };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      initial={false}
      animate={{ rotate: type === 'menu-close' && isActive ? 90 : 0 }}
      transition={SPRING_BOUNCY}
    >
      {getPaths()}
    </motion.svg>
  );
}
