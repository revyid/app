import { motion } from 'framer-motion';
import { ProfileHeader } from '@/components/sections/ProfileHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { LanguagesSection } from '@/components/sections/LanguagesSection';
import { SocialLinks } from '@/components/sections/SocialLinks';
import { containerVariants } from '@/lib/animations';

interface SidebarProps {
  /** When true, animations are allowed to play (preloader finished) */
  ready?: boolean;
}

export function Sidebar({ ready = true }: SidebarProps) {
  return (
    <motion.aside
      initial="hidden"
      animate={ready ? 'visible' : 'hidden'}
      variants={containerVariants}
      className="w-full lg:w-80 lg:sticky lg:top-8 lg:self-start h-fit"
    >
      {/* 
        Desktop: squircle card with blur and scroll
        Mobile: plain sections flowing naturally (no card wrapper)
      */}

      {/* Desktop card wrapper */}
      <div className="hidden lg:block">
        <div className="squircle-card bg-surface border border-outline/20 p-6 space-y-2 noise-grain shadow-fluid max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent hover:scrollbar-thumb-outline/30">
          <ProfileHeader />
          <AboutSection />
          <ContactSection />
          <LanguagesSection />
          <div className="pt-4 pb-2">
            <SocialLinks />
          </div>
        </div>
      </div>

      {/* Mobile: sections flow naturally */}
      <div className="lg:hidden space-y-6">
        <ProfileHeader />
        <AboutSection />
        <LanguagesSection />
        <ContactSection />
        <div className="pt-2">
          <SocialLinks />
        </div>
      </div>
    </motion.aside>
  );
}
