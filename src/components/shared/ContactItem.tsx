import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, Globe, Twitter, Linkedin, ArrowUpRight } from 'lucide-react';
import type { Contact } from '@/types';

interface ContactItemProps {
  contact: Contact;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Phone,
  Calendar,
  Globe,
  Twitter,
  Linkedin,
};

export function ContactItem({ contact }: ContactItemProps) {
  const IconComponent = iconMap[contact.icon] || Mail;

  return (
    <motion.a
      href={contact.href}
      target={contact.href.startsWith('http') ? '_blank' : undefined}
      rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: { y: 0 },
        hover: { y: -4 },
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group block"
    >
      <div className="relative bg-surface rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Hover Background */}
        <motion.div
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
          }}
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
        />
        
        <div className="relative flex items-center gap-4">
          {/* Icon Container */}
          <motion.div
            variants={{
              rest: { scale: 1, rotate: 0 },
              hover: { scale: 1.1, rotate: -5 },
            }}
            className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-300"
          >
            <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              {contact.label}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {contact.value}
            </p>
          </div>
          
          {/* Arrow */}
          <motion.div
            variants={{
              rest: { opacity: 0, x: -10 },
              hover: { opacity: 1, x: 0 },
            }}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
          >
            <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </div>
      </div>
    </motion.a>
  );
}
