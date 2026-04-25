import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { itemVariants, viewportOnce } from '@/lib/animations';
import { M3Shapes } from '@/components/shared/M3ExpressiveIndicator';

// Custom shape sequences for background ambiance
const sequence1 = [
  M3Shapes.clover8,
  M3Shapes.cookie9,
  M3Shapes.flower,
  M3Shapes.clover8,
];

const sequence2 = [
  M3Shapes.gem,
  M3Shapes.pentagon,
  M3Shapes.puffyDiamond,
  M3Shapes.gem,
];

const sequence3 = [
  M3Shapes.softBurst,
  M3Shapes.sunny,
  M3Shapes.boom,
  M3Shapes.softBurst,
];

export function IntroSection() {
  const { data } = usePortfolio();
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax effect for shapes on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-20, 30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [30, -20]);

  // Framer-motion transition settings
  const morphTransition = {
    duration: 5, // Slow morphing over 15s
    ease: "linear" as const,
    repeat: Infinity,
  };

  const rotateTransition = {
    duration: 10, // Very slow rotation
    ease: "linear" as const,
    repeat: Infinity,
  };

  return (
    <section
      ref={containerRef}
      className="mb-10 relative overflow-hidden py-6 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-[32px]"
    >
      {/* Background Shapes Container (No inherited variants) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-30 isolated">

        {/* Primary Color Shape: Clover/Flower vibe */}
        <motion.div style={{ y: y1 }} className="absolute -top-16 -right-16 w-56 h-56">
          <motion.svg
            viewBox="0 0 100 100"
            className="w-full h-full fill-primary blur-[2px] opacity-60 drop-shadow-sm"
            animate={{ rotate: [0, 180, 360] }}
            transition={rotateTransition}
          >
            <motion.path animate={{ d: sequence1 }} transition={morphTransition} />
          </motion.svg>
        </motion.div>

        {/* Secondary Container Shape: Geometric Vibe */}
        <motion.div style={{ y: y2 }} className="absolute top-1/2 -left-16 w-40 h-40">
          <motion.svg
            viewBox="0 0 100 100"
            className="w-full h-full fill-secondary-container blur-[1px] opacity-70"
            animate={{ rotate: [360, 180, 0] }}
            transition={{ ...rotateTransition, duration: 20 }}
          >
            <motion.path animate={{ d: sequence2 }} transition={morphTransition} />
          </motion.svg>
        </motion.div>

        {/* Tertiary Color Shape: Burst Vibe */}
        <motion.div style={{ y: y3 }} className="absolute -bottom-20 right-1/4 w-48 h-48">
          <motion.svg
            viewBox="0 0 100 100"
            className="w-full h-full fill-tertiary blur-[3px] opacity-60"
            animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 0.9, 1] }}
            transition={{ ...rotateTransition, duration: 30 }}
          >
            <motion.path animate={{ d: sequence3 }} transition={{ ...morphTransition, duration: 18 }} />
          </motion.svg>
        </motion.div>
      </div>

      {/* Foreground Content */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={itemVariants}
        className="relative z-10 w-full sm:w-2/3 backdrop-blur-sm bg-background/50 sm:bg-transparent p-4 sm:p-0 rounded-[24px]"
      >
        <SectionLabel text="Intro" />
        <div className="space-y-4">
          {data.intro.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-body-lg text-foreground leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
