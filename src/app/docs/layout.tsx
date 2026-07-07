'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, Globe, Link2, Code as CodeIcon, PlayCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageTransition } from '@/components/shared/PageTransition';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { UserProfilePopup } from '@/components/profile/UserProfilePopup';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { createPortal } from 'react-dom';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: BookOpen },
  { href: '/dashboard', label: 'Dashboard', icon: Globe, children: [
    { href: '/dashboard/api-keys', label: 'API Keys', icon: Globe },
  ]},
  { href: '/docs', label: 'Docs', icon: BookOpen, children: [
    { href: '/docs', label: 'Overview', icon: BookOpen },
    { href: '/docs/api-reference', label: 'API Reference', icon: Globe, children: [
      { href: '/docs/api-reference/github', label: 'GitHub API', icon: Globe },
      { href: '/docs/api-reference/shorten', label: 'URL Shortener', icon: Link2 },
    ]},
    { href: '/docs/sandbox', label: 'Sandbox', icon: PlayCircle },
    { href: '/docs/curl-ts', label: 'curl-ts', icon: CodeIcon },
  ]},
];

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(true);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-surface-variant/40 transition-colors shrink-0">
            <ChevronRight className={`w-3 h-3 text-muted-foreground/50 transition-transform ${open ? 'rotate-90' : ''}`} />
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        <Link href={item.href}
          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors ml-0.5 ${
            isActive ? 'bg-primary/8 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-surface-variant/40'
          }`}>
          <Icon className="w-4 h-4 shrink-0 opacity-60" />
          {item.label}
        </Link>
      </div>
      {hasChildren && open && (
        <div className="ml-3 border-l border-outline/10 pl-2 mt-0.5">
          {item.children!.map(child => (
            <NavItem key={child.href} item={child} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

function PopupPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:pl-80 lg:pr-8 py-8 lg:py-12 pb-24">
        <Sidebar
          showFooter
          onChatClick={() => setIsChatOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
          onAdminClick={() => setIsAdminOpen(true)}
        >
          <nav className="space-y-0.5">
            {NAV.map(item => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </Sidebar>
        <main className="max-w-4xl mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <PopupPortal>
        <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onLoginRequest={() => {}} side="left" />
        <UserProfilePopup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onLoginRequest={() => {}} side="left" />
        <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      </PopupPortal>
    </div>
  );
}
