import { motion } from 'framer-motion';
import { itemVariants, viewportOnce } from '@/lib/animations';

export function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={itemVariants}
      className="pt-8 pb-6 border-t border-gray-200 dark:border-zinc-800"
    >
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500 dark:text-zinc-500">
          Built using{' '}
          <a 
            href="https://framer.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
          >
            Framer
          </a>
        </p>
        
        <div className="flex items-center justify-center gap-4 text-sm">
          <a 
            href="#" 
            className="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors underline"
          >
            Buy this template
          </a>
          <a 
            href="#" 
            className="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors underline"
          >
            Become an affiliate
          </a>
        </div>
        
        <p className="text-xs text-gray-400 dark:text-zinc-600">
          © 2026 Resumx by Jus
        </p>
      </div>
    </motion.footer>
  );
}
