import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';

export function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <span className="text-[10rem] font-black leading-none select-none text-primary">
            404
          </span>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-3xl p-8 space-y-4 bg-surface-container"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-primary-container">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-container-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="11" y1="8" x2="11" y2="11" />
              <line x1="11" y1="14" x2="11.01" y2="14" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-2 w-full py-3 px-6 rounded-2xl font-semibold text-sm cursor-pointer text-center bg-primary text-primary-foreground"
            >
              Go home
            </motion.div>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-xs text-outline"
        >
          {typeof window !== 'undefined'
            ? decodeURIComponent(window.location.pathname).replace(/[<>"'&]/g, '').slice(0, 60)
            : ''}
        </motion.p>
      </div>
    </div>
  );
}
