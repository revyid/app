import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/*
 * M3 Expressive Button System
 * 5 styles: filled, tonal, outlined, elevated, text
 * Features: ripple effect, shape morphing on press, M3 state layers
 * Ref: material-components-android/docs/components/CommonButton.md
 */

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all select-none overflow-hidden disabled:pointer-events-none disabled:opacity-38 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // M3 Filled — highest emphasis
        filled:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md active:shadow-sm",
        // M3 Tonal — medium emphasis, secondary container
        tonal:
          "bg-secondary-container text-secondary-container-foreground hover:shadow-sm",
        // M3 Outlined — medium-low emphasis
        outlined:
          "border-2 border-outline/60 bg-transparent text-foreground hover:bg-foreground/5 hover:border-outline",
        // M3 Elevated — low emphasis with shadow
        elevated:
          "bg-surface text-foreground shadow-md hover:shadow-lg border border-outline/10",
        // M3 Text — lowest emphasis
        text: "bg-transparent text-primary hover:bg-primary/8",
        // Destructive
        destructive:
          "bg-error text-error-foreground hover:bg-error/90 shadow-sm",
        // Ghost (icon-only, no bg)
        ghost:
          "bg-transparent text-foreground hover:bg-foreground/8",
        // Link
        link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // M3 Expressive sizes
        xs: "h-7 px-3 text-xs rounded-lg gap-1",
        sm: "h-8 px-4 text-label-sm rounded-[12px] gap-1.5",
        default: "h-10 px-6 text-label-lg rounded-[20px]",
        md: "h-11 px-7 text-label-lg rounded-[22px]",
        lg: "h-12 px-8 text-body-md rounded-[24px]",
        xl: "h-14 px-10 text-body-lg rounded-[28px]",
        icon: "size-10 rounded-[20px] p-0",
        "icon-sm": "size-8 rounded-[12px] p-0",
        "icon-lg": "size-12 rounded-[24px] p-0",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
)

// ── M3 Ripple Effect ──────────────────────────────────────────────
interface RippleItem {
  id: number
  x: number
  y: number
  size: number
}

function useRipple() {
  const [ripples, setRipples] = React.useState<RippleItem[]>([])

  const addRipple = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2.5
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      const id = Date.now()

      setRipples((prev) => [...prev, { id, x, y, size }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    },
    []
  )

  return { ripples, addRipple }
}

function RippleContainer({ ripples }: { ripples: RippleItem[] }) {
  if (ripples.length === 0) return null
  return (
    <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-current opacity-[0.12] rounded-full animate-[ripple_600ms_ease-out_forwards]"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </span>
  )
}

// ── M3 State Layer ────────────────────────────────────────────────
function StateLayer() {
  return (
    <span className="absolute inset-0 rounded-[inherit] pointer-events-none bg-current opacity-0 transition-opacity duration-200 group-hover/btn:opacity-[0.08] group-active/btn:opacity-[0.12] group-focus-visible/btn:opacity-[0.12]" />
  )
}

// ── Button Component ──────────────────────────────────────────────
export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Disable the M3 ripple effect */
  disableRipple?: boolean
  /** Disable shape morphing animation on press */
  disableAnimation?: boolean
}

function Button({
  className,
  variant = "filled",
  size = "default",
  asChild = false,
  disableRipple = false,
  disableAnimation = false,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const { ripples, addRipple } = useRipple()
  const isLink = variant === "link"

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple && !isLink) addRipple(e)
      onClick?.(e)
    },
    [disableRipple, isLink, addRipple, onClick]
  )

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  if (disableAnimation || isLink) {
    return (
      <button
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(
          "group/btn",
          buttonVariants({ variant, size, className })
        )}
        onClick={handleClick}
        {...props}
      >
        <StateLayer />
        {children}
        {!disableRipple && <RippleContainer ripples={ripples} />}
      </button>
    )
  }

  // Animated button with shape morphing
  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/btn",
        buttonVariants({ variant, size, className })
      )}
      onClick={handleClick as any}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{
        scale: 0.94,
        borderRadius: "32px",
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      {...(props as any)}
    >
      <StateLayer />
      {children}
      {!disableRipple && <RippleContainer ripples={ripples} />}
    </motion.button>
  )
}

// ── M3 Icon Button ────────────────────────────────────────────────
export interface IconButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Toggle state */
  selected?: boolean
  disableRipple?: boolean
}

function IconButton({
  className,
  variant = "ghost",
  selected = false,
  disableRipple = false,
  onClick,
  children,
  ...props
}: IconButtonProps) {
  const { ripples, addRipple } = useRipple()

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple) addRipple(e)
      onClick?.(e)
    },
    [disableRipple, addRipple, onClick]
  )

  return (
    <motion.button
      data-slot="icon-button"
      data-selected={selected || undefined}
      className={cn(
        "group/btn relative inline-flex items-center justify-center overflow-hidden transition-colors",
        "size-10 rounded-[20px] p-0",
        selected
          ? "bg-primary text-primary-foreground"
          : variant === "outlined"
            ? "border-2 border-outline/60 bg-transparent text-foreground hover:bg-foreground/5"
            : variant === "tonal"
              ? "bg-secondary-container text-secondary-container-foreground"
              : variant === "filled"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-foreground hover:bg-foreground/8",
        "disabled:pointer-events-none disabled:opacity-38",
        className
      )}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88, borderRadius: "14px" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick as any}
      {...(props as any)}
    >
      <StateLayer />
      {children}
      {!disableRipple && <RippleContainer ripples={ripples} />}
    </motion.button>
  )
}

// ── M3 FAB (Floating Action Button) ───────────────────────────────
const fabVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden font-medium transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  {
    variants: {
      variant: {
        surface: "bg-surface-container-high text-primary elevation-3",
        primary: "bg-primary-container text-primary-container-foreground elevation-3",
        secondary: "bg-secondary-container text-secondary-container-foreground elevation-3",
        tertiary: "bg-tertiary-container text-tertiary-container-foreground elevation-3",
      },
      size: {
        sm: "h-10 rounded-[12px] px-3 [&_svg]:size-5",
        default: "h-14 rounded-[16px] px-4 [&_svg]:size-6",
        lg: "h-[96px] rounded-[28px] px-6 [&_svg]:size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface FABProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof fabVariants> {
  extended?: boolean
  disableRipple?: boolean
}

function FAB({
  className,
  variant = "primary",
  size = "default",
  extended = false,
  disableRipple = false,
  onClick,
  children,
  ...props
}: FABProps) {
  const { ripples, addRipple } = useRipple()

  return (
    <motion.button
      data-slot="fab"
      className={cn(
        fabVariants({ variant, size, className }),
        !extended && size === "sm" && "w-10",
        !extended && size === "default" && "w-14",
        !extended && size === "lg" && "w-[96px]",
      )}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.92, borderRadius: "24px" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={(e: any) => {
        if (!disableRipple) addRipple(e)
        onClick?.(e)
      }}
      {...(props as any)}
    >
      <StateLayer />
      {children}
      {!disableRipple && <RippleContainer ripples={ripples} />}
    </motion.button>
  )
}

export { Button, IconButton, FAB, buttonVariants }
