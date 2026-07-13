import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { EducationCard } from '@/components/shared/EducationCard';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/motion-presets';

export function EducationSection() {
  const data = usePortfolioStore((s) => s.data);
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
      data-aos="fade-up"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Education" />
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.education.map((edu, index) => (
          <motion.div key={edu.id} variants={itemVariants} data-aos="zoom-in" data-aos-delay={index * 100}>
            <EducationCard education={edu} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
