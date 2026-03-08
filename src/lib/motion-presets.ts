import type { Variants, Transition } from 'framer-motion';

// ============================================
// SPRING PHYSICS CONFIGURATIONS
// All animations use spring physics for organic,
// bouncy, weighted feel — no linear/ease-in-out
// ============================================

// Default spring - balanced feel
export const SPRING_DEFAULT: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

// Snappy spring - quick, responsive interactions
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

// Bouncy spring - playful, Gopix-style
export const SPRING_BOUNCY: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 15,
};

// Gentle spring - for larger elements, slow reveals
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
};

// Stiff spring - for micro-interactions
export const SPRING_STIFF: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 35,
};

// Bottom sheet spring - natural sheet feel
export const SPRING_SHEET: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
};

// ============================================
// STAGGER CONFIGURATIONS
// ============================================

export const STAGGER_FAST = 0.03;
export const STAGGER_NORMAL = 0.05;
export const STAGGER_SLOW = 0.1;

// ============================================
// CONTAINER VARIANTS
// ============================================

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_NORMAL,
      delayChildren: 0.1,
    },
  },
};

export const containerVariantsFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_FAST,
      delayChildren: 0.05,
    },
  },
};

export const containerVariantsSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_SLOW,
      delayChildren: 0.15,
    },
  },
};

// ============================================
// ITEM VARIANTS (Spring Physics)
// ============================================

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 24 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -24 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -24 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 24 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.85
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 22,
    },
  },
};

export const scaleInBounce: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.3 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 12,
    },
  },
};

// ============================================
// CARD VARIANTS (Spring Physics)
// ============================================

export const cardHover: Variants = {
  rest: {
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const cardTap: Variants = {
  rest: { scale: 1 },
  tap: { 
    scale: 0.97,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

// ============================================
// BUTTON VARIANTS (Spring Physics)
// ============================================

export const buttonHover: Variants = {
  rest: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 30,
    },
  },
};

export const magneticButton = {
  rest: { x: 0, y: 0 },
  hover: (offset: { x: number; y: number }) => ({
    x: offset.x * 0.3,
    y: offset.y * 0.3,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 15,
    },
  }),
};

// ============================================
// BOTTOM SHEET / MODAL VARIANTS
// ============================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    },
  },
};

export const bottomSheetContent: Variants = {
  hidden: { 
    opacity: 0, 
    y: '100%',
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 30,
    },
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    },
  },
};

// Legacy alias for components still using modalContent
export const modalContent: Variants = bottomSheetContent;

// ============================================
// NAVIGATION VARIANTS
// ============================================

export const navItem: Variants = {
  rest: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  hover: {
    scale: 1.08,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 18,
    },
  },
  active: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

// ============================================
// ERROR/VALIDATION VARIANTS (Spring Bounce)
// ============================================

export const shakeError: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 10,
    },
  },
};

export const bounceError: Variants = {
  initial: { scale: 1 },
  bounce: {
    scale: [1, 1.08, 0.92, 1.04, 0.98, 1],
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
};

// ============================================
// SUCCESS FEEDBACK
// ============================================

export const successPulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 15,
    },
  },
};

// ============================================
// SCROLL REVEAL (Spring)
// ============================================

export const scrollReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 22,
    },
  },
};

// ============================================
// SHARED ELEMENT / LAYOUT TRANSITIONS
// ============================================

export const sharedElementTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
};

export const layoutTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
};

// ============================================
// NATIVE M3 PORTED ANIMATIONS (Android 14)
// Ported from: /lib/java/com/google/android/material/transition/
// ============================================

export const materialFadeThrough: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.2, 0.0, 0, 1.0] } // Emphasized decelerate
  },
  exit: { 
    opacity: 0, 
    scale: 0.92,
    transition: { duration: 0.2, ease: [0.4, 0.0, 1, 1] } // FastOutLinearIn
  },
};

export const materialSharedAxisY: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.2, 0.0, 0, 1.0] }
  },
  exit: { 
    opacity: 0, 
    y: -30,
    transition: { duration: 0.2, ease: [0.4, 0.0, 1, 1] }
  },
};

export const materialSharedAxisZ: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.2, 0.0, 0, 1.0] }
  },
  exit: { 
    opacity: 0, 
    scale: 1.15,
    transition: { duration: 0.2, ease: [0.4, 0.0, 1, 1] }
  },
};

