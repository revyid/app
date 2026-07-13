'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, BarChart3, Palette, Settings, Users, ArrowLeft, Palette as PaletteIcon, LayoutDashboard, Key, Link2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';
import { Footer } from '@/components/layout/Footer';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { UserProfilePopup } from '@/components/profile/UserProfilePopup';
import { createPortal } from 'react-dom';
import { NAV } from '@/lib/nav';

const ADMIN_TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: LayoutDashboard, description: 'Edit projects, experience, education, skills' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'View site traffic and user stats' },
  { id: 'themes', label: 'Themes', icon: Palette, description: 'Manage color themes and appearance' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Site settings, API keys, rate limits' },
  { id: 'users', label: 'Users', icon: Users, description: 'Manage users and permissions' },
];

function PopupPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1">
        <Sidebar
          showFooter
          showMobile={false}
          onChatClick={() => setIsChatOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
        >
          <nav className="space-y-0.5">
            <Link
              href="/"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-surface-variant/40 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="h-px bg-outline/10 my-2" />
            <div className="px-2 py-1">
              <div className="flex items-center gap-2 text-label-sm font-semibold text-primary">
                <Shield className="w-4 h-4" />
                Admin Panel
              </div>
            </div>
            {ADMIN_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  href={`/admin?tab=${tab.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-surface-variant/40 transition-colors"
                >
                  <Icon className="w-4 h-4 opacity-60" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </Sidebar>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24">
          {children}
        </main>
      </div>

      <div className="lg:pl-80">
        <Footer />
      </div>

      <MobileNavDrawer
        nav={NAV}
        onChatClick={() => setIsChatOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <PopupPortal>
        <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onLoginRequest={() => {}} side="left" />
        <UserProfilePopup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onLoginRequest={() => {}} side="left" />
      </PopupPortal>
    </div>
  );
}
