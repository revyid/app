import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Home, 
  Briefcase, 
  GraduationCap, 
  MessageCircle, 
  User, 
  LogOut,
  Command,
  X,
  ArrowRight,
  Palette
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { bottomSheetContent, modalBackdrop } from '@/lib/motion-presets';
import { IconButton } from '@/components/ui/button';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  onProfileClick: () => void;
  onChatClick?: () => void;
}

export function CommandPalette({ isOpen, onClose, onLoginClick, onProfileClick, onChatClick }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isSignedIn = !!user;
  const inputRef = useRef<HTMLInputElement>(null);

  const fullName = user?.display_name || user?.email || 'Anonymous';

  // Command items
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'home',
      title: 'Go to Home',
      description: 'Navigate to the home section',
      icon: Home,
      shortcut: 'Ctrl+Alt+H',
      category: 'Navigation',
      action: () => {
        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
      },
    },
    {
      id: 'projects',
      title: 'View Projects',
      description: 'See all my projects',
      icon: Briefcase,
      shortcut: 'Ctrl+Alt+P',
      category: 'Navigation',
      action: () => {
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
      },
    },
    {
      id: 'education',
      title: 'View Education',
      description: 'Check my educational background',
      icon: GraduationCap,
      shortcut: 'Ctrl+Alt+E',
      category: 'Navigation',
      action: () => {
        document.getElementById('education')?.scrollIntoView({ behavior: 'smooth' });
        onClose();
      },
    },
    // Actions
    {
      id: 'chat',
      title: 'Open Chat',
      description: 'Open the global chat',
      icon: MessageCircle,
      shortcut: 'Ctrl+Alt+C',
      category: 'Actions',
      action: () => {
        onClose();
        onChatClick?.();
      },
    },
    {
      id: 'theme-toggle',
      title: 'Toggle Theme',
      description: theme === 'light' ? 'Currently: Light → Dark' : theme === 'dark' ? 'Currently: Dark → System' : 'Currently: System → Light',
      icon: Palette,
      shortcut: 'Ctrl+Alt+D',
      category: 'Preferences',
      action: () => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(next);
        onClose();
      },
    },
    // Account
    ...(isSignedIn ? [
      {
        id: 'profile',
        title: 'View Profile',
        description: fullName || 'Your profile',
        icon: User,
        shortcut: 'Ctrl+Alt+U',
        category: 'Account',
        action: () => {
          onClose();
          onProfileClick();
        },
      },
      {
        id: 'logout',
        title: 'Sign Out',
        description: 'Sign out of your account',
        icon: LogOut,
        category: 'Account',
        action: async () => {
          await signOut();
          onClose();
        },
      },
    ] : [
      {
        id: 'login',
        title: 'Sign In',
        description: 'Sign in to your account',
        icon: User,
        shortcut: 'Ctrl+Alt+U',
        category: 'Account',
        action: () => {
          onClose();
          onLoginClick();
        },
      },
    ]),
  ], [theme, isSignedIn, user, onClose, onLoginClick, onProfileClick, onChatClick, setTheme, signOut]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const query = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
    );
  }, [search, commands]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Ctrl+Alt shortcuts fire the matching command directly
      if (e.ctrlKey && e.altKey) {
        const map: Record<string, string> = {
          h: 'home', p: 'projects', e: 'education',
          c: 'chat', d: 'theme-toggle', u: isSignedIn ? 'profile' : 'login',
        };
        const cmd = commands.find(c => c.id === map[e.key.toLowerCase()]);
        if (cmd) { e.preventDefault(); cmd.action(); return; }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          Math.min(prev + 1, filteredCommands.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Bottom Sheet Command Palette */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:w-full sm:max-w-xl z-50"
          >
            <div className="rounded-t-[28px] sm:rounded-[28px] overflow-hidden bg-surface border border-outline/20 shadow-elevation-5 noise-grain">
              {/* Drag Handle */}
              <div className="pt-3 pb-0">
                <div className="sheet-handle" />
              </div>

              {/* Search Header */}
              <div className="flex items-center gap-3 px-3 py-3 border-b border-outline/20">
                <div className="flex-1 relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search commands..."
                    className="w-full input-filled text-body-lg"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                <IconButton
                  onClick={onClose}
                  variant="ghost"
                  className="rounded-lg text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
                {filteredCommands.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-variant flex items-center justify-center">
                      <Command className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-body-md text-muted-foreground">
                      No commands found
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, items]) => (
                    <div key={category} className="mb-2">
                      <div className="px-3 py-2 text-label-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isSelected = globalIndex === selectedIndex;
                        const currentIndex = globalIndex++;

                        return (
                          <button
                            key={item.id}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors duration-100 ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-surface-variant text-foreground'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary-foreground/20'
                                : 'bg-surface-variant'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-body-md truncate">
                                {item.title}
                              </div>
                              {item.description && (
                                <div className={`text-body-sm truncate ${
                                  isSelected
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.shortcut && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-label-sm ${
                                isSelected
                                  ? 'bg-primary-foreground/20'
                                  : 'bg-surface-variant text-muted-foreground'
                              }`}>
                                {item.shortcut}
                              </div>
                            )}
                            {isSelected && (
                              <ArrowRight className="w-4 h-4" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-outline/20 bg-surface-variant/30">
                <div className="flex items-center gap-4 text-label-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-variant border border-outline/40">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-variant border border-outline/40">
                      ↓
                    </kbd>
                    <span>navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-variant border border-outline/40">
                      ↵
                    </kbd>
                    <span>select</span>
                  </div>
                </div>
                <div className="text-label-sm text-muted-foreground">
                  {filteredCommands.length} commands
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
