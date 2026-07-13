import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ExperienceCard } from '@/components/shared/ExperienceCard';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/motion-presets';

export function ExperienceSection() {
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
        <SectionLabel text="Experience" />
      </motion.div>
      <div className="space-y-4">
        {data.experiences.map((experience, index) => (
          <motion.div key={experience.id} variants={itemVariants} data-aos="slide-right" data-aos-delay={index * 100}>
            <ExperienceCard experience={experience} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
