'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Briefcase,
  MessageCircle,
  Command,
  User,
  Shield,
  Mail,
  Layers,
  BarChart3,
  LayoutDashboard,
  Key,
  FileText,
} from 'lucide-react';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { floatingNavbar, SPRING_SNAPPY, SPRING_BOUNCY, SPRING_DEFAULT } from '@/lib/motion-presets';
import { IconButton } from '@/components/ui/button';
import { getSiteSetting } from '@/lib/auth';
import { useActiveSection } from '@/contexts/ActiveSectionContext';
import { useLenis } from '@/components/shared/SmoothScroll';

interface FloatingNavbarProps {
  onChatClick: () => void;
  onCommandPaletteClick: () => void;
  onProfileClick: () => void;
  onAdminClick?: () => void;
  unreadCount?: number;
}

const portfolioNavItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'projects', icon: Layers, label: 'Works', sections: ['projects', 'testimonials'] },
  { id: 'stats', icon: BarChart3, label: 'Stats', sections: ['stats'] },
  { id: 'experience', icon: Briefcase, label: 'Resume', sections: ['experience', 'education'] },
  { id: 'contact', icon: Mail, label: 'Contact' },
];

const dashboardNavItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { id: 'api-keys', icon: Key, label: 'API Keys', href: '/dashboard/api-keys' },
  { id: 'docs', icon: FileText, label: 'Docs', href: '/dashboard/docs' },
];

