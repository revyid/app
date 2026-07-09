'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Trash2, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
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
  side?: 'left' | 'right';
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPopup({ isOpen, onClose, onLoginRequest, side = 'right' }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isSignedIn = !!user;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
      const handleNextKey = (e2: KeyboardEvent) => {
        if (e2.key.toLowerCase() === 'i') {
          setAiMode(prev => !prev);
        }
        document.removeEventListener('keydown', handleNextKey);
      };
      document.addEventListener('keydown', handleNextKey, { once: true });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages().then(setMessages);
    const channel = subscribeToMessages(
      (msg) => setMessages(prev => [...prev, msg]),
      (id) => setMessages(prev => prev.filter(m => m.id !== id))
    );
    return () => { channel.unsubscribe(); };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setIsLoading(true);

    if (aiMode) {
      const userMsg = newMessage.trim();
      setNewMessage('');

      // Build messages array with current state + new message
      const allMessages = [...aiMessages, { role: 'user' as const, content: userMsg }];
      setAiMessages(allMessages);

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages }),
        });
        const data = await res.json();
        if (data.message) {
          setAiMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        }
      } catch {
        setAiMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not reach AI service.' }]);
      }
    } else if (user) {
      await sendMessage(user.id, user.display_name || user.email || 'Anonymous', user.avatar_url, newMessage);
      setNewMessage('');
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const chatContent = (
    <div className={`bg-surface rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 border overflow-hidden noise-grain relative ${aiMode ? '' : 'border-outline/20'}`}>
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <LinearProgress color={aiMode ? 'secondary' : 'primary'} />
        </div>
      )}

      <div className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing"><div className="sheet-handle" /></div>

      <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${aiMode ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary'}`}>
            {aiMode ? <Sparkles className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-primary-foreground" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-title-sm">
              {aiMode ? 'AI Chat' : 'Global Chat'}
              {aiMode && <span className="ml-2 text-label-xs text-purple-500 font-normal">Beta</span>}
            </h3>
            <p className="text-label-sm text-muted-foreground">
              {aiMode ? `${aiMessages.length} messages` : `${messages.length} messages`}
            </p>
          </div>
        </div>
        <IconButton onClick={onClose} variant="ghost" className="rounded-full bg-surface-variant hover:bg-surface-variant/80">
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages" data-lenis-prevent>
        {aiMode ? (
          aiMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-muted-foreground text-body-md">Ask me anything!</p>
              <p className="text-label-sm text-muted-foreground mt-1">Powered by NVIDIA AI</p>
            </div>
          ) : (
            aiMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary'}`}>
                  {msg.role === 'assistant' ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <p className="text-label-sm text-muted-foreground mb-1">{msg.role === 'assistant' ? 'AI' : 'You'}</p>
                  <div className={`inline-block px-4 py-2 rounded-2xl text-body-sm text-left ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-surface-variant text-foreground rounded-tl-sm'}`}>
                    {msg.role === 'assistant' ? (
                      <Markdown className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-background/50 prose-pre:rounded-lg prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
                        {msg.content}
                      </Markdown>
                    ) : msg.content}
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          messages.length === 0 ? (
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
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-outline/20 relative">
        {!isSignedIn && !aiMode ? (
          <div className="p-4 flex items-center justify-between bg-surface-variant/30">
            <p className="text-body-sm text-muted-foreground">Sign in to chat</p>
            <Button onClick={onLoginRequest} variant="filled" size="sm" className="rounded-full">Sign In</Button>
          </div>
        ) : (
          <div className="p-4 flex gap-2 items-center">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress}
              placeholder={aiMode ? "Ask AI anything..." : "Type a message..."} aria-label="Type a message"
              className={`flex-1 px-4 py-3 bg-surface-variant border rounded-full text-body-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-150 ${aiMode ? 'border-purple-500/30 focus:ring-purple-500/30' : 'border-outline/30 focus:ring-primary/30'}`} />
            <IconButton onClick={handleSend} disabled={!newMessage.trim() || isLoading} variant="filled"
              className={`rounded-full w-12 h-12 flex items-center justify-center ${aiMode ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}>
              <Send className="w-5 h-5" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 z-[60] pointer-events-auto" />

          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={`fixed bottom-0 left-0 right-0 sm:bottom-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-[60] ${side === 'left' ? 'sm:left-4' : 'sm:right-4 sm:left-auto'}`}>

            <BottomSheet onClose={onClose}>
              {aiMode ? (
                <div className="ai-glow-wrap">
                  {chatContent}
                </div>
              ) : chatContent}
            </BottomSheet>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}