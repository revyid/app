import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Briefcase,
  MessageCircle,
  Command,
  User,
  Shield,
  Mail,
  Layers,
} from 'lucide-react';
import { ThemeToggleIcon } from '@/components/ui/theme-toggle-icon';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { floatingNavbar, SPRING_SNAPPY, SPRING_BOUNCY, SPRING_DEFAULT } from '@/lib/motion-presets';
import { IconButton } from '@/components/ui/button';
import { getSiteSetting } from '@/lib/auth';
import { useActiveSection } from '@/contexts/ActiveSectionContext';

interface FloatingNavbarProps {
  onChatClick: () => void;
  onCommandPaletteClick: () => void;
  onProfileClick: () => void;
  onAdminClick?: () => void;
  unreadCount?: number;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'about', icon: User, label: 'About' },
  { id: 'projects', icon: Layers, label: 'Works', sections: ['projects', 'testimonials'] },
  { id: 'experience', icon: Briefcase, label: 'Resume', sections: ['experience', 'education'] },
  { id: 'contact', icon: Mail, label: 'Contact' },
];

export function FloatingNavbar({
  onChatClick,
  onCommandPaletteClick,
  onProfileClick,
  onAdminClick,
  unreadCount = 0
}: FloatingNavbarProps) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isSignedIn = !!user;
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSection } = useActiveSection();

  // Use scroll spy section when available, otherwise default to 'home'
  const activeItem = useMemo(() => {
    if (!activeSection) return 'home';
    const item = navItems.find(item => 
      item.id === activeSection || (item.sections && item.sections.includes(activeSection))
    );
    return item ? item.id : 'home';
  }, [activeSection]);

  // Smooth scroll to section, or navigate home first if on 404
  const scrollToSection = useCallback((sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        if (sectionId === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.pathname, navigate]);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Load site logo
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const logo = await getSiteSetting('site_logo');
        if (logo) {
          setSiteLogo(logo);
        }
      } catch (error) {
        console.error('Failed to load site logo:', error);
      }
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
          animate={{
            scale: isScrolled && !isHovered ? 0.92 : 1,
          }}
          transition={SPRING_SNAPPY}
          className="flex items-center justify-center gap-0.5 sm:gap-2 px-1.5 py-1.5 sm:px-2.5 sm:py-2.5 bg-surface/92 dark:bg-surface/92 backdrop-blur-[24px] rounded-full shadow-elevation-4 border border-outline/30 w-max"
        >
          {/* Navigation Items */}
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
              >
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`relative flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-full transition-colors duration-150 z-10 cursor-pointer text-sm sm:text-base ${
                    isActive
                      ? 'text-secondary-container-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isHome ? (
                    siteLogo ? (
                      <motion.img
                        layoutId="logo"
                        src={siteLogo}
                        alt="Site Logo"
                        className="w-5 h-5 rounded-md object-cover shadow-sm ring-1 ring-border/20"
                      />
                    ) : (
                      <motion.div
                        layoutId="logo"
                        className="w-5 h-5 bg-surface text-foreground font-bold rounded-md flex items-center justify-center text-[10px] shadow-sm ring-1 ring-border/20"
                      >
                        R
                      </motion.div>
                    )
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {/* Only show labels on sm+ screens when hovered or active */}
                  <AnimatePresence mode="wait">
                    {(isActive || isHovered) && (
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
                    <motion.div
                      layoutId="navActiveIndicator"
                      className="absolute inset-0 rounded-full bg-secondary-container -z-10"
                      transition={SPRING_SNAPPY}
                    />
                  )}
                </button>
              </motion.div>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 sm:h-8 bg-outline/40 mx-0.5 sm:mx-1" />

          {/* Command Palette Button */}
          <IconButton
            onClick={onCommandPaletteClick}
            variant="ghost"
            title="Command Palette (Ctrl+K)"
            className="flex-shrink-0"
          >
            <Command className="w-5 h-5" />
          </IconButton>

          {/* Chat Button */}
          <div className="relative flex-shrink-0">
            <IconButton
              onClick={onChatClick}
              variant="ghost"
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
            </IconButton>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={SPRING_BOUNCY}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-tertiary text-tertiary-foreground text-label-sm font-bold rounded-full flex items-center justify-center pointer-events-none z-10"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <IconButton
            onClick={toggleTheme}
            variant="ghost"
            aria-label="Toggle theme"
            className="flex-shrink-0"
          >
            <ThemeToggleIcon theme={effectiveTheme} />
          </IconButton>

          {/* Admin Button — only for admins */}
          {user?.is_admin && onAdminClick && (
            <IconButton
              onClick={onAdminClick}
              variant="ghost"
              aria-label="Admin Panel"
              title="Admin Panel"
              className="flex-shrink-0 text-primary"
            >
              <Shield className="w-5 h-5" />
            </IconButton>
          )}

          {/* User Avatar / Login */}
          <button
            onClick={onProfileClick}
            className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-150 flex-shrink-0 ml-1"
          >
            {isSignedIn && user ? (
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.email || 'U')}&background=random`}
                alt={user.display_name || 'User'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.email || 'U')}&background=random`;
                }}
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
    </motion.nav>
  );
}
