'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, User, Trash2, Sparkles, ChevronRight, Search,
  Copy, RotateCcw, ThumbsUp, ThumbsDown, Check,
} from 'lucide-react';
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

interface AISource {
  title: string;
  url: string;
  domain: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: AISource[];
  thinkingMs?: number;
}

type GenPhase = 'thinking' | 'searching' | 'typing' | null;

interface GenState {
  phase: GenPhase;
  steps: string[];
  visibleSteps: number;
  thinkingOpen: boolean;
  thinkingLabel: string;
  sources: AISource[];
  visibleSources: number;
  typedText: string;
  fullText: string;
}

const EMPTY_GEN: GenState = {
  phase: null,
  steps: [],
  visibleSteps: 0,
  thinkingOpen: true,
  thinkingLabel: 'Berpikir...',
  sources: [],
  visibleSources: 0,
  typedText: '',
  fullText: '',
};

export function ChatPopup({ isOpen, onClose, onLoginRequest, side = 'right' }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [gen, setGen] = useState<GenState>(EMPTY_GEN);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | undefined>>({});
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const genStartRef = useRef<number>(0);
  const { user } = useAuth();
  const isSignedIn = !!user;

  const clearGenTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };
  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => () => clearGenTimers(), []);

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
  }, [messages, aiMessages, gen]);

  // Drives the "thinking → searching → typing" reveal sequence once the API responds.
  const runGeneration = useCallback((steps: string[], sources: AISource[], fullText: string) => {
    genStartRef.current = Date.now();
    setGen({ ...EMPTY_GEN, phase: 'thinking', steps, sources, fullText });

    let stepIdx = 0;
    const revealStep = () => {
      if (stepIdx < steps.length) {
        stepIdx++;
        setGen(g => ({ ...g, visibleSteps: stepIdx }));
        addTimer(revealStep, 380 + Math.random() * 220);
      } else {
        addTimer(collapseThinking, 300);
      }
    };

    const collapseThinking = () => {
      const seconds = Math.max(1, Math.round((Date.now() - genStartRef.current) / 1000));
      setGen(g => ({ ...g, thinkingOpen: false, thinkingLabel: `Berpikir selama ${seconds} detik` }));
      if (sources.length > 0) {
        addTimer(() => setGen(g => ({ ...g, phase: 'searching' })), 250);
        addTimer(revealSources, 900);
      } else {
        addTimer(startTyping, 300);
      }
    };

    let sourceIdx = 0;
    const revealSources = () => {
      sourceIdx = sources.length;
      setGen(g => ({ ...g, visibleSources: sourceIdx }));
      addTimer(startTyping, 500);
    };

    const startTyping = () => {
      setGen(g => ({ ...g, phase: 'typing' }));
      let i = 0;
      const speed = fullText.length > 400 ? 4 : 12;
      const typeChunk = () => {
        i = Math.min(fullText.length, i + 2);
        setGen(g => ({ ...g, typedText: fullText.slice(0, i) }));
        if (i < fullText.length) {
          addTimer(typeChunk, speed);
        } else {
          addTimer(finish, 200);
        }
      };
      typeChunk();
    };

    const finish = () => {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: fullText,
        sources,
        thinkingMs: Date.now() - genStartRef.current,
      }]);
      setGen(EMPTY_GEN);
    };

    revealStep();
  }, []);

  const askAI = async (history: AIMessage[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, AI sedang tidak tersedia. Coba lagi sebentar lagi.' }]);
      } else {
        runGeneration(data.steps || [], data.sources || [], data.message || 'No response');
      }
    } catch (err) {
      console.error('[AI Chat] Error:', err);
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Error: tidak bisa menghubungi layanan AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || gen.phase) return;

    if (aiMode) {
      const userMsg = newMessage.trim();
      setNewMessage('');
      const allMessages = [...aiMessages, { role: 'user' as const, content: userMsg }];
      setAiMessages(allMessages);
      await askAI(allMessages);
    } else if (user) {
      setIsLoading(true);
      await sendMessage(user.id, user.display_name || user.email || 'Anonymous', user.avatar_url, newMessage);
      setNewMessage('');
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (gen.phase) return;
    const lastUserIdx = [...aiMessages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const cutIdx = aiMessages.length - 1 - lastUserIdx;
    const history = aiMessages.slice(0, cutIdx + 1);
    setAiMessages(history);
    await askAI(history);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(prev => (prev === idx ? null : prev)), 1500);
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

      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-outline/20">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${aiMode ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary'}`}>
            {aiMode ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-[14px] sm:text-title-sm">
              {aiMode ? 'AI Chat' : 'Global Chat'}
              {aiMode && <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-label-xs text-purple-500 font-normal">Beta</span>}
            </h3>
            <p className="text-[11px] sm:text-label-sm text-muted-foreground">
              {aiMode ? `${aiMessages.length} pesan` : `${messages.length} messages`}
            </p>
          </div>
        </div>
        <IconButton onClick={onClose} variant="ghost" className="rounded-full w-8 h-8 sm:w-9 sm:h-9 bg-surface-variant hover:bg-surface-variant/80">
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </IconButton>
      </div>

      <div className="h-[50vh] sm:h-80 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages" data-lenis-prevent>
        {aiMode ? (
          <>
            {aiMessages.length === 0 && !gen.phase ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
                <p className="text-muted-foreground text-body-md">Ask me anything!</p>
                <p className="text-label-sm text-muted-foreground mt-1">Powered by NVIDIA AI</p>
              </div>
            ) : (
              aiMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary'}`}>
                    {msg.role === 'assistant' ? (
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[85%] min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <p className="text-[9px] text-muted-foreground mb-0.5">{msg.role === 'assistant' ? 'AI' : 'You'}</p>
                    <div className={`inline-block max-w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[12px] text-left leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-surface-variant text-foreground rounded-tl-sm'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="chat-markdown">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      ) : (
                        <span className="break-words">{msg.content}</span>
                      )}
                    </div>

                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {msg.sources.map((s, si) => (
                          <a key={si} href={s.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-muted-foreground border border-outline/30 px-2 py-0.5 rounded-full hover:border-purple-400 hover:text-purple-500 transition-colors">
                            <span className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                            {s.domain}
                          </a>
                        ))}
                      </div>
                    )}

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <button type="button" onClick={() => handleCopy(msg.content, i)} title="Salin"
                          className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-variant hover:text-foreground transition-colors">
                          {copiedIdx === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {i === aiMessages.length - 1 && (
                          <button type="button" onClick={handleRegenerate} title="Buat ulang"
                            className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-variant hover:text-foreground transition-colors">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                        <button type="button" title="Suka"
                          onClick={() => setFeedback(f => ({ ...f, [i]: f[i] === 'up' ? undefined : 'up' }))}
                          className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-variant transition-colors ${feedback[i] === 'up' ? 'text-purple-500' : 'text-muted-foreground hover:text-foreground'}`}>
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button type="button" title="Kurang suka"
                          onClick={() => setFeedback(f => ({ ...f, [i]: f[i] === 'down' ? undefined : 'down' }))}
                          className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-variant transition-colors ${feedback[i] === 'down' ? 'text-purple-500' : 'text-muted-foreground hover:text-foreground'}`}>
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Live generation bubble — thinking / searching / typing */}
            {gen.phase && (
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="max-w-[85%] min-w-0 w-full">
                  <p className="text-[9px] text-muted-foreground mb-0.5">AI</p>

                  {/* Thinking block */}
                  <div className={`border border-outline/25 bg-surface-variant/40 rounded-xl px-2.5 py-2 text-[11px] text-muted-foreground max-w-fit ${gen.thinkingOpen ? '' : 'cursor-pointer'}`}
                    onClick={() => setGen(g => ({ ...g, thinkingOpen: !g.thinkingOpen }))}>
                    <div className="flex items-center gap-1.5 select-none">
                      {gen.phase === 'thinking' ? (
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-outline/40 border-t-purple-500 animate-spin flex-shrink-0" />
                      ) : (
                        <ChevronRight className={`w-2.5 h-2.5 flex-shrink-0 transition-transform ${gen.thinkingOpen ? 'rotate-90' : ''}`} />
                      )}
                      <span>{gen.thinkingLabel}</span>
                    </div>
                    {gen.thinkingOpen && (
                      <div className="flex flex-col gap-1 mt-1.5 pl-2.5 ml-1 border-l-2 border-outline/25">
                        {gen.steps.slice(0, gen.visibleSteps).map((s, si) => (
                          <span key={si} className="animate-in fade-in slide-in-from-bottom-1 duration-300">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Searching chip */}
                  {gen.phase === 'searching' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-outline/25 bg-surface-variant/40 px-2.5 py-1.5 rounded-full mt-1.5 w-fit">
                      <Search className="w-2.5 h-2.5" />
                      Membaca halaman terkait...
                    </div>
                  )}

                  {/* Source cards */}
                  {gen.visibleSources > 0 && gen.sources.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto mt-1.5 pb-1">
                      {gen.sources.slice(0, gen.visibleSources).map((s, si) => (
                        <a key={si} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 w-32 border border-outline/25 bg-surface rounded-lg p-2 text-[10px] hover:border-purple-400 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300">
                          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[8px] font-bold mb-1">
                            {s.domain.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium text-foreground line-clamp-2">{s.title}</div>
                          <div className="text-muted-foreground mt-0.5">{s.domain}</div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Typing answer */}
                  {gen.phase === 'typing' && (
                    <div className="mt-1.5 inline-block max-w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl rounded-tl-sm bg-surface-variant text-foreground text-[12px] text-left leading-relaxed">
                      <div className="chat-markdown">
                        <Markdown>{gen.typedText}</Markdown>
                      </div>
                      <span className="inline-block w-[2px] h-[1em] bg-foreground align-text-bottom ml-0.5 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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
          <div className="p-3 sm:p-4 flex gap-2 items-center">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress}
              disabled={!!gen.phase}
              placeholder={aiMode ? (gen.phase ? 'AI sedang menjawab...' : 'Ask AI anything...') : 'Type a message...'} aria-label="Type a message"
              className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-surface-variant border rounded-full text-[13px] sm:text-body-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-150 disabled:opacity-60 ${aiMode ? 'border-purple-500/30 focus:ring-purple-500/30' : 'border-outline/30 focus:ring-primary/30'}`} />
            <IconButton onClick={handleSend} disabled={!newMessage.trim() || isLoading || !!gen.phase} variant="filled"
              className={`rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 ${aiMode ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
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
