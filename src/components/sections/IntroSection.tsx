import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { introContent } from '@/data/portfolio-data';
import { itemVariants, viewportOnce } from '@/lib/animations';

export function IntroSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={itemVariants}
      className="mb-10"
    >
      <SectionLabel text="Intro" />
      <div className="space-y-4">
        {introContent.paragraphs.map((paragraph, index) => (
          <p 
            key={index}
            className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </motion.section>
  );
}
