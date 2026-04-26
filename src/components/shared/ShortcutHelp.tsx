import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { defaultShortcuts } from '@/lib/keyboard-shortcuts';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      if (key === 'escape') return 'Esc';
      if (key === '?') return '?';
      if (key === '/') return '/';
      return `Ctrl+Alt+${key.toUpperCase()}`;
    }).join(' or ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative w-full max-w-md bg-surface/98 backdrop-blur-[60px] rounded-[24px] border border-outline/20 shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-outline/10">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              </div>
              <IconButton variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </IconButton>
            </div>
            
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {defaultShortcuts.filter(s => s.id !== 'escape').map((shortcut) => (
                <div key={shortcut.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{shortcut.name}</div>
                    <div className="text-xs text-muted-foreground">{shortcut.description}</div>
                  </div>
                  <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {formatKeys(shortcut.keys)}
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-outline/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Close Modals</div>
                    <div className="text-xs text-muted-foreground">Close all open modals</div>
                  </div>
                  <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    Esc
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}