import { motion } from 'framer-motion';
import { itemVariants, viewportOnce } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Footer
 * - M3 color tokens (outline, muted-foreground, surface-variant)
 * - Subtle divider with animated gradient
 * - Links use M3 button-like styling
 */

export function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={itemVariants}
      className="pt-8 pb-6 border-t border-outline/20"
    >
      <div className="text-center space-y-3">
        <p className="text-body-sm text-muted-foreground">
          Built using{' '}
          <motion.a 
            href="https://framer.com" 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_BOUNCY}
            className="text-primary font-medium hover:underline transition-colors"
          >
            Framer
          </motion.a>
        </p>
        
        <div className="flex items-center justify-center gap-4 text-body-sm">
          <motion.a 
            href="#" 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_BOUNCY}
            className="text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Buy this template
          </motion.a>
          <span className="w-1 h-1 rounded-full bg-outline/40" />
          <motion.a 
            href="#" 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_BOUNCY}
            className="text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Become an affiliate
          </motion.a>
        </div>
        
        <p className="text-label-sm text-muted-foreground/50">
          © 2026 Resumx by Jus
        </p>
      </div>
    </motion.footer>
  );
}
