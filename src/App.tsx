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
import { AnimatePresence, LayoutGroup } from 'framer-motion';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setIsChatOpen(false);
        setIsLoginOpen(false);
        setIsCommandPaletteOpen(false);
        setIsProfileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <PortfolioProvider>
        <LayoutGroup>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-clip">
            <AnimatePresence mode="wait">
              {isLoading && (
                <WelcomePreloader onComplete={() => setIsLoading(false)} />
              )}
            </AnimatePresence>

          {/* Main Content — Edge-to-Edge Pixel OS Feel */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24" style={{ '--container-padding': '1rem' } as React.CSSProperties}>
            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
              <Sidebar ready={!isLoading} />
              <MainContent ready={!isLoading} />
            </div>
          </div>

          {/* Floating Pill Navigation (Bottom) */}
          <FloatingNavbar 
            onChatClick={() => setIsChatOpen(true)}
            onCommandPaletteClick={() => setIsCommandPaletteOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            onAdminClick={() => setIsAdminOpen(true)}
          />

          {/* Bottom Sheet Modals */}
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
          </div>
        </LayoutGroup>
        </PortfolioProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
