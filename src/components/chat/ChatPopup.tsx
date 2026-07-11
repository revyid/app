'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, User, Trash2, Sparkles, ChevronRight, Search,
  Copy, RotateCcw, ThumbsUp, ThumbsDown, Check,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  steps?: string[];
  thinkingMs?: number;
}

type GenPhase = 'thinking' | 'searching' | 'typing' | null;

// Live generation state — every field here is driven by real events coming from the
// server as they happen (SSE stream), not by simulated timers.
interface GenState {
  phase: GenPhase;
  steps: string[];
  thinkingOpen: boolean;
  thinkingLabel: string;
  sources: AISource[];
  typedText: string;
}

const EMPTY_GEN: GenState = {
  phase: null,
  steps: [],
  thinkingOpen: true,
  thinkingLabel: 'Berpikir...',
  sources: [],
  typedText: '',
};

// Shared "thinking" collapsible block — used both for the live generation bubble
// and for finished messages in history, so the look stays identical and the trace
// never disappears once a message is done.
function ThinkingBlock({
  steps, label, spinning, open, onToggle,
}: {
  steps: string[]; label: string; spinning: boolean; open: boolean; onToggle: () => void;
}) {
  if (steps.length === 0) return null;
  return (
    <div
      className={`border border-outline/25 bg-surface-variant/40 rounded-xl px-2.5 py-2 text-[11px] text-muted-foreground max-w-fit ${open ? '' : 'cursor-pointer'}`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-1.5 select-none">
        {spinning ? (
          <span className="w-2.5 h-2.5 rounded-full border-2 border-outline/40 border-t-purple-500 animate-spin flex-shrink-0" />
        ) : (
          <ChevronRight className={`w-2.5 h-2.5 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        )}
        <span>{label}</span>
      </div>
      {open && (
        <div className="flex flex-col gap-1 mt-1.5 pl-2.5 ml-1 border-l-2 border-outline/25">
          {steps.map((s, si) => (
            <span key={si} className="animate-in fade-in slide-in-from-bottom-1 duration-300">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceCards({ sources }: { sources: AISource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto mt-1.5 pb-1">
      {sources.map((s, si) => (
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
  );
}

// localStorage helpers
const CHAT_KEY = 'revy_ai_chat';
const loadChat = (): { aiMessages: AIMessage[]; aiMode: boolean } => {
  try {
    const d = localStorage.getItem(CHAT_KEY);
    return d ? JSON.parse(d) : { aiMessages: [], aiMode: false };
  } catch { return { aiMessages: [], aiMode: false }; }
};
const saveChat = (msgs: AIMessage[], mode: boolean) => {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify({ aiMessages: msgs, aiMode: mode })); } catch {}
};

export function ChatPopup({ isOpen, onClose, onLoginRequest, side = 'right' }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState(() => loadChat().aiMode);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>(() => loadChat().aiMessages);
  const [gen, setGen] = useState<GenState>(EMPTY_GEN);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | undefined>>({});
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [openThinkIdx, setOpenThinkIdx] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const genStartRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  
  const { user } = useAuth();
  const isSignedIn = !!user;

  useEffect(() => () => abortRef.current?.abort(), []);

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

  // Save AI chat to localStorage
  useEffect(() => {
    saveChat(aiMessages, aiMode);
  }, [aiMessages, aiMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages, gen]);

  // Consumes the Standard SSE stream from /api/ai-chat in real time.
  const streamAI = async (history: AIMessage[]) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    genStartRef.current = Date.now();
    setGen({ ...EMPTY_GEN, phase: 'thinking' });

    let steps: string[] = [];
    let sources: AISource[] = [];
    let text = '';
    let typingStarted = false;

    const finalizeError = (fallback: string) => {
      console.error('[AI Chat] Error:', fallback);
      setAiMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      setGen(EMPTY_GEN);
    };

    try {
      console.log('[AI Chat] Sending request...');
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });

      console.log('[AI Chat] Response status:', res.status);

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => 'unknown');
        console.error('[AI Chat] Response error:', res.status, errText);
        finalizeError(`Error ${res.status}: ${errText.slice(0, 100)}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let chunkCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const decoded = decoder.decode(value, { stream: true });
        buf += decoded;
        chunkCount++;
        console.log(`[AI Chat] Chunk ${chunkCount}: ${decoded.slice(0, 100)}...`);
        
        // Standard SSE chunks are separated by \n\n
        const chunks = buf.split('\n\n');
        buf = chunks.pop() ?? ''; // Keep the last incomplete chunk in buffer

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          
          // Extract just the data payload from the SSE chunk
          const dataLine = chunk.split('\n').find(l => l.startsWith('data:'));
          if (!dataLine) continue;
          
          const payload = dataLine.slice(5).trim(); // remove 'data:'
          if (!payload) continue;
          
          console.log('[AI Chat] Event payload:', payload.slice(0, 150));
          
          let evt: any;
          try { 
            evt = JSON.parse(payload); 
          } catch { 
            continue; 
          }

          if (evt.type === 'step') {
            console.log('[AI Chat] Step:', evt.label);
            // Only add step if it's a real operation (page fetch), not fake labels
            if (evt.label.startsWith('Reading:')) {
              steps = [...steps, evt.label];
              setGen(g => ({ ...g, steps }));
            }
          } else if (evt.type === 'sources') {
            console.log('[AI Chat] Sources:', evt.sources?.length);
            sources = evt.sources || [];
            setGen(g => ({ ...g, phase: 'searching', sources }));
          } else if (evt.type === 'thinking_done') {
            console.log('[AI Chat] Thinking done:', evt.seconds, 'seconds');
            setGen(g => ({ ...g, thinkingOpen: false, thinkingLabel: `Berpikir selama ${evt.seconds} detik` }));
          } else if (evt.type === 'token') {
            if (!typingStarted) {
              typingStarted = true;
              console.log('[AI Chat] Typing started');
              setGen(g => ({ ...g, phase: 'typing' }));
            }
            text += evt.text;
            setGen(g => ({ ...g, typedText: text }));
          } else if (evt.type === 'final') {
            console.log('[AI Chat] Final response:', evt.text?.slice(0, 100));
            text = evt.text || text;
            setGen(g => ({ ...g, typedText: text }));
          } else if (evt.type === 'final_override') {
            console.log('[AI Chat] Final override:', evt.text?.slice(0, 100));
            text = evt.text;
            setGen(g => ({ ...g, typedText: text }));
          } else if (evt.type === 'error') {
            throw new Error(evt.message || 'AI unavailable');
          }
        }
      }

      console.log('[AI Chat] Stream finished. Text length:', text.length, 'Steps:', steps.length, 'Sources:', sources.length);
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: text || 'Maaf, tidak ada respon.',
        sources,
        steps,
        thinkingMs: Date.now() - genStartRef.current,
      }]);
      setGen(EMPTY_GEN);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('[AI Chat] Error:', err);
      finalizeError('Maaf, AI sedang tidak tersedia. Coba lagi sebentar lagi.');
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
      await streamAI(allMessages);
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
    await streamAI(history);
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

                    {/* Thinking trace — persists in history, merged into the same message block */}
                    {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                      <div className="mb-1.5">
                        <ThinkingBlock
                          steps={msg.steps}
                          spinning={false}
                          open={!!openThinkIdx[i]}
                          label={msg.thinkingMs ? `Berpikir selama ${Math.max(1, Math.round(msg.thinkingMs / 1000))} detik` : 'Berpikir'}
                          onToggle={() => setOpenThinkIdx(o => ({ ...o, [i]: !o[i] }))}
                        />
                      </div>
                    )}

                    <div className={`inline-block max-w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[12px] text-left leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-surface-variant text-foreground rounded-tl-sm'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="chat-markdown">
                          <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
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

            {/* Live generation bubble — thinking / searching / typing, all driven by real stream events */}
            {gen.phase && (
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="max-w-[85%] min-w-0 w-full">
                  <p className="text-[9px] text-muted-foreground mb-0.5">AI</p>

                  <ThinkingBlock
                    steps={gen.steps}
                    spinning={gen.phase === 'thinking'}
                    open={gen.thinkingOpen}
                    label={gen.thinkingLabel}
                    onToggle={() => setGen(g => ({ ...g, thinkingOpen: !g.thinkingOpen }))}
                  />

                  {gen.phase === 'searching' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-outline/25 bg-surface-variant/40 px-2.5 py-1.5 rounded-full mt-1.5 w-fit">
                      <Search className="w-2.5 h-2.5" />
                      Membaca halaman terkait...
                    </div>
                  )}

                  <SourceCards sources={gen.sources} />

                  {gen.phase === 'typing' && gen.typedText && (
                    <div className="mt-1.5 inline-block max-w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl rounded-tl-sm bg-surface-variant text-foreground text-[12px] text-left leading-relaxed">
                      <div className="chat-markdown">
                        <Markdown remarkPlugins={[remarkGfm]}>{gen.typedText}</Markdown>
                      </div>
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
