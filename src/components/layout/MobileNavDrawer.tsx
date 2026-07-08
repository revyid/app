'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Home, LayoutDashboard, Key, FileText, Globe, Link2, Code as CodeIcon, PlayCircle, BookOpen } from 'lucide-react';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, MessageCircle, User } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: NavItem[];
}

function TreeItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    // auto-open if current path is under this item
    return item.href === '/' ? false : pathname.startsWith(item.href);
  });
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const isActive = pathname === item.href || (item.href !== '/' && pathname === item.href);

  return (
    <div>
      <div className="flex items-center gap-0.5">
        {hasChildren ? (
          <button
            onClick={() => setOpen(o => !o)}
            className="p-1 rounded hover:bg-surface-variant/40 transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-3 h-3 text-muted-foreground/50 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}
        <Link
          href={item.href}
          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'
          }`}
          style={{ paddingLeft: depth > 0 ? `${8 + depth * 4}px` : undefined }}
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          {item.label}
        </Link>
      </div>
      <AnimatePresence initial={false}>
        {hasChildren && open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="ml-3 border-l border-outline/10 pl-2 mt-0.5 overflow-hidden"
          >
            {item.children!.map(child => (
              <TreeItem key={child.href} item={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MobileNavDrawerProps {
  nav?: NavItem[];
  showNav?: boolean;
  onChatClick?: () => void;
  onProfileClick?: () => void;
  onAdminClick?: () => void;
}

export function MobileNavDrawer({ nav = [], showNav = true, onChatClick, onProfileClick, onAdminClick }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);
  const { effectiveTheme, setTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const { user } = useAuth();

  const { ref, toggleSwitchTheme } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
    isDarkMode: isDark,
    onDarkModeChange: (dark: boolean) => {
      setTheme(dark ? 'dark' : 'light');
    },
  });

  return (
    <>
      {/* Floating pill trigger — mobile only */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <div className="flex items-center gap-1 px-2 py-2 bg-surface rounded-full shadow-elevation-4 border border-outline/30">
          {/* Tree toggle — only show if nav enabled */}
          {showNav && (
            <>
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary-container text-secondary-container-foreground text-label-sm font-medium"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <path d="M1 1h4v4H1V1zm0 9h4v4H1v-4zm5-4.5h8M6 3h8M6 12h8M3 5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Menu
              </button>
              <div className="w-px h-6 bg-outline/20" />
            </>
          )}

          {/* Theme toggle */}
          <button ref={ref} onClick={toggleSwitchTheme} aria-label="Toggle theme"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-variant transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          {user?.is_admin && onAdminClick && (
            <button onClick={onAdminClick} aria-label="Admin"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-variant transition-colors text-primary flex-shrink-0">
              <Shield className="w-[17px] h-[17px]" />
            </button>
          )}

          {onChatClick && (
            <button onClick={onChatClick} aria-label="Chat"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-variant transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
              <MessageCircle className="w-[17px] h-[17px]" />
            </button>
          )}

          {/* Profile */}
          <button onClick={onProfileClick} aria-label="Profile"
            className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all flex-shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-variant text-muted-foreground">
                <User className="w-[17px] h-[17px]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl border-t border-outline/20 shadow-elevation-4 max-h-[70vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-outline/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
                <span className="text-title-sm font-semibold text-foreground">Navigation</span>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Tree nav */}
              <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-0.5">
                {nav.map(item => (
                  <TreeItem key={item.href} item={item} />
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
