import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getThemes } from '@/lib/auth';
import { generateId } from '@/lib/utils';

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

// Default fallback theme
const defaultProfile: ThemeColorProfile = {
  id: 'default',
  name: 'Default',
  seed: '#6750A4',
  schemes: {
    light: {
      primary: '#4A5C92',
      surfaceTint: '#4A5C92',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DBE1FF',
      onPrimaryContainer: '#324478',
      secondary: '#585E72',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#DDE1F9',
      onSecondaryContainer: '#414659',
      tertiary: '#745471',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#FFD6F8',
      onTertiaryContainer: '#5A3D58',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      errorContainer: '#FFDAD6',
      onErrorContainer: '#93000A',
      background: '#FAF8FF',
      onBackground: '#1A1B21',
      surface: '#FAF8FF',
      onSurface: '#1A1B21',
      surfaceVariant: '#E2E2EC',
      onSurfaceVariant: '#45464F',
      outline: '#757680',
      outlineVariant: '#C5C6D0',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#2F3036',
      inverseOnSurface: '#F1F0F7',
      inversePrimary: '#B4C5FF',
      primaryFixed: '#DBE1FF',
      onPrimaryFixed: '#00174A',
      primaryFixedDim: '#B4C5FF',
      onPrimaryFixedVariant: '#324478',
      secondaryFixed: '#DDE1F9',
      onSecondaryFixed: '#151B2C',
      secondaryFixedDim: '#C1C6DD',
      onSecondaryFixedVariant: '#414659',
      tertiaryFixed: '#FFD6F8',
      onTertiaryFixed: '#2B122B',
      tertiaryFixedDim: '#E5BADF',
      onTertiaryFixedVariant: '#5A3D58',
    },
    dark: {
      primary: '#B4C5FF',
      surfaceTint: '#B4C5FF',
      onPrimary: '#1A2C5C',
      primaryContainer: '#324478',
      onPrimaryContainer: '#DBE1FF',
      secondary: '#C1C6DD',
      onSecondary: '#2A3042',
      secondaryContainer: '#414659',
      onSecondaryContainer: '#DDE1F9',
      tertiary: '#E5BADF',
      onTertiary: '#422740',
      tertiaryContainer: '#5A3D58',
      onTertiaryContainer: '#FFD6F8',
      error: '#FFB4AB',
      onError: '#690005',
      errorContainer: '#93000A',
      onErrorContainer: '#FFDAD6',
      background: '#111318',
      onBackground: '#E3E2E9',
      surface: '#111318',
      onSurface: '#E3E2E9',
      surfaceVariant: '#45464F',
      onSurfaceVariant: '#C5C6D0',
      outline: '#8F909A',
      outlineVariant: '#45464F',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#E3E2E9',
      inverseOnSurface: '#2F3036',
      inversePrimary: '#4A5C92',
      primaryFixed: '#DBE1FF',
      onPrimaryFixed: '#00174A',
      primaryFixedDim: '#B4C5FF',
      onPrimaryFixedVariant: '#324478',
      secondaryFixed: '#DDE1F9',
      onSecondaryFixed: '#151B2C',
      secondaryFixedDim: '#C1C6DD',
      onSecondaryFixedVariant: '#414659',
      tertiaryFixed: '#FFD6F8',
      onTertiaryFixed: '#2B122B',
      tertiaryFixedDim: '#E5BADF',
      onTertiaryFixedVariant: '#5A3D58',
    }
  }
};

