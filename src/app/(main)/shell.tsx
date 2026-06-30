'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGroup } from 'framer-motion';
import { Providers } from '@/app/providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { FloatingNavbar } from '@/components/navbar/FloatingNavbar';
import { WelcomePreloader } from '@/components/shared/WelcomePreloader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { CommandPalette } from '@/components/command/CommandPalette';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { UserProfilePopup } from '@/components/profile/UserProfilePopup';
import { ShortcutHelp } from '@/components/shared/ShortcutHelp';
import { CustomLogin } from '@/components/auth/CustomLogin';
import { useKeyboardShortcuts, defaultShortcuts } from '@/lib/keyboard-shortcuts';
import { useTheme } from '@/contexts/ThemeContext';
import { trackEvent } from '@/lib/auth';

function PopupPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [nawaMode, setNawaMode] = useState(false);

  const { toggleTheme } = useTheme();

  // Easter egg: Ctrl+Alt+L toggles Nawa mode
  const toggleNawa = useCallback(() => {
    setNawaMode(prev => !prev);
    document.body.classList.toggle('nawa-mode');
  }, []);

  // Device detection console log
  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth > 768);
    const isDesktop = !isMobile && !isTablet;

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('CrOS')) os = 'Chrome OS';

    let browser = 'Unknown';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
    else if (ua.includes('Chrome') && !ua.includes('Edg/')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';
    const screenRes = `${screen.width}x${screen.height}`;
    const viewport = `${window.innerWidth}x${window.innerHeight}`;
    const touch = navigator.maxTouchPoints;
    const lang = navigator.language;
    const cores = navigator.hardwareConcurrency;
    const memory = (navigator as any).deviceMemory;
    const connection = (navigator as any).connection?.effectiveType || 'N/A';

    console.log(
      `%c📱 Device Info`,
      'color: #22c55e; font-size: 16px; font-weight: bold;'
    );
    console.log(
      `%c┌─────────────────────────────────┐\n` +
      `│  Type:    ${deviceType.padEnd(21)}│\n` +
      `│  OS:      ${os.padEnd(21)}│\n` +
      `│  Browser: ${browser.padEnd(21)}│\n` +
      `│  Screen:  ${screenRes.padEnd(21)}│\n` +
      `│  Viewport:${viewport.padEnd(21)}│\n` +
      `│  Touch:   ${String(touch).padEnd(21)}│\n` +
      `│  Lang:    ${lang.padEnd(21)}│\n` +
      `│  Cores:   ${String(cores ?? 'N/A').padEnd(21)}│\n` +
      `│  Memory:  ${memory ? memory + ' GB' : 'N/A'}`.padEnd(33) + `│\n` +
      `│  Net:     ${connection.padEnd(21)}│\n` +
      `└─────────────────────────────────┘`,
      'color: #888; font-family: monospace;'
    );
  }, []);

  // Block scroll when any popup is open
  const anyPopupOpen = isChatOpen || isCommandPaletteOpen || isProfileOpen || isAdminOpen || isShortcutHelpOpen || isLoginOpen;

  useEffect(() => {
    if (anyPopupOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const top = document.body.style.top;
      const scrollY = top ? Math.abs(parseInt(top)) : 0;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    }
    return () => {
      const top = document.body.style.top;
      const scrollY = top ? Math.abs(parseInt(top)) : 0;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [anyPopupOpen]);

  const closeAllModals = useCallback(() => {
    setIsChatOpen(false);
    setIsLoginOpen(false);
    setIsCommandPaletteOpen(false);
    setIsProfileOpen(false);
    setIsAdminOpen(false);
    setIsShortcutHelpOpen(false);
  }, []);

  useEffect(() => {
    trackEvent('page_view', { page: window.location.pathname }, navigator.userAgent, undefined, document.referrer);
  }, []);

  useKeyboardShortcuts([
    { ...defaultShortcuts.find(s => s.id === 'command-palette')!, action: () => setIsCommandPaletteOpen(true) },
    { ...defaultShortcuts.find(s => s.id === 'theme-switcher')!, action: () => {} },
    { ...defaultShortcuts.find(s => s.id === 'dark-mode-toggle')!, action: toggleTheme },
    { ...defaultShortcuts.find(s => s.id === 'admin-panel')!, action: () => setIsAdminOpen(true) },
    { ...defaultShortcuts.find(s => s.id === 'chat')!, action: () => setIsChatOpen(true) },
    { ...defaultShortcuts.find(s => s.id === 'shortcut-help')!, action: () => setIsShortcutHelpOpen(true) },
    { ...defaultShortcuts.find(s => s.id === 'escape')!, action: closeAllModals },
  ], [toggleTheme, closeAllModals]);

  return (
    <>
      <LayoutGroup>
        <div className={`min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-clip ${nawaMode ? 'nawa-mode' : ''}`}>
          {isLoading && <WelcomePreloader onComplete={() => setIsLoading(false)} />}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:text-label-lg">
              Skip to content
            </a>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
              <div>
                <Sidebar ready={!isLoading} />
              </div>
              <main id="main-content" className="flex-1 min-w-0">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>

          <FloatingNavbar
            onChatClick={() => setIsChatOpen(true)}
            onCommandPaletteClick={() => setIsCommandPaletteOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            onAdminClick={() => setIsAdminOpen(true)}
          />
        </div>
      </LayoutGroup>

      <PopupPortal>
        <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onLoginRequest={() => setIsLoginOpen(true)} />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onLoginClick={() => { setIsCommandPaletteOpen(false); setIsLoginOpen(true); }}
          onProfileClick={() => { setIsCommandPaletteOpen(false); setIsProfileOpen(true); }}
          onChatClick={() => setIsChatOpen(true)}
        />
        <UserProfilePopup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onLoginRequest={() => { setIsProfileOpen(false); setIsLoginOpen(true); }} />
        <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <ShortcutHelp isOpen={isShortcutHelpOpen} onClose={() => setIsShortcutHelpOpen(false)} />
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
