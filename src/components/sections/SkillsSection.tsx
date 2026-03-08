import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { SkillTag } from '@/components/shared/SkillTag';
import { skills } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';

export function SkillsSection() {
  return (
    <motion.div variants={itemVariants} className="mb-6">
      <SectionLabel text="Skills" />
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <SkillTag key={skill} skill={skill} />
        ))}
      </div>
    </motion.div>
  );
}