// ==========================================
// Context & Provider
// ==========================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as ThemeMode) || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');

  const [profiles, setProfiles] = useState<ThemeColorProfile[]>([defaultProfile]);

  // Load themes from DB + realtime subscription
  useEffect(() => {
    let channel: any;
    const loadThemes = async () => {
      try {
        const themes = await getThemes();
        const themeProfiles: ThemeColorProfile[] = themes.map(theme => {
          const parseScheme = (s: any): Record<string, string> => {
            if (typeof s === 'string') { try { return JSON.parse(s); } catch { return {}; } }
            return s || {};
          };
          return {
            id: theme.id || generateId(),
            name: theme.name,
            description: theme.description,
            seed: theme.seed_color,
            schemes: {
              light: parseScheme(theme.light_scheme),
              dark: parseScheme(theme.dark_scheme),
            }
          };
        });
        
        setProfiles([defaultProfile, ...themeProfiles]);

        // If selected theme was deleted, fallback to default
        const currentId = localStorage.getItem('colorProfileId') || defaultProfile.id;
        const exists = currentId === defaultProfile.id || themeProfiles.some(t => t.id === currentId);
        if (!exists) {
          localStorage.setItem('colorProfileId', defaultProfile.id);
          setColorProfileIdState(defaultProfile.id);
        }
      } catch (error) {
        console.error('Failed to load themes:', error);
      }
    };
    
    loadThemes();

    // Realtime: refetch when themes table changes
    import('@/lib/supabase').then(({ getSupabase }) => {
      getSupabase().then(client => {
        channel = client.channel('themes-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'themes' }, () => {
            loadThemes();
          })
          .subscribe();
      });
    });

    return () => { if (channel) import('@/lib/supabase').then(({ getSupabase }) => getSupabase().then(c => c.removeChannel(channel))); };
  }, []);

  const [colorProfileId, setColorProfileIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultProfile.id;
    return localStorage.getItem('colorProfileId') || defaultProfile.id;
  });

  const currentProfile = useMemo(
    () => profiles.find(p => p.id === colorProfileId) || defaultProfile,
    [profiles, colorProfileId]
  );

  // Apply theme colors to :root
  const applyColors = useCallback((activeTheme: EffectiveTheme, profile: ThemeColorProfile) => {
    const root = window.document.documentElement;
    const scheme = activeTheme === 'dark' ? profile.schemes.dark : profile.schemes.light;
    const vars: Record<string, string> = {};

    Object.entries(colorMapping).forEach(([jsonKey, cssKeys]) => {
      const hex = scheme[jsonKey as keyof typeof scheme];
      if (hex) {
        const hsl = hexToHsl(hex);
        cssKeys.forEach(cssKey => {
          root.style.setProperty(`--${cssKey}`, hsl);
          vars[cssKey] = hsl;
        });
      }
    });

    // Cache for next visit (so inline script can apply before React hydrates)
    try { localStorage.setItem('themeVars', JSON.stringify(vars)); } catch {}
  }, []);

  // Main effect: apply theme mode + color profile
  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t: ThemeMode) => {
      const active: EffectiveTheme = t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t as EffectiveTheme;

      setEffectiveTheme(active);

      // Only touch classList if not already correct (avoids fighting useModeAnimation)
      const root = window.document.documentElement;
      if (!root.classList.contains(active)) {
        root.classList.remove('light', 'dark');
        root.classList.add(active);
      }

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

  const setColorProfile = useCallback((id: string) => {
    setColorProfileIdState(id);
    localStorage.setItem('colorProfileId', id);
  }, []);

  const addColorProfile = useCallback(async (profile: ThemeColorProfile) => {
    try {
      const { upsertTheme } = await import('@/lib/auth');
      const result = await upsertTheme({
        id: profile.id !== 'default' ? profile.id : undefined,
        name: profile.name,
        description: profile.description,
        seed_color: profile.seed,
        light_scheme: profile.schemes.light,
        dark_scheme: profile.schemes.dark,
        is_public: true
      });
      
      if (result.error) {
        console.error('Failed to save theme:', result.error);
        return;
      }
      
      const savedProfile = {
        ...profile,
        id: result.id || profile.id
      };
      
      setProfiles(prev => {
        const existing = prev.findIndex(p => p.id === savedProfile.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedProfile;
          return updated;
        }
        return [...prev, savedProfile];
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
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
