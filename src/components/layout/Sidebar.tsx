import { motion } from 'framer-motion';
import { ProfileHeader } from '@/components/sections/ProfileHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { LanguagesSection } from '@/components/sections/LanguagesSection';
import { SocialLinks } from '@/components/sections/SocialLinks';
import { containerVariants } from '@/lib/animations';

export function Sidebar() {
  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full lg:w-80 lg:sticky lg:top-8 lg:self-start h-fit"
    >
      <div className="squircle-card bg-surface/60 dark:bg-surface/60 backdrop-blur-sm p-6 space-y-2 noise-grain shadow-fluid max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
        <ProfileHeader />
        <AboutSection />
        <ContactSection />
        <SkillsSection />
        <LanguagesSection />
        <div className="pt-4">
          <SocialLinks />
        </div>
      </div>
    </motion.aside>
  );
}
