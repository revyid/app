import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { EducationCard } from '@/components/shared/EducationCard';
import { education } from '@/data/portfolio-data';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

export function EducationSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Education" />
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {education.map((edu) => (
          <motion.div key={edu.id} variants={itemVariants}>
            <EducationCard education={edu} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
