import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ContactItem } from '@/components/shared/ContactItem';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/motion-presets';

export function ContactFullSection() {
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
        <SectionLabel text="Contact" />
      </motion.div>
      <div className="space-y-3">
        {data.contacts.map((contact, index) => (
          <motion.div key={contact.id} variants={itemVariants} data-aos="slide-left" data-aos-delay={index * 100}>
            <ContactItem contact={contact} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
