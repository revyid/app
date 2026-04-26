import { useState, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { FloatingNavbar } from '@/components/navbar/FloatingNavbar';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { CustomLogin } from '@/components/auth/CustomLogin';
import { CommandPalette } from '@/components/command/CommandPalette';
import { WelcomePreloader } from '@/components/shared/WelcomePreloader';
import { UserProfilePopup } from '@/components/profile/UserProfilePopup';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { ShortcutHelp } from '@/components/shared/ShortcutHelp';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { NotFound } from '@/pages/NotFound';
import { useKeyboardShortcuts, defaultShortcuts } from '@/lib/keyboard-shortcuts';
import { useTheme } from '@/contexts/ThemeContext';
import { trackEvent } from '@/lib/auth';

// Known routes — anything else renders 404
const KNOWN_ROUTES = ['/'];

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);

  // Track page view on mount
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const userAgent = navigator.userAgent;
        const referrer = document.referrer || 'direct';

        // Get real visitor IP
        let ipAddress = 'unknown';
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const json = await res.json();
          ipAddress = json.ip || 'unknown';
        } catch {
          // fallback: leave as 'unknown'
        }

        await trackEvent('page_view', {
          page: window.location.pathname,
          referrer: referrer,
          timestamp: new Date().toISOString()
        }, userAgent, ipAddress, referrer);
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, []);
  const { toggleTheme } = useTheme();

  // Set up keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...defaultShortcuts.find(s => s.id === 'command-palette')!,
      action: () => setIsCommandPaletteOpen(true)
    },
    {
      ...defaultShortcuts.find(s => s.id === 'theme-switcher')!,
      action: () => {
        console.log('Open theme selector');
      }
    },
    {
      ...defaultShortcuts.find(s => s.id === 'dark-mode-toggle')!,
      action: toggleTheme
    },
    {
      ...defaultShortcuts.find(s => s.id === 'projects')!,
      action: () => {
        const element = document.getElementById('projects');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
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
      action: () => {
        setIsChatOpen(false);
        setIsLoginOpen(false);
        setIsCommandPaletteOpen(false);
        setIsProfileOpen(false);
        setIsAdminOpen(false);
        setIsShortcutHelpOpen(false);
      }
    }
  ], [toggleTheme]);

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-clip">
        <AnimatePresence mode="wait">
          {isLoading && (
            <WelcomePreloader onComplete={() => setIsLoading(false)} />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24" style={{ '--container-padding': '1rem' } as React.CSSProperties}>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
            <Sidebar ready={!isLoading} />
            <MainContent ready={!isLoading} />
          </div>
        </div>

        {/* Floating Navbar */}
        <FloatingNavbar 
          onChatClick={() => setIsChatOpen(true)}
          onCommandPaletteClick={() => setIsCommandPaletteOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
          onAdminClick={() => setIsAdminOpen(true)}
        />

        {/* Modals */}
        <ChatPopup 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          onLoginRequest={() => setIsLoginOpen(true)}
        />
        
        <CustomLogin 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
        />
        
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onLoginClick={() => {
            setIsCommandPaletteOpen(false);
            setIsLoginOpen(true);
          }}
          onProfileClick={() => {
            setIsCommandPaletteOpen(false);
            setIsProfileOpen(true);
          }}
          onChatClick={() => setIsChatOpen(true)}
        />

        <UserProfilePopup 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onLoginRequest={() => {
            setIsProfileOpen(false);
            setIsLoginOpen(true);
          }}
        />

        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />

        <ShortcutHelp
          isOpen={isShortcutHelpOpen}
          onClose={() => setIsShortcutHelpOpen(false)}
        />
      </div>
    </LayoutGroup>
  );
}

function App() {
  const pathname = window.location.pathname;
  if (!KNOWN_ROUTES.includes(pathname)) {
    return (
      <ThemeProvider>
        <NotFound />
      </ThemeProvider>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <PortfolioProvider>
          <AppContent />
        </PortfolioProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
