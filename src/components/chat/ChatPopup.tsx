'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { fetchMessages, sendMessage, subscribeToMessages, deleteMessage, deleteMessageAdmin, type ChatMessage } from '@/lib/supabase';
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

interface ChatMessageUI {
  id: string;
  type: 'user' | 'ai';
  content: string;
  thinking?: string[];
  sources?: { name: string; page: string }[];
  status?: 'thinking' | 'searching' | 'typing' | 'done';
}

function ThinkingBlock({ steps, isOpen, onToggle, status }: { steps: string[]; isOpen: boolean; onToggle: () => void; status: string }) {
  return (
    <div className={`chat-thinking ${isOpen ? 'open' : ''}`}>
      <div className="chat-thinking-header" onClick={onToggle}>
        {status === 'thinking' && <div className="chat-think-spinner" />}
        <span className="chat-think-label">{status === 'thinking' ? 'Berpikir...' : status}</span>
        <svg className="chat-chevron" viewBox="0 0 24 24" width="11" height="11"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      </div>
      <div className="chat-thinking-steps">
        {steps.map((step, i) => (
          <div key={i} className="chat-thinking-step" style={{ animationDelay: `${i * 0.1}s` }}>{step}</div>
        ))}
      </div>
    </div>
  );
}

function SourcePill({ name }: { name: string }) {
  return (
    <span className="chat-source-pill">
      <span className="chat-source-dot" />
      {name}
    </span>
  );
}

function TypingCursor() {
  return <span className="chat-typing-cursor" />;
}

export function ChatPopup({ isOpen, onClose, onLoginRequest, side = 'right' }: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessageUI[]>([]);
  const [aiMode, setAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  }, [chatHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [newMessage]);

  const simulateThinking = async (userMsg: string): Promise<ChatMessageUI> => {
    const thinkSteps = [
      'Memahami maksud pertanyaan...',
      'Mengecek data dari database...',
      'Menyusun kerangka jawaban...',
    ];

    const msgId = Date.now().toString();
    const msg: ChatMessageUI = {
      id: msgId,
      type: 'ai',
      content: '',
      thinking: [],
      sources: [],
      status: 'thinking',
    };

    // Animate thinking steps
    for (let i = 0; i < thinkSteps.length; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
      setChatHistory(prev => {
        const updated = prev.map(m => m.id === msgId ? { ...m, thinking: [...(m.thinking || []), thinkSteps[i]] } : m);
        return updated;
      });
    }

    // Fetch from API
    setChatHistory(prev => [...prev, msg]);

    const allAiMessages = [...aiMessages, { role: 'user' as const, content: userMsg }];

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allAiMessages }),
      });
      const data = await res.json();

      setAiMessages([...allAiMessages, { role: 'assistant', content: data.message }]);

      // Simulate typing
      setChatHistory(prev => prev.map(m => m.id === msgId ? { ...m, status: 'typing', content: '' } : m));

      const fullText = data.message || 'No response';
      let typed = '';
      for (let i = 0; i < fullText.length; i++) {
        typed += fullText[i];
        setChatHistory(prev => prev.map(m => m.id === msgId ? { ...m, content: typed } : m));
        await new Promise(r => setTimeout(r, 10 + Math.random() * 15));
      }

      setChatHistory(prev => prev.map(m => m.id === msgId ? { ...m, status: 'done' } : m));
    } catch {
      setChatHistory(prev => prev.map(m => m.id === msgId ? { ...m, status: 'done', content: 'Error: Could not reach AI.' } : m));
    }

    return msg;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isGenerating) return;

    const userMsg = newMessage.trim();
    setNewMessage('');
    setIsGenerating(true);

    if (aiMode) {
      // Add user message
      setChatHistory(prev => [...prev, { id: Date.now().toString(), type: 'user', content: userMsg }]);

      // Simulate AI thinking and response
      await simulateThinking(userMsg);
    } else if (user) {
      await sendMessage(user.id, user.display_name || user.email || 'Anonymous', user.avatar_url, userMsg);
    }

    setIsGenerating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 z-[60] pointer-events-auto" />

          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={`fixed bottom-0 left-0 right-0 sm:bottom-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-[60] ${side === 'left' ? 'sm:left-4' : 'sm:right-4 sm:left-auto'}`}>

            <div className="chat-container">
              {/* Header */}
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className={`chat-header-avatar ${aiMode ? 'ai' : ''}`}>
                    {aiMode ? '✦' : 'R'}
                  </div>
                  <div>
                    <h3 className="chat-header-title">{aiMode ? 'AI Assistant' : 'Revy Chat'}</h3>
                    <p className="chat-header-sub">{aiMode ? 'Powered by NVIDIA' : 'Global chat'}</p>
                  </div>
                </div>
                <button onClick={onClose} className="chat-close-btn">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {chatHistory.length === 0 && !isGenerating && (
                  <div className="chat-greeting">
                    <h2>Ada yang bisa dibantu?</h2>
                    <p>Tanya apa saja tentang Revy</p>
                  </div>
                )}

                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`chat-msg ${msg.type}`}>
                    {msg.type === 'user' ? (
                      <div className="chat-user-bubble">{msg.content}</div>
                    ) : (
                      <div className="chat-ai-col">
                        {/* Thinking block */}
                        {msg.thinking && msg.thinking.length > 0 && (
                          <ThinkingBlock
                            steps={msg.thinking}
                            isOpen={msg.status !== 'done'}
                            onToggle={() => {}}
                            status={msg.status === 'thinking' ? 'thinking' : msg.status === 'typing' ? 'Mengetik...' : 'Berpikir selesai'}
                          />
                        )}

                        {/* Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="chat-sources">
                            {msg.sources.map((s, i) => (
                              <SourcePill key={i} name={s.name} />
                            ))}
                          </div>
                        )}

                        {/* AI text */}
                        {msg.status !== 'thinking' && (
                          <div className="chat-ai-text">
                            {msg.status === 'typing' ? (
                              <div>
                                <Markdown>{msg.content}</Markdown>
                                <TypingCursor />
                              </div>
                            ) : (
                              <Markdown>{msg.content}</Markdown>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {msg.status === 'done' && msg.content && (
                          <div className="chat-msg-actions">
                            <button onClick={() => copyMessage(msg.content)} title="Salin">
                              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Regular messages for non-AI mode */}
                {!aiMode && messages.map((msg) => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`chat-msg ${isOwn ? 'user' : 'ai'}`}>
                      {isOwn ? (
                        <div className="chat-user-bubble">{msg.message}</div>
                      ) : (
                        <div className="chat-ai-col">
                          <div className="chat-ai-text">{msg.message}</div>
                          {(isOwn || user?.is_admin) && (
                            <button onClick={() => { if (user?.is_admin) deleteMessageAdmin(msg.id); else if (user?.id) deleteMessage(msg.id, user.id); }}
                              className="chat-delete-btn">delete</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-composer-wrap">
                <div className="chat-composer">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={aiMode ? "Tanya apa saja..." : "Type a message..."}
                    rows={1}
                    disabled={isGenerating}
                    className="chat-textarea"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isGenerating}
                    className={`chat-send-btn ${newMessage.trim() && !isGenerating ? 'ready' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 12l16-8-6 8 6 8z" fill="currentColor"/></svg>
                  </button>
                </div>
                {!aiMode && (
                  <p className="chat-disclaimer">Ctrl+Alt+A+I untuk AI mode</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}