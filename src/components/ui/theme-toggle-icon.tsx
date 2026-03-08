import { motion } from 'framer-motion';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

interface ThemeToggleIconProps {
  theme: 'light' | 'dark' | 'system';
  className?: string;
}

export function ThemeToggleIcon({ theme, className = "w-5 h-5" }: ThemeToggleIconProps) {
  // If system, we might want a different icon, but let's stick to resolving to light/dark for the morph 
  // or just represent 'system' as a half-moon or computer icon.
  // Actually, for simplicity, 'dark' = moon, 'light' = sun
  
  const isDark = theme === 'dark';
  
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={false}
      animate={{
        rotate: isDark ? -90 : 0, // Rotate the whole icon slightly for effect
      }}
      transition={SPRING_BOUNCY}
    >
      <mask id="theme-mask">
        <rect x="0" y="0" width="24" height="24" fill="white" />
        <motion.circle
          initial={false}
          animate={{
            cx: isDark ? 12 : 30, // Move the cutout moon shadow in/out
            cy: isDark ? 4 : 0,
            r: isDark ? 9 : 0,
          }}
          transition={SPRING_BOUNCY}
          fill="black"
        />
      </mask>

      <motion.circle
        cx="12"
        cy="12"
        initial={false}
        animate={{
          r: isDark ? 10 : 5, // Grow to full moon, shrink to sun core
        }}
        transition={SPRING_BOUNCY}
        fill="currentColor"
        mask="url(#theme-mask)"
      />

      <motion.g
        initial={false}
        animate={{
          opacity: isDark ? 0 : 1, // Fade out rays in dark mode
          scale: isDark ? 0.5 : 1, // Shrink rays into the center
        }}
        transition={SPRING_BOUNCY}
        style={{ transformOrigin: "center" }}
      >
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </motion.g>
    </motion.svg>
  );
}