export const FloatingNavbar = memo(function FloatingNavbar({
  onChatClick,
  onCommandPaletteClick,
  onProfileClick,
  onAdminClick,
  unreadCount = 0
}: FloatingNavbarProps) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const { ref, toggleSwitchTheme } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 750,
    isDarkMode: isDark,
    onDarkModeChange: () => {
      toggleTheme();
    },
  });

  const { user } = useAuth();
  const isSignedIn = !!user;
  const pathname = usePathname();
  const router = useRouter();
  const { activeSection } = useActiveSection();
  const lenis = useLenis();

  const isDashboard = pathname.startsWith('/dashboard');
  const navItems = isDashboard ? dashboardNavItems : portfolioNavItems;

  const activeItem = useMemo(() => {
    if (isDashboard) {
      if (pathname === '/dashboard') return 'dashboard';
      if (pathname === '/dashboard/api-keys') return 'api-keys';
      if (pathname === '/dashboard/docs') return 'docs';
      return 'dashboard';
    }
    if (!activeSection) return 'home';
    const item = portfolioNavItems.find(item =>
      item.id === activeSection || (item.sections && item.sections.includes(activeSection))
    );
    return item ? item.id : 'home';
  }, [activeSection, pathname, isDashboard]);

  const scrollToSection = useCallback((sectionId: string) => {
    if (isDashboard) {
      const item = dashboardNavItems.find(i => i.id === sectionId);
      if (item) router.push(item.href);
      return;
    }
    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        if (sectionId === 'home') {
          lenis?.scrollTo(0, { duration: 1.2 });
        } else {
          const el = document.getElementById(sectionId);
          if (el) lenis?.scrollTo(el, { duration: 1.2, offset: 80 });
        }
      }, 100);
      return;
    }
    if (sectionId === 'home') {
      lenis?.scrollTo(0, { duration: 1.2 });
    } else {
      const el = document.getElementById(sectionId);
      if (el) lenis?.scrollTo(el, { duration: 1.2, offset: 80 });
    }
  }, [pathname, router, lenis, isDashboard]);

  const [isHovered, setIsHovered] = useState(false);
  const [isSectionHovered, setIsSectionHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const logo = await getSiteSetting('site_logo');
        if (logo) setSiteLogo(logo);
      } catch { /* ignore */ }
    };
    loadLogo();
  }, []);

  return (
    <motion.nav
      variants={floatingNavbar}
      initial="hidden"
      animate="visible"
      className="fixed bottom-6 left-4 right-4 lg:left-auto lg:right-8 z-40 flex justify-center lg:justify-end w-auto pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="pointer-events-auto px-1 py-2">
        <motion.div
          layout
          animate={{ scale: isScrolled && !isSectionHovered ? 0.92 : 1 }}
          transition={SPRING_SNAPPY}
          className="flex items-center justify-center gap-0.5 sm:gap-2 px-1.5 py-1.5 sm:px-2.5 sm:py-2.5 bg-surface rounded-full shadow-elevation-4 border border-outline/30 w-max"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isHome = item.id === 'home';

            return (
              <motion.div
                key={item.id}
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex-shrink-0"
                onMouseEnter={() => setIsSectionHovered(true)}
                onMouseLeave={() => setIsSectionHovered(false)}
              >
                <button
                  onClick={() => scrollToSection(item.id)}
                  aria-label={item.label}
                  className={`relative flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-full transition-colors duration-150 z-10 cursor-pointer text-sm sm:text-base ${
                    isActive
                      ? 'text-secondary-container-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isHome && !isDashboard ? (
                    siteLogo ? (
                      <motion.img layoutId="logo" src={siteLogo} alt="Site Logo" className="w-5 h-5 rounded-md object-cover shadow-sm ring-1 ring-border/20" />
                    ) : (
                      <motion.div layoutId="logo" className="w-5 h-5 bg-surface text-foreground font-bold rounded-md flex items-center justify-center text-[10px] shadow-sm ring-1 ring-border/20">R</motion.div>
                    )
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <AnimatePresence mode="wait">
                    {(isActive || isSectionHovered) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={SPRING_DEFAULT}
                        className="text-label-sm font-medium whitespace-nowrap overflow-hidden hidden sm:inline"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div layoutId="navActiveIndicator" className="absolute inset-0 rounded-full bg-secondary-container -z-10" transition={SPRING_SNAPPY} />
                  )}
                </button>
              </motion.div>
            );
          })}

          <div className="w-px h-6 sm:h-8 bg-outline/40 mx-0.5 sm:mx-1" />

          {/* Dashboard icon — only when logged in and not on dashboard */}
          {isSignedIn && !isDashboard && (
            <IconButton onClick={() => router.push('/dashboard')} variant="ghost" aria-label="Dashboard" className="flex-shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </IconButton>
          )}

          {/* Back to Home — only on dashboard */}
          {isDashboard && (
            <IconButton onClick={() => router.push('/')} variant="ghost" aria-label="Back to Home" className="flex-shrink-0">
              <Home className="w-5 h-5" />
            </IconButton>
          )}

          <IconButton onClick={onCommandPaletteClick} variant="ghost" aria-label="Command Palette (Ctrl+K)" className="hidden sm:flex flex-shrink-0">
            <Command className="w-5 h-5" />
          </IconButton>

          <div className="relative flex-shrink-0">
            <IconButton onClick={onChatClick} variant="ghost" aria-label="Open Chat" className="relative">
              <MessageCircle className="w-5 h-5" />
            </IconButton>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  transition={SPRING_BOUNCY}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-tertiary text-tertiary-foreground text-label-sm font-bold rounded-full flex items-center justify-center pointer-events-none z-10"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            ref={ref}
            onClick={toggleSwitchTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant transition-colors duration-150 flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isDark ? (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              ) : (
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
            <IconButton onClick={onAdminClick} variant="ghost" aria-label="Admin Panel" className="flex-shrink-0 text-primary">
              <Shield className="w-5 h-5" />
            </IconButton>
          )}

          <button
            onClick={onProfileClick}
            aria-label="Open Profile"
            className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-150 flex-shrink-0 ml-1"
          >
            {isSignedIn && user ? (
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.email || 'U')}&background=random`}
                alt={user.display_name || 'User'}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.email || 'U')}&background=random`; }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-variant text-muted-foreground">
                <User className="w-5 h-5" />
              </div>
            )}
          </button>
        </motion.div>
      </div>
    </motion.nav  >
  );
});
