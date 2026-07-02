import { ProfileHeader } from '@/components/sections/ProfileHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { LanguagesSection } from '@/components/sections/LanguagesSection';
import { SocialLinks } from '@/components/sections/SocialLinks';

interface SidebarProps {
  ready?: boolean;
}

export function Sidebar(_props: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — fixed left */}
      <aside className="hidden lg:block fixed left-8 top-0 h-screen w-72 z-10">
        <div className="h-full flex items-center">
          <div className="squircle-card bg-surface border border-outline/20 p-5 space-y-3 noise-grain shadow-fluid w-full max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-thin">
            <ProfileHeader />
            <div className="h-px bg-outline/20" />
            <AboutSection />
            <div className="h-px bg-outline/20" />
            <LanguagesSection />
            <div className="h-px bg-outline/20" />
            <SocialLinks />
            <div className="h-px bg-outline/20" />
            <div className="text-center space-y-2 pt-2 pb-1">
              <p className="text-label-sm text-muted-foreground/50">
                Built with React & Next.js
              </p>
              <div className="flex items-center justify-center gap-3 text-label-sm">
                <a href="#projects" className="text-muted-foreground hover:text-primary transition-colors">Explore Work</a>
                <span className="w-1 h-1 rounded-full bg-outline/40" />
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Work With Me</a>
              </div>
              <p className="text-label-sm text-muted-foreground/50">
                © 2026 revyid
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-80 flex-shrink-0" />

      {/* Mobile layout */}
      <div className="lg:hidden space-y-4">
        <ProfileHeader />
        <AboutSection />
        <LanguagesSection />
        <SocialLinks />
      </div>
    </>
  );
}
