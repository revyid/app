'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  User,
  Shield,
  LayoutDashboard,
  Key,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { floatingNavbar } from '@/lib/motion-presets';
import { getSiteSetting } from '@/lib/auth';

interface FloatingNavbarProps {
  onChatClick: () => void;
  onProfileClick: () => void;
  onAdminClick?: () => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home', href: '/' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { id: 'api-keys', icon: Key, label: 'API Keys', href: '/dashboard/api-keys' },
  { id: 'docs', icon: FileText, label: 'Docs', href: '/docs' },
];

export const FloatingNavbar = memo(function FloatingNavbar({
  onChatClick,
  onProfileClick,
  onAdminClick,
}: FloatingNavbarProps) {
  const { effectiveTheme, setTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const { ref, toggleSwitchTheme } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
    isDarkMode: isDark,
    onDarkModeChange: (dark: boolean) => {
      setTheme(dark ? 'dark' : 'light');
    },
  });

  const { user } = useAuth();
  const isSignedIn = !!user;
  const pathname = usePathname();
  const router = useRouter();

  const activeItem = useMemo(() => {
    if (pathname === '/') return 'home';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/dashboard/api-keys') return 'api-keys';
    if (pathname === '/docs' || pathname.startsWith('/docs/')) return 'docs';
    return 'home';
  }, [pathname]);

  const scrollToSection = useCallback((sectionId: string) => {
    const item = navItems.find(i => i.id === sectionId);
    if (item) router.push(item.href);
  }, [router]);

  // ponytail: CSS class toggle avoids re-render on every scroll tick
  const pillRef = useRef<HTMLDivElement>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    const h = () => {
      pillRef.current?.classList.toggle('navbar-scrolled', window.scrollY > 100);
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    getSiteSetting('site_logo').then(l => { if (l) setSiteLogo(l); }).catch(() => {});
  }, []);

  return (
    <motion.nav
      variants={floatingNavbar}
      initial="hidden"
      animate="visible"
      className="fixed bottom-6 left-4 right-4 lg:left-auto lg:right-8 z-40 flex justify-center lg:justify-end w-auto pointer-events-none"
    >
      <div className="pointer-events-auto px-1 py-2">
        <LayoutGroup id="nav-pill">
          <div
            ref={pillRef}
            className="navbar-pill flex items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 py-1.5 sm:px-2 sm:py-2 bg-surface rounded-full shadow-elevation-4 border border-outline/30 w-max"
          >
            {/* Nav Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  aria-label={item.label}
                  className={`nav-item relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-full z-10 cursor-pointer text-sm sm:text-base active:scale-95 ${
                    isActive ? 'text-secondary-container-foreground font-medium' : 'text-muted-foreground hover:text-foreground transition-colors duration-150'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-secondary-container -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className={`text-label-sm font-medium whitespace-nowrap overflow-hidden hidden sm:inline transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${isActive ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

          {/* Divider */}
          <div className="w-px h-6 sm:h-7 bg-outline/30 mx-0.5" />

          {/* Admin */}
          {user?.is_admin && onAdminClick && (
            <button onClick={onAdminClick} aria-label="Admin"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-surface-variant transition-colors duration-150 flex-shrink-0 text-primary">
              <Shield className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Chat */}
          <button onClick={onChatClick} aria-label="Chat"
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-surface-variant transition-colors duration-150 flex-shrink-0 text-muted-foreground hover:text-foreground">
            <MessageCircle className="w-[18px] h-[18px]" />
          </button>

          {/* Theme Toggle */}
          <button ref={ref} onClick={toggleSwitchTheme} aria-label="Toggle theme"
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-surface-variant transition-colors duration-150 flex-shrink-0 text-muted-foreground hover:text-foreground">
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

          {/* Profile Avatar */}
          <button onClick={onProfileClick} aria-label="Profile"
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-150 flex-shrink-0 ml-0.5">
            {isSignedIn && user ? (
              <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.email || 'U')}&background=random`}
                alt={user.display_name || 'User'} referrerPolicy="no-referrer"
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-variant text-muted-foreground">
                <User className="w-[18px] h-[18px]" />
              </div>
            )}
          </button>
        </div>
        </LayoutGroup>
      </div>
    </motion.nav>
  );
});
