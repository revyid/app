import { useEffect } from 'react';

export interface Shortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: () => void;
  enabled: boolean;
}

class ShortcutRegistry {
  private shortcuts: Map<string, Shortcut> = new Map();
  private isEnabled = true;

  register(shortcut: Shortcut) {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  unregister(id: string) {
    this.shortcuts.delete(id);
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.isEnabled) return;

    // Check for Ctrl+Alt+Key combinations
    if (event.ctrlKey && event.altKey) {
      const key = event.key.toLowerCase();
      
      for (const shortcut of this.shortcuts.values()) {
        if (shortcut.enabled && shortcut.keys.includes(key)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    }

    // Check for Ctrl+K (Command Palette)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      const cmdPalette = this.shortcuts.get('command-palette');
      if (cmdPalette?.enabled) {
        cmdPalette.action();
      }
    }

    // Check for Escape
    if (event.key === 'Escape') {
      const escape = this.shortcuts.get('escape');
      if (escape?.enabled) {
        escape.action();
      }
    }
  }
}

// Global instance
export const shortcutRegistry = new ShortcutRegistry();

// Hook to use shortcuts in components
export function useKeyboardShortcuts(shortcuts: Shortcut[], dependencies: any[] = []) {
  useEffect(() => {
    shortcuts.forEach(shortcut => {
      shortcutRegistry.register(shortcut);
    });

    return () => {
      shortcuts.forEach(shortcut => {
        shortcutRegistry.unregister(shortcut.id);
      });
    };
  }, dependencies);
}

// Default shortcuts
export const defaultShortcuts: Shortcut[] = [
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    keys: ['k'],
    action: () => {
      // This will be set by the App component
      const event = new CustomEvent('open-command-palette');
      window.dispatchEvent(event);
    },
    enabled: true
  },
  {
    id: 'theme-switcher',
    name: 'Theme Switcher',
    description: 'Open theme selector',
    keys: ['t'],
    action: () => {
      const event = new CustomEvent('open-theme-selector');
      window.dispatchEvent(event);
    },
    enabled: true
  },
  {
    id: 'dark-mode-toggle',
    name: 'Dark Mode Toggle',
    description: 'Toggle dark/light mode',
    keys: ['d'],
    action: () => {
      const event = new CustomEvent('toggle-theme');
      window.dispatchEvent(event);
    },
    enabled: true
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Scroll to projects section',
    keys: ['p'],
    action: () => {
      const element = document.getElementById('projects');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    },
    enabled: true
  },
  {
    id: 'admin-panel',
    name: 'Admin Panel',
    description: 'Open admin panel',
    keys: ['a'],
    action: () => {
      const event = new CustomEvent('open-admin-panel');
      window.dispatchEvent(event);
    },
    enabled: true
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Open chat',
    keys: ['c'],
    action: () => {
      const event = new CustomEvent('open-chat');
      window.dispatchEvent(event);
    },
    enabled: true
  },
  {
    id: 'shortcut-help',
    name: 'Shortcut Help',
    description: 'Show keyboard shortcuts',
    keys: ['?', '/'],
    action: () => {
      const event = new CustomEvent('show-shortcut-help');
      window.dispatchEvent(event);
    },
    enabled: true
  },
  {
    id: 'escape',
    name: 'Escape',
    description: 'Close all modals',
    keys: ['escape'],
    action: () => {
      const event = new CustomEvent('close-all-modals');
      window.dispatchEvent(event);
    },
    enabled: true
  }
];

// Initialize global keyboard listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    shortcutRegistry.handleKeyDown(event);
  });
}