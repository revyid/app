import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ContactItem } from '@/components/shared/ContactItem';
import { fullContacts } from '@/data/portfolio-data';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

export function ContactFullSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Contact" />
      </motion.div>
      
      <div className="space-y-3">
        {fullContacts.map((contact) => (
          <motion.div key={contact.id} variants={itemVariants}>
            <ContactItem contact={contact} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
