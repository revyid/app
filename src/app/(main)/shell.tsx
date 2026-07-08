'use client';

import { useState, useCallback, useEffect } from 'react';
import { Providers } from '@/app/providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { WelcomePreloader } from '@/components/shared/WelcomePreloader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { PageTransition } from '@/components/shared/PageTransition';
import { CommandPalette } from '@/components/command/CommandPalette';
import { ShortcutHelp } from '@/components/shared/ShortcutHelp';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { UserProfilePopup } from '@/components/profile/UserProfilePopup';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { CustomLogin } from '@/components/auth/CustomLogin';
import { useKeyboardShortcuts, defaultShortcuts } from '@/lib/keyboard-shortcuts';
import { useTheme } from '@/contexts/ThemeContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { trackEvent } from '@/lib/auth';
import { ProfileHeader } from '@/components/sections/ProfileHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { SocialLinks } from '@/components/sections/SocialLinks';
import { LanguagesSection } from '@/components/sections/LanguagesSection';
import { createPortal } from 'react-dom';

function HomeSidebarContent() {
  return (
    <>
      <ProfileHeader />
      <div className="h-px bg-outline/20" />
      <AboutSection />
      <div className="h-px bg-outline/20" />
      <LanguagesSection />
      <div className="h-px bg-outline/20" />
      <SocialLinks />
      <div className="mt-auto pt-3 border-t border-outline/15 space-y-3">
        <p className="text-label-sm text-muted-foreground/60 text-center">
          Built with{' '}
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">React</a>
          {' & '}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Next.js</a>
        </p>
        <div className="flex items-center justify-center gap-4 text-label-sm">
          <a href="#projects" className="text-muted-foreground hover:text-primary transition-colors font-medium">Explore Work</a>
          <span className="w-1 h-1 rounded-full bg-outline/40" />
          <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors font-medium">Work With Me</a>
        </div>
        <p className="text-label-sm text-muted-foreground/40 text-center">
          © 2026 Portfolio by revyid
        </p>
      </div>
    </>
  );
}

/** Sidebar sections for mobile (shown at top of page) */
export function MobileSidebarSections() {
  return (
    <div className="lg:hidden space-y-4 mb-6">
      <ProfileHeader />
      <div className="h-px bg-outline/20" />
      <AboutSection />
      <div className="h-px bg-outline/20" />
      <LanguagesSection />
      <div className="h-px bg-outline/20" />
      <SocialLinks />
    </div>
  );
}

function PopupPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isLoading } = usePortfolio();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    trackEvent('page_view', { page: window.location.pathname }, navigator.userAgent, undefined, document.referrer);
  }, []);

  useKeyboardShortcuts([
    { ...defaultShortcuts.find(s => s.id === 'command-palette')!, action: () => setIsCommandPaletteOpen(true) },
    { ...defaultShortcuts.find(s => s.id === 'theme-switcher')!, action: () => {} },
    { ...defaultShortcuts.find(s => s.id === 'dark-mode-toggle')!, action: toggleTheme },
    { ...defaultShortcuts.find(s => s.id === 'shortcut-help')!, action: () => setIsShortcutHelpOpen(true) },
  ], [toggleTheme]);

  return (
    <>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-clip">
        {isLoading && (
          <WelcomePreloader isDataReady={!isLoading} onComplete={() => {}} />
        )}

        <div className="flex min-h-screen">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:text-label-lg">
            Skip to content
          </a>

          {/* Desktop sidebar only */}
          <div className="hidden lg:block">
            <Sidebar showMobile={false}>
              <HomeSidebarContent />
            </Sidebar>
          </div>

          <main id="main-content" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <ErrorBoundary>
              <PageTransition>{children}</PageTransition>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {isCommandPaletteOpen && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onLoginClick={() => setIsCommandPaletteOpen(false)}
          onProfileClick={() => setIsProfileOpen(false)}
          onChatClick={() => setIsChatOpen(true)}
        />
      )}
      <ShortcutHelp isOpen={isShortcutHelpOpen} onClose={() => setIsShortcutHelpOpen(false)} />

      <PopupPortal>
        <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onLoginRequest={() => { setIsChatOpen(false); setIsLoginOpen(true); }} />
        <UserProfilePopup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onLoginRequest={() => { setIsProfileOpen(false); setIsLoginOpen(true); }} />
        <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <CustomLogin isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </PopupPortal>
    </>
  );
}

export function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ShellInner>{children}</ShellInner>
    </Providers>
  );
}
