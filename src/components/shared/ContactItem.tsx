import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, Globe, Twitter, Linkedin, ArrowUpRight } from 'lucide-react';
import type { Contact } from '@/types';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/motion-presets';

/**
 * M3 Contact Item — List Item style
 * Ref: material-components-android/docs/components/List.md
 * - M3 surface container with 12dp corners
 * - State layer + ripple on hover
 * - Icon container with shape morphing on hover (squircle→circle)
 * - Arrow that slides in on hover
 */

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
      whileTap="pressed"
      animate="rest"
      variants={{
        rest: { y: 0, borderRadius: '16px' },
        hover: { y: -4, borderRadius: '16px' },
        pressed: { y: 0, scale: 0.97, borderRadius: '24px' },
      }}
      transition={SPRING_BOUNCY}
      className="group block"
      style={{ borderRadius: '16px' }}
    >
      <div className="relative bg-surface-variant/50 p-4 overflow-hidden border border-outline/10" style={{ borderRadius: 'inherit' }}>
        {/* State Layer */}
        <div className="absolute inset-0 state-layer pointer-events-none" style={{ borderRadius: 'inherit' }} />

        {/* Hover gradient */}
        <motion.div
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
            pressed: { opacity: 0.5 },
          }}
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
          style={{ borderRadius: 'inherit' }}
        />
        
        <div className="relative flex items-center gap-4">
          {/* Icon Container with M3 Shape Morphing */}
          <motion.div
            variants={{
              rest: { scale: 1, rotate: 0, borderRadius: '12px' },
              hover: { scale: 1.1, rotate: -5, borderRadius: '50%' },
              pressed: { scale: 0.95, rotate: 0, borderRadius: '50%' },
            }}
            transition={SPRING_BOUNCY}
            className="w-12 h-12 bg-surface-variant flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-300"
            style={{ borderRadius: '12px' }}
          >
            <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-label-sm text-muted-foreground uppercase tracking-wider mb-0.5">
              {contact.label}
            </p>
            <p className="text-body-md font-medium text-foreground truncate">
              {contact.value}
            </p>
          </div>
          
          {/* Arrow with shape morph */}
          <motion.div
            variants={{
              rest: { opacity: 0, x: -10, scale: 0.8 },
              hover: { opacity: 1, x: 0, scale: 1 },
              pressed: { opacity: 1, x: 0, scale: 0.9 },
            }}
            transition={SPRING_SNAPPY}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
          >
            <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </div>
      </div>
    </motion.a>
  );
}
