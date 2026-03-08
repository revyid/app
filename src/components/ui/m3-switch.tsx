import { useState, useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/*
 * M3 Switch Component
 * Ref: material-components-android/docs/components/Switch.md
 * Features:
 * - Track + Handle with smooth spring animation
 * - Icon inside handle (check/x)
 * - Handle grows when checked (M3 spec)
 * - Ripple state on interaction
 */

interface M3SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  showIcons?: boolean;
}

export function M3Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  className,
  showIcons = true,
}: M3SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : internalChecked;
  const id = useId();

  const toggle = useCallback(() => {
    if (disabled) return;
    const newVal = !isChecked;
    if (!isControlled) setInternalChecked(newVal);
    onChange?.(newVal);
  }, [disabled, isChecked, isControlled, onChange]);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3',
        disabled && 'opacity-38 pointer-events-none',
        className
      )}
    >
      <button
        role="switch"
        id={id}
        aria-checked={isChecked}
        aria-label={label}
        onClick={toggle}
        className={cn(
          'relative inline-flex items-center cursor-pointer',
          'w-[52px] h-[32px] rounded-full p-[2px]',
          'transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none',
          isChecked
            ? 'bg-primary'
            : 'bg-surface-container-highest border-2 border-outline'
        )}
      >
        {/* Track Decoration */}
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{
            backgroundColor: isChecked
              ? 'transparent'
              : 'transparent',
          }}
        />

        {/* Handle */}
        <motion.span
          className={cn(
            'flex items-center justify-center rounded-full shadow-sm',
            isChecked
              ? 'bg-on-primary'
              : 'bg-outline'
          )}
          animate={{
            x: isChecked ? 20 : 0,
            width: isChecked ? 24 : 16,
            height: isChecked ? 24 : 16,
            marginTop: isChecked ? 0 : 4,
            marginLeft: isChecked ? 0 : 4,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          style={{
            backgroundColor: isChecked
              ? 'hsl(var(--primary-foreground))'
              : 'hsl(var(--outline))',
          }}
        >
          {/* Icon inside handle */}
          {showIcons && (
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isChecked ? 'hsl(var(--primary))' : 'hsl(var(--surface-variant))'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute inset-0 m-auto"
            >
              {/* Check mark */}
              <motion.path
                d="M5 13l4 4L19 7"
                initial={false}
                animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              {/* X mark / Lines */}
              <motion.path
                d="M18 6L6 18"
                initial={false}
                animate={{ pathLength: isChecked ? 0 : 1, opacity: isChecked ? 0 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              <motion.path
                d="M6 6l12 12"
                initial={false}
                animate={{ pathLength: isChecked ? 0 : 1, opacity: isChecked ? 0 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.svg>
          )}
        </motion.span>
      </button>

      {label && (
        <label
          htmlFor={id}
          className="text-body-md text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}
