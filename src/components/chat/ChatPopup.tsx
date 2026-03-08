import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, LogIn, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMessages, sendMessage, subscribeToMessages, deleteMessage, type ChatMessage } from '@/lib/supabase';
import { bottomSheetContent, modalBackdrop, SPRING_BOUNCY, SPRING_SNAPPY, SPRING_DEFAULT } from '@/lib/motion-presets';
import { M3LinearProgressIndicator } from '@/components/shared/M3LinearProgressIndicator';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginRequest: () => void;
}

export function ChatPopup({ isOpen, onClose, onLoginRequest }: ChatPopupProps) {
  const { user } = useAuth();
  const isSignedIn = !!user;

  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user?.email || 'Anonymous';
  
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.first_name || user?.email || 'U')}&background=random`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages on mount
  useEffect(() => {
    if (isOpen) {
      fetchMessages().then(setMessages);
    }
  }, [isOpen]);

  // Subscribe to new messages
  useEffect(() => {
    if (!isOpen) return;

    const subscription = subscribeToMessages(
      (message) => {
        setMessages((prev) => [...prev, message]);
      },
      (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !isSignedIn || !user) return;

    setIsLoading(true);
    const success = await sendMessage(
      user.id,
      fullName,
      avatarUrl,
      newMessage
    );

    if (success) {
      setNewMessage('');
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet Chat */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-50"
          >
            <div className="bg-surface dark:bg-surface rounded-t-[28px] sm:rounded-[28px] shadow-elevation-5 border border-outline/20 overflow-hidden noise-grain">
              {/* Drag Handle */}
              <div className="pt-3 pb-0">
                <div className="sheet-handle" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-title-sm">Global Chat</h3>
                    <p className="text-label-sm text-muted-foreground">
                      {messages.length} messages
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING_SNAPPY}
                  className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {!isSignedIn ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mb-4">
                      <LogIn className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4 text-body-md">
                      Sign in to join the conversation
                    </p>
                    <motion.button 
                      onClick={() => {
                        onClose();
                        onLoginRequest();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_BOUNCY}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-full"
                    >
                      Sign In
                    </motion.button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground text-body-md">
                      No messages yet. Be the first to say hello!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, height: 0 }}
                        transition={SPRING_DEFAULT}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <img
                          src={msg.user_image || '/default-avatar.png'}
                          alt={msg.user_name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                            <p className="text-label-sm text-muted-foreground">
                              {msg.user_name}
                            </p>
                            {isOwn && (
                              <motion.button
                                onClick={() => {
                                  if (user?.id) {
                                    deleteMessage(msg.id, user.id);
                                  }
                                }}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                                className="text-muted-foreground/50 hover:text-error transition-colors p-1"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </motion.button>
                            )}
                          </div>
                          <div
                            className={`inline-block px-4 py-2.5 text-body-sm ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                                : 'bg-surface-variant text-foreground rounded-2xl rounded-bl-md'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isSignedIn && (
                <div className="border-t border-outline/20 relative">
                  {/* M3 Disjoint Loading Indicator for message sending */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-0 left-0 right-0 -mt-1 z-10"
                      >
                        <M3LinearProgressIndicator color="primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="p-4 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-surface-variant border border-outline/30 rounded-full text-body-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    <motion.button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || isLoading}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      transition={SPRING_BOUNCY}
                      className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