export const materialElevationScale: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.2, 0.0, 0, 1.0] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.85,
    transition: { duration: 0.2, ease: [0.4, 0.0, 1, 1] }
  },
};

// ============================================
// PARTICLE EFFECTS
// ============================================

export const particleBurst = (index: number): Variants => ({
  initial: { 
    scale: 0, 
    opacity: 1,
    x: 0,
    y: 0,
  },
  animate: {
    scale: [0, 1.5, 0],
    opacity: [1, 1, 0],
    x: Math.cos(index * 45 * (Math.PI / 180)) * 50,
    y: Math.sin(index * 45 * (Math.PI / 180)) * 50,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
});

// ============================================
// FLOATING PILL NAVBAR
// ============================================

export const floatingNavbar: Variants = {
  hidden: { 
    y: 100, 
    opacity: 0 
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      delay: 0.3,
    },
  },
};

export const pillExpand: Variants = {
  collapsed: {
    width: 'auto',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  expanded: {
    width: 'auto',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

// ============================================
// FLUID SURFACE CARDS
// ============================================

export const fluidSurface = (index: number): Variants => ({
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 250,
      damping: 22,
      delay: index * STAGGER_NORMAL,
    },
  },
});

// ============================================
// COMMAND PALETTE (Bottom Sheet)
// ============================================

export const commandPalette: Variants = {
  hidden: { 
    opacity: 0, 
    y: '100%',
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    },
  },
};

// ============================================
// VIEWPORT SETTINGS
// ============================================

export const viewportOnce = {
  once: true,
  margin: '-100px',
};

export const viewportPartial = {
  once: false,
  margin: '-50px',
};

// ============================================
// IDLE / AMBIENT ANIMATIONS
// Subtle looping animations for elements at rest
// ============================================

/** Gentle floating — cards, avatars, decorative elements */
export const idleFloat: Variants = {
  idle: {
    y: [0, -6, 0],
    transition: {
      duration: 4,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
};

/** Slow breathing scale — profile images, icons, badges */
export const idleBreathe: Variants = {
  idle: {
    scale: [1, 1.03, 1],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
};

/** Subtle rotation wobble — decorative shapes, loading indicators */
export const idleWobble: Variants = {
  idle: {
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 5,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
};

/** Pulse glow — status indicators, active badges */
export const idlePulseGlow: Variants = {
  idle: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.15, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
};

/** Shimmer sweep — skeleton loaders, shiny surfaces */
export const idleShimmer = {
  x: ['-100%', '100%'],
  transition: {
    duration: 2,
    ease: 'easeInOut',
    repeat: Infinity,
    repeatDelay: 3,
  },
};

/** Staggered float — for groups of items that float at different speeds */
export const idleFloatStaggered = (index: number): Variants => ({
  idle: {
    y: [0, -4 - (index % 3) * 2, 0],
    transition: {
      duration: 3 + (index % 3),
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
      delay: index * 0.2,
    },
  },
});

/** M3 Shape morph idle — for decorative elements that subtly change shape */
export const idleShapeMorph: Variants = {
  idle: {
    borderRadius: ['24px', '28px', '20px', '24px'],
    transition: {
      duration: 6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
};

// ============================================
// LEGACY COMPAT — deprecated easing exports
// These are kept for any components that still
// reference them, but prefer spring configs above
// ============================================

export const EASING_STANDARD: Transition['ease'] = [0.2, 0.0, 0, 1.0];
export const EASING_EMPHASIZED: Transition['ease'] = [0.4, 0.0, 0.2, 1.0];
export const EASING_DECELERATE: Transition['ease'] = [0.0, 0.0, 0.2, 1.0];
export const EASING_ACCELERATE: Transition['ease'] = [0.4, 0.0, 1.0, 1.0];
export const EASING_BOUNCE: Transition['ease'] = [0.68, -0.55, 0.265, 1.55];

// Legacy duration tokens
export const DURATION_INSTANT = 0;
export const DURATION_SHORT = 0.15;
export const DURATION_MEDIUM = 0.3;
export const DURATION_LONG = 0.5;
export const DURATION_EXTRA_LONG = 0.7;

// Legacy bento item (now uses fluid surface)
export const bentoItem = fluidSurface;
