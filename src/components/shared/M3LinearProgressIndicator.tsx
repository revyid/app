import { motion } from 'framer-motion';

interface M3LinearProgressIndicatorProps {
  className?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error';
  /** If provided, show determinate progress (0-100) */
  value?: number;
  /** Show track stop indicator at 0% */
  showTrackStop?: boolean;
  /** Gap between indicator and track stop */
  trackGap?: number;
}

/**
 * M3 Linear Progress Indicator
 * Ported from Android LinearIndeterminateDisjointAnimatorDelegate.java
 *
 * Enhanced with:
 * - Track stop indicator (small dot at 0%)
 * - Active indicator gap support
 * - Determinate mode with smooth animation
 */
export function M3LinearProgressIndicator({
  className = '',
  color = 'primary',
  value,
  showTrackStop = true,
  trackGap = 4,
}: M3LinearProgressIndicatorProps) {

  const trackColorClass =
    color === 'primary' ? 'bg-primary/20' :
    color === 'secondary' ? 'bg-secondary/20' :
    color === 'tertiary' ? 'bg-tertiary/20' :
    'bg-error/20';

  const barColorClass =
    color === 'primary' ? 'bg-primary' :
    color === 'secondary' ? 'bg-secondary' :
    color === 'tertiary' ? 'bg-tertiary' :
    'bg-error';

  const stopColorClass =
    color === 'primary' ? 'bg-primary' :
    color === 'secondary' ? 'bg-secondary' :
    color === 'tertiary' ? 'bg-tertiary' :
    'bg-error';

  const isDeterminate = value !== undefined;

  if (isDeterminate) {
    const normalizedValue = Math.max(0, Math.min(100, value));

    return (
      <div className={`relative w-full h-1 overflow-hidden rounded-full ${trackColorClass} ${className}`}>
        {/* Track Stop at 0% */}
        {showTrackStop && normalizedValue > 0 && (
          <div
            className={`absolute top-0 bottom-0 left-0 w-1 rounded-full ${stopColorClass} opacity-40`}
          />
        )}
        {/* Determinate bar */}
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${normalizedValue}%` }}
          transition={{
            duration: 0.4,
            ease: [0.2, 0.0, 0, 1.0], // M3 emphasized decelerate
          }}
          className={`absolute top-0 bottom-0 left-0 rounded-full ${barColorClass}`}
          style={{
            marginLeft: showTrackStop && normalizedValue > 0 ? `${trackGap}px` : 0,
          }}
        />
      </div>
    );
  }

  // Indeterminate mode — disjoint animation
  return (
    <div className={`relative w-full h-1 overflow-hidden rounded-full ${trackColorClass} ${className}`}>
      {/* Track Stop indicator at start */}
      {showTrackStop && (
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute top-0 bottom-0 left-0 w-1 rounded-full ${stopColorClass}`}
        />
      )}
      {/* Line 1 — primary sweep */}
      <motion.div
        animate={{
          left: ['-10%', '100%'],
          width: ['10%', '60%', '10%'],
        }}
        transition={{
          duration: 1.8,
          ease: [0.4, 0.0, 0.2, 1], // fast_out_slow_in
          repeat: Infinity,
          times: [0, 0.5, 1],
        }}
        className={`absolute top-0 bottom-0 rounded-full ${barColorClass}`}
      />
      {/* Line 2 — delayed secondary sweep */}
      <motion.div
        animate={{
          left: ['-50%', '100%'],
          width: ['0%', '40%', '0%'],
        }}
        transition={{
          duration: 1.8,
          ease: [0.4, 0.0, 0.2, 1], // fast_out_slow_in
          repeat: Infinity,
          delay: 1.0,
          times: [0, 0.5, 1],
        }}
        className={`absolute top-0 bottom-0 rounded-full ${barColorClass}`}
      />
    </div>
  );
}
