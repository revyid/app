import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { profileData } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';

export function AboutSection() {
  return (
    <motion.div variants={itemVariants} className="mb-6">
      <SectionLabel text="About" />
      <p className="text-body-sm text-muted-foreground leading-relaxed">
        {profileData.about}
      </p>
    </motion.div>
  );
}
