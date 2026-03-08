import { motion } from 'framer-motion';
import { M3Shapes } from './M3ExpressiveIndicator';

/**
 * M3 Love Indicator
 * Similar to M3ExpressiveIndicator but with a unique shape sequence
 * that always morphs back to the heart shape.
 *
 * Shape sequence: HEART → SUNNY → COOKIE_7 → FLOWER → GEM → COOKIE_4 → HEART
 * Each shape lasts ~650ms, rotates 140° per shape.
 */

const morphSequence = [
  M3Shapes.heart,
  M3Shapes.sunny,
  M3Shapes.cookie7,
  M3Shapes.flower,
  M3Shapes.gem,
  M3Shapes.cookie4,
  M3Shapes.heart, // loop back to heart
];

const DURATION_PER_SHAPE_MS = 650;
const TOTAL_SHAPES = morphSequence.length - 1; // 6 transitions
const TOTAL_DURATION_S = (DURATION_PER_SHAPE_MS * TOTAL_SHAPES) / 1000;
const ROTATION_PER_SHAPE = 140;

interface M3LoveIndicatorProps {
  className?: string;
}

export function M3LoveIndicator({ className = 'w-5 h-5' }: M3LoveIndicatorProps) {
  const rotations = Array.from({ length: TOTAL_SHAPES + 1 }, (_, i) => i * ROTATION_PER_SHAPE);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full fill-tertiary drop-shadow-sm"
        animate={{ rotate: rotations }}
        transition={{
          duration: TOTAL_DURATION_S,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <motion.path
          animate={{ d: morphSequence }}
          transition={{
            duration: TOTAL_DURATION_S,
            ease: [0.2, 0.0, 0, 1.0], // M3 emphasized decelerate
            repeat: Infinity,
          }}
        />
      </motion.svg>
    </div>
  );
}
