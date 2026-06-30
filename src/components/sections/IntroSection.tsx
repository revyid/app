import { useRef, memo } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { M3ExpressiveIndicator } from '@/components/shared/M3ExpressiveIndicator';
import { usePortfolio } from '@/contexts/PortfolioContext';

export const IntroSection = memo(function IntroSection() {
  const { data } = usePortfolio();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-15, 20]);
  const y3 = useTransform(scrollYProgress, [0, 1], [20, -15]);

  return (
    <section
      ref={containerRef}
      className="mb-10 relative overflow-hidden py-6 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-[32px]"
    >
      {/* Background Shapes — sangat lambat */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-30">
        <motion.div style={{ y: y1 }} className="absolute -top-10 -right-10">
          <M3ExpressiveIndicator className="w-40 h-40" duration={16} />
        </motion.div>
        <motion.div style={{ y: y2 }} className="absolute top-1/3 -left-8">
          <M3ExpressiveIndicator className="w-28 h-28" duration={20} />
        </motion.div>
        <motion.div style={{ y: y3 }} className="absolute -bottom-12 right-1/4">
          <M3ExpressiveIndicator className="w-32 h-32" duration={18} />
        </motion.div>
      </div>

      {/* Full section blur */}
      <div className="absolute inset-0 backdrop-blur-lg bg-background/40 z-[1]" />

      {/* Content di atas blur */}
      <div className="relative z-10 w-full sm:w-2/3 p-4 sm:p-0">
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
