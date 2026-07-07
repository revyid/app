'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ProfileHeader } from '@/components/sections/ProfileHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { LanguagesSection } from '@/components/sections/LanguagesSection';
import { SocialLinks } from '@/components/sections/SocialLinks';

interface SidebarProps {
  ready?: boolean;
}

function SidebarContent() {
  return (
    <>
      <ProfileHeader />
      <div className="h-px bg-outline/15" />
      <AboutSection />
      <div className="h-px bg-outline/15" />
      <LanguagesSection />
      <div className="h-px bg-outline/15" />
      <SocialLinks />
      <div className="mt-auto pt-4 border-t border-outline/15">
        <div className="text-center space-y-1.5">
          <p className="text-label-sm text-muted-foreground/40">
            Built with React & Next.js
          </p>
          <div className="flex items-center justify-center gap-2 text-label-sm">
            <a href="#projects" className="text-muted-foreground/60 hover:text-primary transition-colors">Explore Work</a>
            <span className="w-0.5 h-0.5 rounded-full bg-outline/30" />
            <a href="#contact" className="text-muted-foreground/60 hover:text-primary transition-colors">Work With Me</a>
          </div>
          <p className="text-label-sm text-muted-foreground/40">
            © 2026 revyid
          </p>
        </div>
      </div>
    </>
  );
}

export function Sidebar(_props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-8 top-4 bottom-4 w-72 z-10">
        <div className="h-full flex items-center">
          <div className="squircle-card bg-surface border border-outline/20 p-4 space-y-2.5 noise-grain shadow-fluid w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin flex flex-col">
            <SidebarContent />
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
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
