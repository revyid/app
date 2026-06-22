import { Twitter, AtSign, Instagram, Linkedin, Github, Youtube, Facebook, Twitch, Mail, Globe, MessageCircle, Send, Link as LinkIcon, Music, Video } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Twitter, AtSign, Instagram, Linkedin, Github, Youtube, Facebook, Twitch, Mail, Globe, MessageCircle, Send, Link: LinkIcon, Music, Video,
};

export function SocialLinks() {
  const { data } = usePortfolio();
  return (
    <div className="flex items-center gap-3">
      {data.social_links.map((link, index) => {
        const IconComponent = iconMap[link.icon] || Twitter;
        return (
          <a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center bg-surface-variant/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:-translate-y-0.5 active:scale-90 transition-all duration-200 border border-outline/10 idle-float rounded-[12px]"
            style={{ animationDelay: `${index * 0.4}s` }}
            aria-label={link.platform}
          >
            <IconComponent className="w-[18px] h-[18px]" />
          </a>
        );
      })}
    </div>
  );
}
