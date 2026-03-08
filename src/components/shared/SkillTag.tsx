import { motion } from 'framer-motion';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Suggestion Chip
 * Ref: material-components-android/docs/components/Chip.md
 * - 8dp corner radius (shapeAppearanceCornerSmall)
 * - 32dp min height
 * - outlined style with ripple
 * - Shape morphs to pill on tap (M3 Expressive)
 */

interface SkillTagProps {
  skill: string;
}

export function SkillTag({ skill }: SkillTagProps) {
  return (
    <motion.span
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.94, borderRadius: '16px' }}
      transition={SPRING_BOUNCY}
      className="group/chip relative inline-flex items-center h-8 px-4 text-label-lg font-medium 
        bg-transparent text-on-surface-variant 
        rounded-[8px] border border-outline/40
        hover:bg-on-surface/8 hover:border-outline
        transition-colors duration-150 cursor-default select-none overflow-hidden"
    >
      {/* State layer */}
      <span className="absolute inset-0 rounded-[inherit] pointer-events-none bg-current opacity-0 
        group-hover/chip:opacity-[0.08] group-active/chip:opacity-[0.12] transition-opacity duration-150" />
      {/* Ripple placeholder */}
      <span className="relative z-10">{skill}</span>
    </motion.span>
  );
}
