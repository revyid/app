import { useState, useEffect } from 'react';
import { Palette, Save, Upload, Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { upsertTheme, deleteTheme } from '@/lib/auth';
import { Button, IconButton } from '@/components/ui/button';

// Material Design 3 color generation utilities
function generateM3Theme(seedColor: string) {
  // Simple color generation - in a real app, use Material Design 3 algorithm
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const adjustBrightness = (hex: string, factor: number) => {
    const { r, g, b } = hexToRgb(hex);
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
    return rgbToHex(newR, newG, newB);
  };

  // const seedRgb = hexToRgb(seedColor);
  // const isDark = (seedRgb.r + seedRgb.g + seedRgb.b) / 3 < 128;

  // Generate light scheme
  const lightScheme = {
    primary: seedColor,
    surfaceTint: seedColor,
    onPrimary: '#FFFFFF',
    primaryContainer: adjustBrightness(seedColor, 0.9),
    onPrimaryContainer: adjustBrightness(seedColor, 0.3),
    secondary: adjustBrightness(seedColor, 0.7),
    onSecondary: '#FFFFFF',
    secondaryContainer: adjustBrightness(seedColor, 0.85),
    onSecondaryContainer: adjustBrightness(seedColor, 0.4),
    tertiary: adjustBrightness(seedColor, 0.6),
    onTertiary: '#FFFFFF',
    tertiaryContainer: adjustBrightness(seedColor, 0.8),
    onTertiaryContainer: adjustBrightness(seedColor, 0.35),
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
    inversePrimary: adjustBrightness(seedColor, 1.2),
  };

  // Generate dark scheme
  const darkScheme = {
    primary: adjustBrightness(seedColor, 1.3),
    surfaceTint: adjustBrightness(seedColor, 1.3),
    onPrimary: adjustBrightness(seedColor, 0.3),
    primaryContainer: adjustBrightness(seedColor, 0.4),
    onPrimaryContainer: adjustBrightness(seedColor, 1.2),
    secondary: adjustBrightness(seedColor, 1.1),
    onSecondary: adjustBrightness(seedColor, 0.4),
    secondaryContainer: adjustBrightness(seedColor, 0.5),
    onSecondaryContainer: adjustBrightness(seedColor, 1.1),
    tertiary: adjustBrightness(seedColor, 1),
    onTertiary: adjustBrightness(seedColor, 0.45),
    tertiaryContainer: adjustBrightness(seedColor, 0.55),
    onTertiaryContainer: adjustBrightness(seedColor, 1),
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
    inversePrimary: seedColor,
  };

  return { light: lightScheme, dark: darkScheme };
}

export function ThemeBuilder() {
  const { availableProfiles, setColorProfile, colorProfileId } = useTheme();
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [seedColor, setSeedColor] = useState('#6750A4');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [saving, setSaving] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Generate preview theme
  const previewTheme = generateM3Theme(seedColor);

  // Apply preview colors
  useEffect(() => {
    const root = document.documentElement;
    const scheme = previewMode === 'dark' ? previewTheme.dark : previewTheme.light;

    Object.entries(scheme).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--preview-${cssVar}`, value);
    });

    return () => {
      Object.keys(previewTheme.light).forEach(key => {
        const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.removeProperty(`--preview-${cssVar}`);
      });
    };
  }, [seedColor, previewMode, previewTheme]);

  const handleSaveTheme = async () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    setSaving(true);
    try {
      const themeData = {
        name: themeName,
        description: themeDescription,
        seed_color: seedColor,
        light_scheme: previewTheme.light,
        dark_scheme: previewTheme.dark,
        is_public: true
      };

      const result = await upsertTheme(themeData);
      
      if (result.error) {
        alert(`Failed to save theme: ${result.error}`);
      } else {
        alert('Theme saved successfully!');
        setThemeName('');
        setThemeDescription('');
        setSeedColor('#6750A4');
      }
    } catch (error) {
      alert('Failed to save theme');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleImportTheme = () => {
    try {
      const themeJson = JSON.parse(importJson);
      if (!themeJson.name || !themeJson.seed || !themeJson.schemes?.light || !themeJson.schemes?.dark) {
        throw new Error('Invalid theme JSON format');
      }

      setThemeName(themeJson.name);
      setThemeDescription(themeJson.description || '');
      setSeedColor(themeJson.seed);
      setShowImport(false);
      setImportJson('');
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const handleExportTheme = () => {
    const themeData = {
      name: themeName || 'Custom Theme',
      description: themeDescription,
      seed: seedColor,
      schemes: previewTheme
    };

    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName || 'theme'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;
    
    try {
      const result = await deleteTheme(themeId);
      if (result.error) {
        alert(`Failed to delete theme: ${result.error}`);
      } else {
        alert('Theme deleted successfully');
      }
    } catch (error) {
      alert('Failed to delete theme');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Theme Builder</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" size="sm" onClick={() => setShowImport(!showImport)}>
            {showImport ? <EyeOff className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {showImport ? 'Hide Import' : 'Import'}
          </Button>
          <Button variant="outlined" size="sm" onClick={handleExportTheme} disabled={!themeName}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {showImport && (
        <div className="p-4 border border-border rounded-lg bg-surface-variant/50">
          <h4 className="text-sm font-medium mb-2">Import Theme JSON</h4>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste theme JSON here..."
            className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-mono"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleImportTheme}>Import</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Theme configuration */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Theme Name</label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="My Awesome Theme"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={themeDescription}
              onChange={(e) => setThemeDescription(e.target.value)}
              placeholder="Describe your theme..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Seed Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={seedColor}
                onChange={(e) => setSeedColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={seedColor}
                onChange={(e) => setSeedColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={previewMode === 'light' ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => setPreviewMode('light')}
            >
              Light Preview
            </Button>
            <Button
              variant={previewMode === 'dark' ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => setPreviewMode('dark')}
            >
              Dark Preview
            </Button>
          </div>

          <Button
            onClick={handleSaveTheme}
            disabled={saving || !themeName.trim()}
            className="w-full gap-2"
          >
            {saving ? 'Saving...' : 'Save Theme'}
            <Save className="w-4 h-4" />
          </Button>
        </div>

        {/* Right column: Theme preview */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Live Preview</div>
          <div className={`p-6 rounded-2xl border border-outline/20 ${previewMode === 'dark' ? 'bg-[--preview-background]' : 'bg-[--preview-background]'}`}>
            <div className="space-y-4">
              {/* Primary colors */}
              <div className="flex gap-2">
                <div 
                  className="flex-1 h-12 rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: `var(--preview-primary)`, color: `var(--preview-on-primary)` }}
                >
                  Primary
                </div>
                <div 
                  className="flex-1 h-12 rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: `var(--preview-primary-container)`, color: `var(--preview-on-primary-container)` }}
                >
                  Container
                </div>
              </div>

              {/* Surface colors */}
              <div className="flex gap-2">
                <div 
                  className="flex-1 h-10 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `var(--preview-surface)`, color: `var(--preview-on-surface)` }}
                >
                  Surface
                </div>
                <div 
                  className="flex-1 h-10 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `var(--preview-surface-variant)`, color: `var(--preview-on-surface-variant)` }}
                >
                  Variant
                </div>
              </div>

              {/* Button examples */}
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: `var(--preview-primary)`, color: `var(--preview-on-primary)` }}
                >
                  Primary Button
                </button>
                <button 
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border"
                  style={{ 
                    borderColor: `var(--preview-outline)`,
                    color: `var(--preview-on-surface)`
                  }}
                >
                  Outline Button
                </button>
              </div>

              {/* Text examples */}
              <div className="space-y-2">
                <div style={{ color: `var(--preview-on-surface)` }} className="text-sm">
                  Sample text in on-surface color
                </div>
                <div style={{ color: `var(--preview-on-surface-variant)` }} className="text-sm">
                  Sample text in on-surface-variant color
                </div>
              </div>
            </div>
          </div>

          {/* Available themes */}
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Available Themes</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableProfiles.map((theme) => (
                <div
                  key={theme.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${colorProfileId === theme.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: theme.seed }}
                    />
                    <div>
                      <div className="text-sm font-medium">{theme.name}</div>
                      {theme.description && (
                        <div className="text-xs text-muted-foreground">{theme.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setColorProfile(theme.id)}
                      title="Apply theme"
                    >
                      <Eye className="w-4 h-4" />
                    </IconButton>
                    {theme.id !== 'default' && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTheme(theme.id)}
                        title="Delete theme"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </IconButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}