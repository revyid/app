'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Trash2, Sparkles, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMessages, sendMessage, subscribeToMessages, deleteMessage, deleteMessageAdmin, type ChatMessage } from '@/lib/supabase';
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

  // Easter egg: Ctrl + Alt + A + I toggles AI mode
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
      setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...aiMessages, { role: 'user', content: userMsg }] }),
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Chat container — Gemini style: centered, clean */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:max-w-[calc(100vw-3rem)] z-[60] flex items-end sm:items-end justify-center"
          >
            <div className="w-full sm:w-auto relative">
              {/* Orbiting glow — Gemini style */}
              {aiMode && (
                <div className="absolute -inset-1 rounded-[32px] overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 animate-orbit-glow"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0%, hsl(var(--primary)) 15%, transparent 30%, hsl(var(--tertiary)) 45%, transparent 60%, hsl(var(--primary)) 75%, transparent 90%)',
                    }}
                  />
                  <div className="absolute inset-0 bg-black/80 rounded-[32px]" />
                </div>
              )}

              {/* Main card */}
              <div className={`
                relative z-10 bg-surface rounded-[28px] shadow-elevation-5 overflow-hidden
                ${aiMode ? 'border border-primary/30' : 'border border-outline/10'}
              `}>
                {/* Loading bar */}
                {isLoading && (
                  <div className="absolute top-0 left-0 right-0 z-20">
                    <LinearProgress color={aiMode ? 'secondary' : 'primary'} />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline/10">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${aiMode
                        ? 'bg-gradient-to-br from-primary via-tertiary to-primary animate-gradient-x'
                        : 'bg-primary/10'
                      }
                    `}>
                      {aiMode ? (
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-title-sm">
                        {aiMode ? 'Gemini' : 'Global Chat'}
                      </h3>
                      <p className="text-label-sm text-muted-foreground">
                        {aiMode ? 'AI Assistant' : `${messages.length} messages`}
                      </p>
                    </div>
                  </div>
                  <IconButton
                    onClick={onClose}
                    variant="ghost"
                    className="rounded-full w-9 h-9 bg-surface-variant/50 hover:bg-surface-variant"
                  >
                    <X className="w-4 h-4" />
                  </IconButton>
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages" data-lenis-prevent>
                  {aiMode ? (
                    aiMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-tertiary/20 to-primary/20 flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-foreground text-body-lg font-medium mb-1">Hello! I'm Gemini</p>
                        <p className="text-muted-foreground text-body-sm">Ask me anything — coding, general knowledge, or just chat.</p>
                      </div>
                    ) : (
                      aiMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${msg.role === 'assistant'
                              ? 'bg-gradient-to-br from-primary to-tertiary'
                              : 'bg-surface-variant'
                            }
                          `}>
                            {msg.role === 'assistant' ? (
                              <Bot className="w-4 h-4 text-primary-foreground" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                            <p className="text-label-xs text-muted-foreground mb-1">
                              {msg.role === 'assistant' ? 'Gemini' : 'You'}
                            </p>
                            <div className={`
                              inline-block px-4 py-3 text-body-sm leading-relaxed
                              ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md'
                                : 'bg-surface-variant text-foreground rounded-2xl rounded-tl-md'
                              }
                            `}>
                              {msg.content}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )
                  ) : (
                    messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-foreground text-body-lg font-medium mb-1">Welcome!</p>
                        <p className="text-muted-foreground text-body-sm">Be the first to say hello.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.user_id === user?.id;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                          >
                            <img
                              src={msg.user_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_name)}&background=random`}
                              alt={msg.user_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                              <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                                <p className="text-label-xs text-muted-foreground">{msg.user_name}</p>
                                {(isOwn || user?.is_admin) && (
                                  <IconButton
                                    onClick={() => {
                                      if (user?.is_admin) deleteMessageAdmin(msg.id);
                                      else if (user?.id) deleteMessage(msg.id, user.id);
                                    }}
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-muted-foreground hover:text-error"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </IconButton>
                                )}
                              </div>
                              <div className={`
                                inline-block px-4 py-3 text-body-sm
                                ${isOwn
                                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md'
                                  : 'bg-surface-variant text-foreground rounded-2xl rounded-tl-md'
                                }
                              `}>
                                {msg.message}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-outline/10 p-4">
                  {!isSignedIn && !aiMode ? (
                    <div className="flex items-center justify-between">
                      <p className="text-body-sm text-muted-foreground">Sign in to chat</p>
                      <Button onClick={onLoginRequest} variant="filled" size="sm" className="rounded-full">
                        Sign In
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder={aiMode ? "Ask Gemini anything..." : "Type a message..."}
                          aria-label="Type a message"
                          className={`
                            w-full px-4 py-3 bg-surface-variant border rounded-2xl
                            text-body-sm text-foreground placeholder-muted-foreground
                            focus:outline-none focus:ring-2 transition-all duration-200
                            ${aiMode
                              ? 'border-primary/20 focus:ring-primary/30'
                              : 'border-outline/20 focus:ring-primary/30'
                            }
                          `}
                        />
                      </div>
                      <IconButton
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isLoading}
                        variant="filled"
                        className={`
                          rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0
                          ${aiMode
                            ? 'bg-gradient-to-r from-primary to-tertiary hover:from-primary/90 hover:to-tertiary/90'
                            : ''
                          }
                        `}
                      >
                        <Send className="w-5 h-5" />
                      </IconButton>
                    </div>
                  )}

                  {/* AI mode indicator */}
                  {aiMode && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-label-xs text-primary font-medium">Gemini Mode</span>
                      </div>
                      <span className="text-label-xs text-muted-foreground">
                        Ctrl+Alt+A+I to toggle
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}