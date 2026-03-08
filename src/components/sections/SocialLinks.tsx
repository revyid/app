import { motion } from 'framer-motion';
import { Twitter, AtSign, Instagram, Linkedin, Github, Youtube } from 'lucide-react';
import { socialLinks } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

/**
 * M3 Social Links — Icon Button Row
 * Features:
 * - M3 icon button styling (surface-variant bg, squircle→circle on hover)
 * - Smooth CSS idle float animation (staggered via animation-delay)
 * - Shape morphing on tap
 */

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Twitter,
  AtSign,
  Instagram,
  Linkedin,
  Github,
  Youtube,
};

export function SocialLinks() {
  return (
    <motion.div variants={itemVariants} className="flex items-center gap-3">
      {socialLinks.map((link, index) => {
        const IconComponent = iconMap[link.icon] || Twitter;
        return (
          <motion.a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ 
              scale: 1.15, 
              borderRadius: '50%',
              y: -2,
            }}
            whileTap={{ 
              scale: 0.9, 
              borderRadius: '50%',
            }}
            transition={SPRING_BOUNCY}
            className="w-10 h-10 flex items-center justify-center bg-surface-variant/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 border border-outline/10 idle-float"
            style={{ 
              borderRadius: '12px',
              animationDelay: `${index * 0.4}s`,
            }}
            aria-label={link.platform}
          >
            <IconComponent className="w-[18px] h-[18px]" />
          </motion.a>
        );
      })}
    </motion.div>
  );
}
