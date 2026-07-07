'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Home, Briefcase, GraduationCap, MessageCircle,
  User, LogOut, X, ArrowRight, Palette, Mail, BarChart3, Layers,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { modalBackdrop, bottomSheetContent } from '@/lib/motion-presets';
import { BottomSheet } from '@/components/shared/BottomSheet';
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
  const { effectiveTheme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isSignedIn = !!user;
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToSection = useCallback((sectionId: string) => {
    onClose();
    requestAnimationFrame(() => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [onClose]);

  const fullName = user?.display_name || user?.email || 'Anonymous';

  const commands: CommandItem[] = useMemo(() => [
    { id: 'home', title: 'Go to Home', icon: Home, shortcut: 'Ctrl+Alt+H', category: 'Navigation', action: () => scrollToSection('home') },
    { id: 'projects', title: 'Go to Works', icon: Layers, shortcut: 'Ctrl+Alt+P', category: 'Navigation', action: () => scrollToSection('projects') },
    { id: 'experience', title: 'Go to Experience', icon: Briefcase, category: 'Navigation', action: () => scrollToSection('experience') },
    { id: 'stats', title: 'Go to Stats', icon: BarChart3, category: 'Navigation', action: () => scrollToSection('stats') },
    { id: 'education', title: 'Go to Education', icon: GraduationCap, category: 'Navigation', action: () => scrollToSection('education') },
    { id: 'contact', title: 'Go to Contact', icon: Mail, category: 'Navigation', action: () => scrollToSection('contact') },
    { id: 'chat', title: 'Open Chat', icon: MessageCircle, shortcut: 'Ctrl+Alt+C', category: 'Tools', action: () => { onClose(); onChatClick?.(); } },
    { id: 'profile', title: 'View Profile', icon: User, category: 'Tools', action: () => { onClose(); onProfileClick(); } },
    { id: 'theme', title: 'Toggle Theme', description: `Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`, icon: Palette, shortcut: 'Ctrl+Alt+D', category: 'Settings', action: () => toggleTheme() },
    ...(isSignedIn
      ? [{ id: 'logout', title: 'Sign Out', description: `Signed in as ${fullName}`, icon: LogOut, category: 'Account', action: () => { signOut(); onClose(); } }]
      : [{ id: 'login', title: 'Sign In', description: 'Create an account or sign in', icon: ArrowRight, category: 'Account', action: () => { onClose(); onLoginClick(); } }]
    ),
  ], [effectiveTheme, toggleTheme, isSignedIn, fullName, signOut, onClose, onLoginClick, onProfileClick, onChatClick, scrollToSection]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lower = search.toLowerCase();
    return commands.filter(cmd => cmd.title.toLowerCase().includes(lower) || cmd.description?.toLowerCase().includes(lower) || cmd.category.toLowerCase().includes(lower));
  }, [commands, search]);

  const categories = useMemo(() => {
    const cats = new Map<string, CommandItem[]>();
    filteredCommands.forEach(cmd => {
      const arr = cats.get(cmd.category) || [];
      arr.push(cmd);
      cats.set(cmd.category, arr);
    });
    return cats;
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) { setSearch(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); filteredCommands[selectedIndex]?.action(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
            onClick={onClose} className="fixed inset-0 z-[60] popup-backdrop" />

          <motion.div variants={bottomSheetContent} initial="hidden" animate="visible" exit="exit"
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:w-full sm:max-w-xl z-[60]">

            <BottomSheet onClose={onClose}>
              <div className="rounded-t-[28px] sm:rounded-[28px] overflow-hidden bg-surface border border-outline/20 shadow-elevation-5 noise-grain">
                <div className="pt-2.5 pb-0"><div className="sheet-handle" /></div>

                <div className="flex items-center gap-3 px-3 py-3 border-b border-outline/20">
                  <div className="flex-1 relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                    <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search commands..." className="w-full input-filled text-body-lg" style={{ paddingLeft: '3rem' }} />
                  </div>
                  <IconButton onClick={onClose} variant="ghost" className="rounded-lg text-muted-foreground"><X className="w-5 h-5" /></IconButton>
                </div>

                <div className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin" data-lenis-prevent>
                  {filteredCommands.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-body-md">No commands found</div>
                  ) : (
                    Array.from(categories.entries()).map(([category, items]) => (
                      <div key={category} className="mb-2">
                        <div className="px-3 py-2 text-label-sm text-muted-foreground font-medium uppercase tracking-wider">{category}</div>
                        {items.map((cmd) => {
                          const idx = globalIndex++;
                          const isSelected = idx === selectedIndex;
                          const Icon = cmd.icon;
                          return (
                            <button key={cmd.id} onClick={cmd.action} onMouseEnter={() => setSelectedIndex(idx)}
                              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors duration-75 ${isSelected ? 'bg-surface-variant' : 'hover:bg-surface-variant/50'}`}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-muted-foreground'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-body-md text-foreground font-medium truncate">{cmd.title}</div>
                                {cmd.description && <div className="text-label-sm text-muted-foreground truncate">{cmd.description}</div>}
                              </div>
                              {cmd.shortcut && <kbd className="text-label-sm text-muted-foreground bg-surface-variant px-2 py-1 rounded-lg">{cmd.shortcut}</kbd>}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-outline/20 text-label-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><kbd className="bg-surface-variant px-1.5 py-0.5 rounded text-xs">↑↓</kbd> Navigate</span>
                    <span className="flex items-center gap-1"><kbd className="bg-surface-variant px-1.5 py-0.5 rounded text-xs">↵</kbd> Select</span>
                    <span className="flex items-center gap-1"><kbd className="bg-surface-variant px-1.5 py-0.5 rounded text-xs">esc</kbd> Close</span>
                  </div>
                  <div>{filteredCommands.length} commands</div>
                </div>
              </div>
            </BottomSheet>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
