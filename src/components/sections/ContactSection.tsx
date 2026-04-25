import { motion } from 'framer-motion';
import { Mail, Globe, Phone, Calendar, Twitter, Linkedin } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { itemVariants } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail, Globe, Phone, Calendar, Twitter, Linkedin,
};

export function ContactSection() {
  const { data } = usePortfolio();
  return (
    <motion.div variants={itemVariants} className="mb-6">
      <SectionLabel text="Contact" />
      <div className="space-y-2">
        {data.contacts.map((contact) => {
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
