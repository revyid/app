import type { Variants, Transition } from 'framer-motion';

// ============================================
// M3 EXPRESSIVE SPRING CONFIGURATIONS
// Smooth, bouncy, delightful — Material You feel
// ============================================

// M3 Default — smooth, balanced
export const SPRING_DEFAULT: Transition = {
  type: 'spring',
  duration: 0.5,
  bounce: 0.2,
};

// M3 Snappy — quick, responsive interactions
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// M3 Bouncy — playful, expressive
export const SPRING_BOUNCY: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
};

// M3 Gentle — for larger elements, smooth reveals
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

// M3 Stiff — for micro-interactions, fast settle
export const SPRING_STIFF: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
};

// M3 Sheet — bottom sheet, natural feel
export const SPRING_SHEET: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
};

// ============================================
// STAGGER — M3 Expressive cascade
// ============================================

export const STAGGER_FAST = 0.03;
export const STAGGER_NORMAL = 0.05;
export const STAGGER_SLOW = 0.08;

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
// ITEM VARIANTS — M3 Expressive fade + slide
// ============================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
};

// M3 Expressive — bouncy pop in
export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 12 },
  },
};

// ============================================
// CARD VARIANTS — M3 press feedback
// ============================================

export const cardHover: Variants = {
  rest: {
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

export const cardTap: Variants = {
  rest: { scale: 1 },
  tap: {
    scale: 0.97,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
};

// ============================================
// BUTTON VARIANTS — M3 press feedback
// ============================================

export const buttonHover: Variants = {
  rest: {
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  hover: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  tap: {
    scale: 0.95,
    transition: { type: 'spring', stiffness: 600, damping: 30 },
  },
};

export const magneticButton = {
  rest: { x: 0, y: 0 },
  hover: (offset: { x: number; y: number }) => ({
    x: offset.x * 0.3,
    y: offset.y * 0.3,
    transition: { type: 'spring', stiffness: 350, damping: 15 },
  }),
};

// ============================================
// MODAL / BOTTOM SHEET — M3 Expressive
// ============================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export const bottomSheetContent: Variants = {
  hidden: { opacity: 0, y: '100%' },
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
    y: '100%',
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
};

export const modalContent: Variants = bottomSheetContent;

// ============================================
// NAVIGATION — M3 tab feel
// ============================================

export const navItem: Variants = {
  rest: {
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  hover: {
    scale: 1.08,
    transition: { type: 'spring', stiffness: 400, damping: 18 },
  },
  active: {
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

// ============================================
// ERROR / VALIDATION — M3 Expressive
// ============================================

export const shakeError: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

export const bounceError: Variants = {
  initial: { scale: 1 },
  bounce: {
    scale: [1, 1.08, 0.92, 1.04, 0.98, 1],
    transition: { duration: 0.5, ease: [0.36, 0.07, 0.19, 0.97] },
  },
};

export const successPulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

// ============================================
// SCROLL REVEAL — M3 Expressive
// ============================================

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 22 },
  },
};

// ============================================
// SHARED ELEMENT / LAYOUT
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
// IDLE / AMBIENT — M3 Expressive
// ============================================

export const idleFloat: Variants = {
  idle: {
    y: [0, -8, 0],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
};

export const idleBreathe: Variants = {
  idle: {
    scale: [1, 1.03, 1],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
};

export const idlePulseGlow: Variants = {
  idle: {
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, ease: 'easeInOut', repeat: Infinity },
  },
};

// ============================================
// PAGE TRANSITIONS — M3 Expressive
// ============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export const materialFadeThrough: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.2, 0, 0, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export const materialSharedAxisY: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -24,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export const materialSharedAxisZ: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export const materialElevationScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  },
};

// ============================================
// FLOATING NAVBAR — M3 Expressive
// ============================================

export const floatingNavbar: Variants = {
  hidden: { y: 80, opacity: 0 },
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
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  expanded: {
    width: 'auto',
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

// ============================================
// COMMAND PALETTE — M3 Expressive
// ============================================

export const commandPalette: Variants = {
  hidden: { opacity: 0, y: '100%' },
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
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

// ============================================
// FLUID SURFACE CARDS
// ============================================

export const fluidSurface = (index: number): Variants => ({
  hidden: { opacity: 0, y: 30, scale: 0.95 },
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
// PARTICLE BURST
// ============================================

export const particleBurst = (index: number): Variants => ({
  initial: { scale: 0, opacity: 1 },
  animate: {
    scale: 1,
    opacity: 0,
    x: Math.cos(index * 45 * (Math.PI / 180)) * 50,
    y: Math.sin(index * 45 * (Math.PI / 180)) * 50,
    transition: { type: 'spring', stiffness: 200, damping: 15 },
  },
});

// ============================================
// COMPAT EXPORTS
// ============================================

export const itemVariants: Variants = fadeInUp;

export const fadeInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 250, damping: 22 },
  },
};

export const cardHoverVariants: Variants = cardHover;

export const scaleHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 18 },
  },
};

export const createStaggerContainer = (staggerChildren: number = 0.05, delayChildren: number = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren, delayChildren },
  },
});

// ============================================
// CONSTANTS
// ============================================

export const EASING_STANDARD = [0.2, 0, 0, 1];
export const EASING_EMPHASIZED = [0.2, 0, 0, 1];
export const EASING_EMPHASIZED_DECELERATE = [0.05, 0.7, 0.1, 1];
export const EASING_EMPHASIZED_ACCELERATE = [0.3, 0, 0.8, 0.15];
export const DURATION_SHORT1 = 0.05;
export const DURATION_SHORT2 = 0.1;
export const DURATION_SHORT3 = 0.15;
export const DURATION_SHORT4 = 0.2;
export const DURATION_MEDIUM1 = 0.25;
export const DURATION_MEDIUM2 = 0.3;
export const DURATION_MEDIUM3 = 0.35;
export const DURATION_MEDIUM4 = 0.4;
export const DURATION_LONG1 = 0.45;
export const DURATION_LONG2 = 0.5;
export const DURATION_LONG3 = 0.55;
export const DURATION_LONG4 = 0.6;
export const DURATION_EXTRA_LONG1 = 0.7;
export const DURATION_EXTRA_LONG2 = 0.8;
export const DURATION_EXTRA_LONG3 = 0.9;
export const DURATION_EXTRA_LONG4 = 1;
export const DURATION_SHORT = 0.2;
export const DURATION_MEDIUM = 0.3;
export const DURATION_LONG = 0.5;
export const DURATION_EXTRA_LONG = 0.7;

export const bentoItem = fluidSurface;

// Viewport settings for scroll animations
export const viewportOnce = {
  once: true,
  margin: '-100px',
};

export const viewportPartial = {
  once: false,
  margin: '-50px',
};
