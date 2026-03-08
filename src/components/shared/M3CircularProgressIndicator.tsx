import { motion } from 'framer-motion';

interface M3CircularProgressIndicatorProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error';
  /** If provided, show determinate progress (0-100) */
  value?: number;
}

/**
 * M3 Circular Progress Indicator
 * Ported from material-components-android CircularProgressIndicator
 *
 * Indeterminate: expanding/collapsing arc with rotation
 * Determinate: static arc with progress value
 */
export function M3CircularProgressIndicator({
  className = '',
  size = 48,
  strokeWidth = 4,
  color = 'primary',
  value,
}: M3CircularProgressIndicatorProps) {
  const colorClass =
    color === 'primary' ? 'stroke-primary' :
    color === 'secondary' ? 'stroke-secondary' :
    color === 'tertiary' ? 'stroke-tertiary' :
    'stroke-error';

  const trackColorClass =
    color === 'primary' ? 'stroke-primary/20' :
    color === 'secondary' ? 'stroke-secondary/20' :
    color === 'tertiary' ? 'stroke-tertiary/20' :
    'stroke-error/20';

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const isDeterminate = value !== undefined;

  if (isDeterminate) {
    const normalizedValue = Math.max(0, Math.min(100, value));
    const dashOffset = circumference - (normalizedValue / 100) * circumference;

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`${className}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackColorClass}
        />
        {/* Progress Arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorClass}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.4, ease: [0.2, 0.0, 0, 1.0] }}
        />
        {/* Track stop indicator (small dot at 0%) */}
        <circle
          cx={center}
          cy={center - radius}
          r={strokeWidth / 2}
          className={`fill-current ${
            color === 'primary' ? 'text-primary/40' :
            color === 'secondary' ? 'text-secondary/40' :
            color === 'tertiary' ? 'text-tertiary/40' :
            'text-error/40'
          }`}
        />
      </svg>
    );
  }

  // Indeterminate mode — expanding/contracting arc with rotation
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.4,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className={trackColorClass}
      />
      {/* Active Arc — expanding and contracting */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={colorClass}
        strokeDasharray={circumference}
        animate={{
          strokeDashoffset: [
            circumference * 0.75,    // Start small
            circumference * 0.15,    // Expand
            circumference * 0.75,    // Contract
          ],
          rotate: [0, 180, 360],     // Rotate the arc start point
        }}
        transition={{
          duration: 2.0,
          ease: [0.4, 0.0, 0.2, 1], // fast_out_slow_in
          repeat: Infinity,
          times: [0, 0.5, 1],
        }}
        style={{
          transformOrigin: `${center}px ${center}px`,
        }}
      />
      {/* Track stop indicator */}
      <motion.circle
        cx={center}
        cy={strokeWidth / 2}
        r={strokeWidth * 0.4}
        className={`fill-current ${
          color === 'primary' ? 'text-primary/30' :
          color === 'secondary' ? 'text-secondary/30' :
          color === 'tertiary' ? 'text-tertiary/30' :
          'text-error/30'
        }`}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{
          duration: 2.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.svg>
  );
}
