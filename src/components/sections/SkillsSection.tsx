import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { SkillTag } from '@/components/shared/SkillTag';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { itemVariants } from '@/lib/animations';

export function SkillsSection() {
  const { data } = usePortfolio();
  return (
    <motion.div variants={itemVariants} className="mb-6">
      <SectionLabel text="Skills" />
      <div className="flex flex-wrap gap-2">
        {data.skills.map((skill) => (
          <SkillTag key={skill} skill={skill} />
        ))}
      </div>
    </motion.div>
  );
}
