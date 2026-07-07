'use client';

import { useState, useCallback, useEffect } from 'react';
import { Providers } from '@/app/providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { WelcomePreloader } from '@/components/shared/WelcomePreloader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { CommandPalette } from '@/components/command/CommandPalette';
import { ShortcutHelp } from '@/components/shared/ShortcutHelp';
import { useKeyboardShortcuts, defaultShortcuts } from '@/lib/keyboard-shortcuts';
import { useTheme } from '@/contexts/ThemeContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { trackEvent } from '@/lib/auth';

function ShellInner({ children }: { children: React.ReactNode }) {
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [nawaMode, setNawaMode] = useState(false);
  const { isLoading } = usePortfolio();

  const { toggleTheme } = useTheme();

  const toggleNawa = useCallback(() => {
    setNawaMode(prev => !prev);
    document.body.classList.toggle('nawa-mode');
  }, []);

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
      <div className={`min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-clip ${nawaMode ? 'nawa-mode' : ''}`}>
        {isLoading && (
          <WelcomePreloader
            isDataReady={!isLoading}
            onComplete={() => setIsPreloaderDone(true)}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-80 lg:pr-8 py-8 lg:py-12 pb-24">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:text-label-lg">
            Skip to content
          </a>
          <Sidebar ready={!isLoading} />
          <main id="main-content">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>

        <div className="lg:hidden text-center space-y-2 py-8 pb-24 border-t border-outline/20 mx-4">
          <p className="text-label-sm text-muted-foreground/50">Built with React & Next.js</p>
          <div className="flex items-center justify-center gap-3 text-label-sm">
            <a href="#projects" className="text-muted-foreground hover:text-primary transition-colors">Explore Work</a>
            <span className="w-1 h-1 rounded-full bg-outline/40" />
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Work With Me</a>
          </div>
          <p className="text-label-sm text-muted-foreground/50">&copy; 2026 revyid</p>
        </div>
      </div>

      {isCommandPaletteOpen && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onLoginClick={() => setIsCommandPaletteOpen(false)}
          onProfileClick={() => setIsCommandPaletteOpen(false)}
          onChatClick={() => {}}
        />
      )}
      <ShortcutHelp isOpen={isShortcutHelpOpen} onClose={() => setIsShortcutHelpOpen(false)} />
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
