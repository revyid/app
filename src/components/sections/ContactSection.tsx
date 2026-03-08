import { motion } from 'framer-motion';
import { Mail, Globe, Phone } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { contactInfo } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';

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
            <a
              key={contact.id}
              href={contact.href}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <IconComponent className="w-4 h-4 text-gray-500 dark:text-zinc-500" />
              <span>{contact.label}</span>
            </a>
          );
        })}
      </div>
    </motion.div>
  );
}
