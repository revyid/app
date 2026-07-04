'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FloatingNavbar } from '@/components/navbar/FloatingNavbar';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { UserProfilePopup } from '@/components/profile/UserProfilePopup';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { CustomLogin } from '@/components/auth/CustomLogin';

function PopupPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <>
      {children}

      <FloatingNavbar
        onChatClick={() => setIsChatOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
        onAdminClick={() => setIsAdminOpen(true)}
      />

      <PopupPortal>
        <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onLoginRequest={() => setIsLoginOpen(true)} />
        <UserProfilePopup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onLoginRequest={() => { setIsProfileOpen(false); setIsLoginOpen(true); }} />
        <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <CustomLogin isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </PopupPortal>
    </>
  );
}
