import { motion } from 'framer-motion';
import { Twitter, AtSign, Instagram, Linkedin, Github, Youtube } from 'lucide-react';
import { socialLinks } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';

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
    <motion.div variants={itemVariants} className="flex items-center gap-4">
      {socialLinks.map((link) => {
        const IconComponent = iconMap[link.icon] || Twitter;
        return (
          <motion.a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors duration-200"
            aria-label={link.platform}
          >
            <IconComponent className="w-5 h-5" />
          </motion.a>
        );
      })}
    </motion.div>
  );
}
