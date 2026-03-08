import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ==========================================
// Auto-discover all theme files from src/themes/
// Vite's import.meta.glob resolves at build time — no manual imports needed.
// Just drop a new .json file in src/themes/ and it appears automatically.
// ==========================================
const themeModules = import.meta.glob('@/themes/*.json', { eager: true }) as Record<string, { default: any }>;

// ==========================================
// HEX → HSL Utility
// ==========================================

function hexToHsl(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length == 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length == 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max == min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ==========================================
// M3 Color Token Mapping
// ==========================================

const colorMapping: Record<string, string[]> = {
  primary: ['primary', 'ring'],
  onPrimary: ['primary-foreground'],
  primaryContainer: ['primary-container'],
  onPrimaryContainer: ['primary-container-foreground'],
  secondary: ['secondary'],
  onSecondary: ['secondary-foreground'],
  secondaryContainer: ['secondary-container'],
  onSecondaryContainer: ['secondary-container-foreground'],
  tertiary: ['tertiary', 'accent'],
  onTertiary: ['tertiary-foreground', 'accent-foreground'],
  tertiaryContainer: ['tertiary-container'],
  onTertiaryContainer: ['tertiary-container-foreground'],
  surface: ['surface', 'card', 'popover'],
  onSurface: ['surface-foreground', 'card-foreground', 'popover-foreground'],
  surfaceVariant: ['surface-variant', 'input', 'muted'],
  onSurfaceVariant: ['surface-variant-foreground', 'muted-foreground'],
  surfaceTint: ['surface-tint'],
  surfaceDim: ['surface-dim'],
  surfaceBright: ['surface-bright'],
  surfaceContainerLowest: ['surface-container-lowest'],
  surfaceContainerLow: ['surface-container-low'],
  surfaceContainer: ['surface-container'],
  surfaceContainerHigh: ['surface-container-high'],
  surfaceContainerHighest: ['surface-container-highest'],
  background: ['background'],
  onBackground: ['foreground'],
  error: ['error', 'destructive'],
  onError: ['error-foreground', 'destructive-foreground'],
  errorContainer: ['error-container'],
  onErrorContainer: ['error-container-foreground'],
  outline: ['outline', 'border'],
  outlineVariant: ['outline-variant'],
};

// ==========================================
// Theme Profile Types
// ==========================================

export interface ThemeColorProfile {
  id: string;
  name: string;
  description?: string;
  seed: string;
  schemes: {
    light: Record<string, string>;
    dark: Record<string, string>;
    [key: string]: Record<string, string>;
  };
  palettes?: Record<string, Record<string, string>>;
}

type ThemeMode = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  colorProfileId: string;
  setColorProfile: (id: string) => void;
  availableProfiles: ThemeColorProfile[];
  addColorProfile: (profile: ThemeColorProfile) => void;
  currentProfile: ThemeColorProfile;
}

// ==========================================
// Auto-build profiles from discovered themes
// ==========================================

function buildProfilesFromGlob(): ThemeColorProfile[] {
  const profiles: ThemeColorProfile[] = [];

  for (const [path, mod] of Object.entries(themeModules)) {
    const data = (mod as any).default || mod;
    // Derive a stable ID from the filename: /src/themes/material-theme.json → material-theme
    const filename = path.split('/').pop()?.replace('.json', '') || 'unknown';

    profiles.push({
      id: filename,
      name: data.name || filename.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: data.description || '',
      seed: data.seed || '#000000',
      schemes: {
        light: data.schemes?.light || {},
        dark: data.schemes?.dark || {},
      },
      palettes: data.palettes,
    });
  }

  // Sort: put the default theme first
  profiles.sort((a, b) => {
    if (a.id === 'material-theme') return -1;
    if (b.id === 'material-theme') return 1;
    return a.name.localeCompare(b.name);
  });

  return profiles;
}

const builtinProfiles = buildProfilesFromGlob();
const defaultProfile = builtinProfiles[0] || {
  id: 'fallback',
  name: 'Default',
  seed: '#6750A4',
  schemes: { light: {}, dark: {} },
};

// ==========================================
// Context & Provider
// ==========================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme') as ThemeMode) || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');

  // Merge builtin profiles with any user-added profiles from localStorage
  const [profiles, setProfiles] = useState<ThemeColorProfile[]>(() => {
    try {
      const stored = localStorage.getItem('themeProfiles');
      if (stored) {
        const userProfiles = JSON.parse(stored) as ThemeColorProfile[];
        // Merge: builtins first, then user additions that don't conflict
        const builtinIds = new Set(builtinProfiles.map(p => p.id));
        const extras = userProfiles.filter(p => !builtinIds.has(p.id));
        return [...builtinProfiles, ...extras];
      }
    } catch { /* ignore */ }
    return builtinProfiles;
  });

  const [colorProfileId, setColorProfileIdState] = useState<string>(() => {
    return localStorage.getItem('colorProfileId') || defaultProfile.id;
  });

  const currentProfile = profiles.find(p => p.id === colorProfileId) || defaultProfile;

  // Apply theme colors to :root
  const applyColors = useCallback((activeTheme: EffectiveTheme, profile: ThemeColorProfile) => {
    const root = window.document.documentElement;
    const scheme = activeTheme === 'dark' ? profile.schemes.dark : profile.schemes.light;

    Object.entries(colorMapping).forEach(([jsonKey, cssKeys]) => {
      const hex = scheme[jsonKey as keyof typeof scheme];
      if (hex) {
        const hsl = hexToHsl(hex);
        cssKeys.forEach(cssKey => {
          root.style.setProperty(`--${cssKey}`, hsl);
        });
      }
    });
  }, []);

  // Main effect: apply theme mode + color profile
  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t: ThemeMode) => {
      const active: EffectiveTheme = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t as EffectiveTheme;

      setEffectiveTheme(active);
      root.classList.remove('light', 'dark');
      root.classList.add(active);

      applyColors(active, currentProfile);
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme, currentProfile, applyColors]);

  // Persist user-added profiles (not builtins) to localStorage
  useEffect(() => {
    const builtinIds = new Set(builtinProfiles.map(p => p.id));
    const userOnly = profiles.filter(p => !builtinIds.has(p.id));
    localStorage.setItem('themeProfiles', JSON.stringify(userOnly));
  }, [profiles]);

  const setColorProfile = useCallback((id: string) => {
    setColorProfileIdState(id);
    localStorage.setItem('colorProfileId', id);
  }, []);

  const addColorProfile = useCallback((profile: ThemeColorProfile) => {
    setProfiles(prev => {
      const existing = prev.findIndex(p => p.id === profile.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = profile;
        return updated;
      }
      return [...prev, profile];
    });
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
      }
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      effectiveTheme,
      setTheme: setThemeState,
      toggleTheme,
      colorProfileId,
      setColorProfile,
      availableProfiles: profiles,
      addColorProfile,
      currentProfile,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
