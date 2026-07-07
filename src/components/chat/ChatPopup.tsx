'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMessages, sendMessage, subscribeToMessages, deleteMessage, deleteMessageAdmin, type ChatMessage } from '@/lib/supabase';
import { modalBackdrop } from '@/lib/motion-presets';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { LinearProgress } from '@/components/shared/LinearProgress';
import { Button, IconButton } from '@/components/ui/button';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginRequest: () => void;
}

export function ChatPopup({ isOpen, onClose, onLoginRequest }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isSignedIn = !!user;

  useEffect(() => {
    fetchMessages().then(setMessages);
    const channel = subscribeToMessages(
      (msg) => setMessages(prev => [...prev, msg]),
      (id) => setMessages(prev => prev.filter(m => m.id !== id))
    );
    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setIsLoading(true);
    await sendMessage(user.id, user.display_name || user.email || 'Anonymous', user.avatar_url, newMessage);
    setNewMessage('');
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 z-[60] pointer-events-auto" />

          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-[60]">

            <BottomSheet onClose={onClose}>
              <div className="bg-surface rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 border border-outline/20 overflow-hidden noise-grain">
                <div className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing"><div className="sheet-handle" /></div>

                <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-title-sm">Global Chat</h3>
                      <p className="text-label-sm text-muted-foreground">{messages.length} messages</p>
                    </div>
                  </div>
                  <IconButton onClick={onClose} variant="ghost" className="rounded-full bg-surface-variant hover:bg-surface-variant/80">
                    <X className="w-5 h-5" />
                  </IconButton>
                </div>

                <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages" data-lenis-prevent>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground text-body-md">No messages yet. Be the first to say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.user_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <img src={msg.user_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_name)}&background=random`} alt={msg.user_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                              <p className="text-label-sm text-muted-foreground">{msg.user_name}</p>
                              {(isOwn || user?.is_admin) && (
                                <IconButton onClick={() => { if (user?.is_admin) { deleteMessageAdmin(msg.id); } else if (user?.id) { deleteMessage(msg.id, user.id); } }} variant="ghost" className="h-5 w-5 p-0 text-muted-foreground hover:text-error">
                                  <Trash2 className="w-3 h-3" />
                                </IconButton>
                              )}
                            </div>
                            <div className={`inline-block px-4 py-2 rounded-2xl text-body-sm ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-surface-variant text-foreground rounded-tl-sm'}`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-outline/20 relative">
                  {!isSignedIn ? (
                    <div className="p-4 flex items-center justify-between bg-surface-variant/30">
                      <p className="text-body-sm text-muted-foreground">Sign in to chat</p>
                      <Button onClick={onLoginRequest} variant="filled" size="sm" className="rounded-full">Sign In</Button>
                    </div>
                  ) : (
                    <>
                      {isLoading && (
                        <div className="absolute top-0 left-0 right-0 -mt-1 z-10">
                          <LinearProgress color="primary" />
                        </div>
                      )}
                      <div className="p-4 flex gap-2">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Type a message..." aria-label="Type a message"
                          className="flex-1 px-4 py-3 bg-surface-variant border border-outline/30 rounded-full text-body-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-150" />
                        <IconButton onClick={handleSend} disabled={!newMessage.trim() || isLoading} variant="filled" className="rounded-full w-12 h-12">
                          <Send className="w-5 h-5 ml-1" />
                        </IconButton>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </BottomSheet>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
