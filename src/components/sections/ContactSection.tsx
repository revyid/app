import { motion } from 'framer-motion';
import { Mail, Globe, Phone } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { contactInfo } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Contact Section — compact list style
 * Uses M3 color tokens and icon button hover effects
 */

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Globe,
  Phone,
};

export function ContactSection() {
  return (
    <motion.div variants={itemVariants} className="mb-6">
      <SectionLabel text="Contact" />
      <div className="space-y-2">
        {contactInfo.map((contact) => {
          const IconComponent = iconMap[contact.icon] || Mail;
          return (
            <motion.a
              key={contact.id}
              href={contact.href}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_BOUNCY}
              className="flex items-center gap-3 text-body-sm text-foreground hover:text-primary transition-colors duration-200 py-1"
            >
              <div className="w-8 h-8 rounded-[8px] bg-surface-variant flex items-center justify-center">
                <IconComponent className="w-4 h-4 text-muted-foreground" />
              </div>
              <span>{contact.label}</span>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}
