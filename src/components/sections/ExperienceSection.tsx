import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ExperienceCard } from '@/components/shared/ExperienceCard';
import { experiences } from '@/data/portfolio-data';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

export function ExperienceSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Experience" />
      </motion.div>
      
      <div className="space-y-4">
        {experiences.map((experience) => (
          <motion.div key={experience.id} variants={itemVariants}>
            <ExperienceCard experience={experience} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
