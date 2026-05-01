import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { ActiveSectionProvider } from '@/contexts/ActiveSectionContext';
import { FloatingNavbar } from '@/components/navbar/FloatingNavbar';
import { CustomLogin } from '@/components/auth/CustomLogin';
import { WelcomePreloader } from '@/components/shared/WelcomePreloader';
import { Sidebar } from '@/components/layout/Sidebar';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { NotFound } from '@/pages/NotFound';
import { useKeyboardShortcuts, defaultShortcuts } from '@/lib/keyboard-shortcuts';
import { useTheme } from '@/contexts/ThemeContext';

// Lazy load the single main page
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));

// Lazy load heavy modal components
const ChatPopup = lazy(() => import('@/components/chat/ChatPopup').then(m => ({ default: m.ChatPopup })));
const CommandPalette = lazy(() => import('@/components/command/CommandPalette').then(m => ({ default: m.CommandPalette })));
const AdminPanel = lazy(() => import('@/components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const UserProfilePopup = lazy(() => import('@/components/profile/UserProfilePopup').then(m => ({ default: m.UserProfilePopup })));
const ShortcutHelp = lazy(() => import('@/components/shared/ShortcutHelp').then(m => ({ default: m.ShortcutHelp })));

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();



  // Track page view via backend API — fire once, non-blocking
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'page_view',
            event_data: {
              page: location.pathname,
              timestamp: new Date().toISOString(),
            },
            referrer: document.referrer || 'direct',
          }),
        });
      } catch { /* non-critical */ }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => trackPageView(), { timeout: 3000 });
    } else {
      setTimeout(trackPageView, 2000);
    }
  }, [location.pathname]);

  const { toggleTheme } = useTheme();

  const closeAllModals = useCallback(() => {
    setIsChatOpen(false);
    setIsLoginOpen(false);
    setIsCommandPaletteOpen(false);
    setIsProfileOpen(false);
    setIsAdminOpen(false);
    setIsShortcutHelpOpen(false);
  }, []);

  // Set up keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...defaultShortcuts.find(s => s.id === 'command-palette')!,
      action: () => setIsCommandPaletteOpen(true)
    },
    {
      ...defaultShortcuts.find(s => s.id === 'theme-switcher')!,
      action: () => { console.log('Open theme selector'); }
    },
    {
      ...defaultShortcuts.find(s => s.id === 'dark-mode-toggle')!,
      action: toggleTheme
    },
    {
      ...defaultShortcuts.find(s => s.id === 'projects')!,
      action: () => navigate('/')
    },
    {
      ...defaultShortcuts.find(s => s.id === 'admin-panel')!,
      action: () => setIsAdminOpen(true)
    },
    {
      ...defaultShortcuts.find(s => s.id === 'chat')!,
      action: () => setIsChatOpen(true)
    },
    {
      ...defaultShortcuts.find(s => s.id === 'shortcut-help')!,
      action: () => setIsShortcutHelpOpen(true)
    },
    {
      ...defaultShortcuts.find(s => s.id === 'escape')!,
      action: closeAllModals
    }
  ], [toggleTheme, navigate, closeAllModals]);

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-clip">
        <AnimatePresence mode="wait">
          {isLoading && (
            <WelcomePreloader onComplete={() => setIsLoading(false)} />
          )}
        </AnimatePresence>

        {/* Persistent Layout: Sidebar + Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
            {/* Sidebar: persistent, never remounts */}
            <Sidebar ready={!isLoading} />

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <Suspense fallback={null}>
                <Routes location={location}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>

        {/* Floating Navbar */}
        <FloatingNavbar
          onChatClick={() => setIsChatOpen(true)}
          onCommandPaletteClick={() => setIsCommandPaletteOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
          onAdminClick={() => setIsAdminOpen(true)}
        />

        {/* Modals — lazy loaded */}
        <Suspense fallback={null}>
          <ChatPopup
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onLoginRequest={() => setIsLoginOpen(true)}
          />
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onLoginClick={() => { setIsCommandPaletteOpen(false); setIsLoginOpen(true); }}
            onProfileClick={() => { setIsCommandPaletteOpen(false); setIsProfileOpen(true); }}
            onChatClick={() => setIsChatOpen(true)}
          />
          <UserProfilePopup
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onLoginRequest={() => { setIsProfileOpen(false); setIsLoginOpen(true); }}
          />
          <AdminPanel
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
          />
          <ShortcutHelp
            isOpen={isShortcutHelpOpen}
            onClose={() => setIsShortcutHelpOpen(false)}
          />
        </Suspense>

        <CustomLogin
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
      </div>
    </LayoutGroup>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PortfolioProvider>
          <ActiveSectionProvider>
            <AppContent />
          </ActiveSectionProvider>
        </PortfolioProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
