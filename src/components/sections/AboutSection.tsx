import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { itemVariants } from '@/lib/animations';

export function AboutSection() {
  const { data } = usePortfolio();
  return (
    <motion.div variants={itemVariants} className="mb-6">
      <SectionLabel text="About" />
      <p className="text-body-sm text-muted-foreground leading-relaxed">
        {data.profile.about}
      </p>
    </motion.div>
  );
}
