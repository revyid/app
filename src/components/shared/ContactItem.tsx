import { Mail, Phone, Calendar, Globe, Twitter, Linkedin, ArrowUpRight } from 'lucide-react';
import type { Contact } from '@/types';

interface ContactItemProps {
  contact: Contact;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail, Phone, Calendar, Globe, Twitter, Linkedin,
};

export function ContactItem({ contact }: ContactItemProps) {
  const IconComponent = iconMap[contact.icon] || Mail;

  return (
    <a
      href={contact.href}
      target={contact.href.startsWith('http') ? '_blank' : undefined}
      rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="group block rounded-[16px] transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.97]"
    >
      <div className="relative bg-surface-variant/50 p-4 overflow-hidden border border-outline/10 rounded-[16px]">
        <div className="absolute inset-0 state-layer pointer-events-none rounded-[inherit]" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit]" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-variant flex items-center justify-center flex-shrink-0 rounded-[12px] transition-all duration-300 group-hover:bg-primary group-hover:scale-110 group-hover:-rotate-5 group-hover:rounded-full">
            <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-label-sm text-muted-foreground uppercase tracking-wider mb-0.5">{contact.label}</p>
            <p className="text-body-md font-medium text-foreground truncate">{contact.value}</p>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 -translate-x-2 scale-75 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200">
            <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </a>
  );
}
