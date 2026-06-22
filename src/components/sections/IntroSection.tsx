import { useRef, memo } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';

export const IntroSection = memo(function IntroSection() {
  const { data } = usePortfolio();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-20, 30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [30, -20]);

  return (
    <section
      ref={containerRef}
      className="mb-10 relative overflow-hidden py-6 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-[32px]"
    >
      {/* Background Shapes — CSS spin + framer-motion parallax */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-30 isolated">
        <motion.div style={{ y: y1 }} className="absolute -top-16 -right-16 w-56 h-56">
          <div className="w-full h-full rounded-full bg-primary/20 blur-[2px] animate-[spin_20s_linear_infinite]" />
        </motion.div>
        <motion.div style={{ y: y2 }} className="absolute top-1/2 -left-16 w-40 h-40">
          <div className="w-full h-full rounded-full bg-secondary-container/30 blur-[1px] animate-[spin_30s_linear_infinite_reverse]" />
        </motion.div>
        <motion.div style={{ y: y3 }} className="absolute -bottom-20 right-1/4 w-48 h-48">
          <div className="w-full h-full rounded-full bg-tertiary/20 blur-[3px] animate-[spin_25s_linear_infinite]" />
        </motion.div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full sm:w-2/3 backdrop-blur-sm bg-background/50 sm:bg-transparent p-4 sm:p-0 rounded-[24px]">
        <SectionLabel text="Intro" />
        <div className="space-y-4">
          {data.intro.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-body-lg text-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
});
