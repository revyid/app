'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Trash2, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { fetchMessages, sendMessage, subscribeToMessages, deleteMessage, deleteMessageAdmin, type ChatMessage } from '@/lib/supabase';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { LinearProgress } from '@/components/shared/LinearProgress';
import { Button, IconButton } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export function ChatPopup({ isOpen, onClose, onLoginRequest, side = 'right' }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [status, setStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isSignedIn = !!user;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
      const handleNextKey = (e2: KeyboardEvent) => {
        if (e2.key.toLowerCase() === 'i') setAiMode(prev => !prev);
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
  }, [messages, aiMessages, status]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setIsLoading(true);

    if (aiMode) {
      const userMsg = newMessage.trim();
      setNewMessage('');
      const allMessages = [...aiMessages, { role: 'user' as const, content: userMsg }];
      setAiMessages(allMessages);
      setStatus('Thinking...');

      console.log('[AI Chat] Sending:', userMsg);

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages }),
        });

        console.log('[AI Chat] Status:', res.status);
        const data = await res.json();
        console.log('[AI Chat] Response:', data);

        setStatus('');
        if (data.status) {
          console.log('[AI Chat] Page fetched:', data.status);
        }
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.message || 'No response' }]);
      } catch (err) {
        console.error('[AI Chat] Error:', err);
        setStatus('');
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
    <div className="bg-surface rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 border border-outline/10 overflow-hidden noise-grain relative">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <LinearProgress color="secondary" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline/10">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${aiMode ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary/10'}`}>
            {aiMode ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <h3 className="font-medium text-foreground text-[13px]">
              {aiMode ? 'AI Assistant' : 'Global Chat'}
            </h3>
          </div>
        </div>
        <IconButton onClick={onClose} variant="ghost" className="rounded-full w-8 h-8">
          <X className="w-4 h-4" />
        </IconButton>
      </div>

      {/* Messages */}
      <div className="h-[50vh] sm:h-80 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages" data-lenis-prevent>
        {aiMode ? (
          <>
            {aiMessages.length === 0 && !status && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-6 h-6 text-purple-500/50 mb-2" />
                <p className="text-[12px] text-muted-foreground">Ask me anything about Revy</p>
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                  {msg.role === 'assistant' && (
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI
                    </p>
                  )}
                  <div className={`text-[12px] leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-md' : 'text-foreground'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="chat-markdown">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {status && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <TypingIndicator />
              </div>
            )}
          </>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <User className="w-6 h-6 text-muted-foreground/30 mb-2" />
                <p className="text-[12px] text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`${isOwn ? 'flex justify-end' : ''}`}>
                    <div className={`max-w-[85%]`}>
                      {!isOwn && (
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                          <img src={msg.user_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_name)}&background=random`} alt="" className="w-3 h-3 rounded-full" />
                          {msg.user_name}
                        </p>
                      )}
                      <div className={`text-[12px] leading-relaxed ${isOwn ? 'bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-md' : 'bg-surface-variant text-foreground px-3 py-2 rounded-2xl rounded-bl-md'}`}>
                        {msg.message}
                      </div>
                      {(isOwn || user?.is_admin) && (
                        <button onClick={() => { if (user?.is_admin) deleteMessageAdmin(msg.id); else if (user?.id) deleteMessage(msg.id, user.id); }}
                          className="text-[9px] text-muted-foreground/50 hover:text-error mt-0.5">
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-outline/10 p-3">
        {!isSignedIn && !aiMode ? (
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Sign in to chat</p>
            <Button onClick={onLoginRequest} variant="filled" size="sm" className="rounded-full text-[11px] h-7 px-3">Sign In</Button>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress}
              placeholder={aiMode ? "Ask anything..." : "Type a message..."} aria-label="Type a message"
              className="flex-1 min-w-0 px-3 py-2 bg-surface-variant border border-outline/20 rounded-full text-[12px] text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
            <button onClick={handleSend} disabled={!newMessage.trim() || isLoading}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 transition-colors flex-shrink-0">
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        )}
        {aiMode && (
          <p className="text-[9px] text-muted-foreground/50 mt-1.5 text-center">Ctrl+Alt+A+I to toggle</p>
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
            className={`fixed bottom-0 left-0 right-0 sm:bottom-4 sm:w-[380px] sm:max-w-[calc(100vw-2rem)] z-[60] ${side === 'left' ? 'sm:left-4' : 'sm:right-4 sm:left-auto'}`}>
            <BottomSheet onClose={onClose}>
              {aiMode ? (
                <div className="ai-glow-wrap">{chatContent}</div>
              ) : chatContent}
            </BottomSheet>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}