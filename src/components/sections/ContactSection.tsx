import { Mail, Globe, Phone, Calendar, Twitter, Linkedin } from 'lucide-react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail, Globe, Phone, Calendar, Twitter, Linkedin,
};

export function ContactSection() {
  const { data } = usePortfolio();
  return (
    <div className="mb-6">
      <SectionLabel text="Contact" />
      <div className="space-y-2">
        {data.contacts.map((contact) => {
          const IconComponent = iconMap[contact.icon] || Mail;
          return (
            <a
              key={contact.id}
              href={contact.href}
              className="flex items-center gap-3 text-body-sm text-foreground hover:text-primary hover:translate-x-1 active:scale-[0.97] transition-all duration-200 py-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-[8px] bg-surface-variant flex items-center justify-center">
                <IconComponent className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="truncate">{contact.value}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
