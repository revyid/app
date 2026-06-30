import { ProfileHeader } from '@/components/sections/ProfileHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { LanguagesSection } from '@/components/sections/LanguagesSection';
import { SocialLinks } from '@/components/sections/SocialLinks';

interface SidebarProps {
  ready?: boolean;
}

export function Sidebar(_props: SidebarProps) {
  return (
    <aside className="w-full lg:w-72 lg:sticky lg:top-8 h-[fit-content]">
      <div className="hidden lg:block">
        <div className="squircle-card bg-surface border border-outline/20 p-5 space-y-3 noise-grain shadow-fluid max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-thin">
          <ProfileHeader />
          <div className="h-px bg-outline/20" />
          <AboutSection />
          <div className="h-px bg-outline/20" />
          <LanguagesSection />
          <div className="h-px bg-outline/20" />
          <SocialLinks />
        </div>
      </div>

      <div className="lg:hidden space-y-4">
        <ProfileHeader />
        <AboutSection />
        <LanguagesSection />
        <SocialLinks />
      </div>
    </aside>
  );
}
