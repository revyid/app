import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMessages, sendMessage, subscribeToMessages, deleteMessage, type ChatMessage } from '@/lib/supabase';
import { bottomSheetContent, modalBackdrop, SPRING_DEFAULT } from '@/lib/motion-presets';
import { M3LinearProgressIndicator } from '@/components/shared/M3LinearProgressIndicator';
import { Button, IconButton } from '@/components/ui/button';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginRequest: () => void;
}

export function ChatPopup({ isOpen, onClose, onLoginRequest }: ChatPopupProps) {
  const { user } = useAuth();
  const isSignedIn = !!user;

  const fullName = user?.display_name || user?.email || 'Anonymous';
  
  const avatarUrl = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.email || 'U')}&background=random`;
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
                <IconButton
                  onClick={onClose}
                  variant="ghost"
                  className="rounded-full bg-surface-variant hover:bg-surface-variant/80"
                >
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
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
                              <IconButton
                                onClick={() => {
                                  if (user?.id) {
                                    deleteMessage(msg.id, user.id);
                                  }
                                }}
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground/50 hover:text-error h-6 w-6"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </IconButton>
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
              <div className="border-t border-outline/20 relative">
                {!isSignedIn ? (
                  <div className="p-4 flex items-center justify-between bg-surface-variant/30">
                    <p className="text-body-sm text-muted-foreground mr-4">Sign in to join the conversation</p>
                    <Button 
                      onClick={() => {
                        onClose();
                        onLoginRequest();
                      }}
                      size="sm"
                      className="rounded-full flex-shrink-0"
                    >
                      Sign In
                    </Button>
                  </div>
                ) : (
                  <>
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
                      <IconButton
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isLoading}
                        variant="filled"
                        className="rounded-full w-12 h-12"
                      >
                        <Send className="w-5 h-5 ml-1" />
                      </IconButton>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
