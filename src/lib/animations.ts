import type { Variants } from 'framer-motion';

// Container variant for staggered children (spring)
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Item variant for fade + slide up (spring)
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
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

// Fade in variant (spring)
export const fadeInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

// Slide up variant (spring)
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 250,
      damping: 22,
    },
  },
};

// Card hover variant (spring)
export const cardHoverVariants: Variants = {
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
    y: -6, 
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// Scale on hover (spring)
export const scaleHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 18,
    },
  },
};

// Stagger container with custom delay
export const createStaggerContainer = (staggerChildren: number = 0.05, delayChildren: number = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Viewport animation settings
export const viewportOnce = {
  once: true,
  margin: '-50px',
};
