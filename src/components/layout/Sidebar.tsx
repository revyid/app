'use client';

import { useState, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
  children: ReactNode;
  showFooter?: boolean;
  onChatClick?: () => void;
  onProfileClick?: () => void;
  onAdminClick?: () => void;
}

function SidebarFooter({ onChatClick, onProfileClick, onAdminClick }: { onChatClick?: () => void; onProfileClick?: () => void; onAdminClick?: () => void }) {
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  const isDark = effectiveTheme === 'dark';

  const { ref, toggleSwitchTheme } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
    isDarkMode: isDark,
    onDarkModeChange: () => {},
  });

  return (
    <div className="mt-auto pt-3 border-t border-outline/15">
      <div className="flex items-center justify-center gap-1">
        <button onClick={onChatClick} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-variant/50 transition-colors" aria-label="Chat">
          <MessageCircle className="w-[18px] h-[18px]" />
        </button>
        <button ref={ref} onClick={toggleSwitchTheme} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-variant/50 transition-colors" aria-label="Toggle theme">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isDark ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /> : (
              <>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </>
            )}
          </svg>
        </button>
        {user?.is_admin && (
          <button onClick={onAdminClick} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-variant/50 transition-colors" aria-label="Admin">
            <Shield className="w-[18px] h-[18px]" />
          </button>
        )}
        <button onClick={onProfileClick} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-variant/50 transition-colors overflow-hidden" aria-label="Profile">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}

const sidebarVariants = {
  initial: { opacity: 0, x: -12, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 12, filter: 'blur(4px)' },
};

export function Sidebar({ children, showFooter = false, onChatClick, onProfileClick, onAdminClick }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-8 top-4 bottom-4 w-72 z-10">
        <div className="h-full flex items-center">
          <div className="squircle-card bg-surface border border-outline/20 p-4 space-y-2.5 noise-grain shadow-fluid w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                variants={sidebarVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="space-y-2.5 flex-1 flex flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
            {showFooter && <SidebarFooter onChatClick={onChatClick} onProfileClick={onProfileClick} onAdminClick={onAdminClick} />}
          </div>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-80 flex-shrink-0" />

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-full bg-surface border border-outline/20 shadow-elevation-2 active:scale-95 transition-transform"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 bg-surface border-r border-outline/20 overflow-y-auto"
            >
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-title-sm font-semibold text-foreground">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors" aria-label="Close menu">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    variants={sidebarVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="space-y-2.5"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
                {showFooter && <SidebarFooter onChatClick={onChatClick} onProfileClick={onProfileClick} onAdminClick={onAdminClick} />}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
