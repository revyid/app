import { useState, useEffect, useMemo } from 'react';
import { Palette, Save, Upload, Download, Trash2, Shuffle, Sun, Moon } from 'lucide-react';
import { argbFromHex, hexFromArgb, DynamicScheme, Variant, Hct } from '@material/material-color-utilities';
import { useThemeStore } from '@/stores/theme-store';
import { upsertTheme, deleteTheme } from '@/lib/auth';
import { Button, IconButton } from '@/components/ui/button';

// M3 color role keys
const COLOR_ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'surface', 'onSurface', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'surfaceVariant', 'onSurfaceVariant',
  'outline', 'outlineVariant',
  'background', 'onBackground',
  'inverseSurface', 'inverseOnSurface', 'inversePrimary',
  'shadow', 'scrim',
] as const;

type ColorRole = (typeof COLOR_ROLES)[number];

function schemeToHex(scheme: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const role of COLOR_ROLES) {
    try {
      const val = scheme[role];
      if (typeof val === 'number' && val !== 0) {
        result[role] = hexFromArgb(val);
      } else if (typeof val === 'string' && val.startsWith('#')) {
        result[role] = val;
      }
    } catch {}
  }
  return result;
}

const PRESET_COLORS = [
  '#6750A4', '#006A6A', '#984061', '#2D6A4F', '#BA1A1A',
  '#0061A4', '#7D5260', '#3F51B5', '#FF6F00', '#1B5E20',
];

export function ThemeBuilder() {
  const availableProfiles = useThemeStore((s) => s.availableProfiles);
  const setColorProfile = useThemeStore((s) => s.setColorProfile);
  const colorProfileId = useThemeStore((s) => s.colorProfileId);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [seedColor, setSeedColor] = useState('#6750A4');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [saving, setSaving] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Generate theme from seed using material-color-utilities
  const theme = useMemo(() => {
    try {
      const argb = argbFromHex(seedColor);
      const hct = Hct.fromInt(argb);
      const lightScheme = new DynamicScheme({ sourceColorHct: hct, variant: Variant.TONAL_SPOT, contrastLevel: 0, isDark: false });
      const darkScheme = new DynamicScheme({ sourceColorHct: hct, variant: Variant.TONAL_SPOT, contrastLevel: 0, isDark: true });
      return { light: schemeToHex(lightScheme), dark: schemeToHex(darkScheme) };
    } catch {
      return { light: {} as Record<string, string>, dark: {} as Record<string, string> };
    }
  }, [seedColor]);

  const currentScheme = previewMode === 'dark' ? theme.dark : theme.light;

  const handleSaveTheme = async () => {
    if (!themeName.trim()) return;
    setSaving(true);
    try {
      const result = await upsertTheme({
        name: themeName,
        description: themeDescription,
        seed_color: seedColor,
        light_scheme: theme.light,
        dark_scheme: theme.dark,
        is_public: true,
      });
      if (result.error) alert(`Failed: ${result.error}`);
      else { alert('Theme saved!'); setThemeName(''); setThemeDescription(''); }
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  const handleImportTheme = () => {
    try {
      const json = JSON.parse(importJson);
      if (!json.name || !json.seed) throw new Error('Invalid');
      setThemeName(json.name);
      setThemeDescription(json.description || '');
      setSeedColor(json.seed);
      setShowImport(false);
      setImportJson('');
    } catch { alert('Invalid JSON'); }
  };

  const handleExportTheme = () => {
    const data = { name: themeName || 'Custom Theme', description: themeDescription, seed: seedColor, schemes: theme };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${themeName || 'theme'}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteTheme = async (id: string) => {
    if (!confirm('Delete this theme?')) return;
    const r = await deleteTheme(id);
    if (r.error) alert(r.error);
  };

  const randomizeColor = () => {
    setSeedColor('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
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
            <Upload className="w-4 h-4" /> {showImport ? 'Cancel' : 'Import'}
          </Button>
          <Button variant="outlined" size="sm" onClick={handleExportTheme} disabled={!themeName}>
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {showImport && (
        <div className="p-4 border border-outline/20 rounded-xl bg-surface-variant/50 space-y-2">
          <textarea value={importJson} onChange={e => setImportJson(e.target.value)}
            placeholder="Paste theme JSON..." className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-outline/20 bg-background text-foreground font-mono" />
          <Button size="sm" onClick={handleImportTheme}>Import</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="space-y-4">
          <div>
            <label className="block text-label-sm font-medium text-muted-foreground mb-1.5">Theme Name</label>
            <input type="text" value={themeName} onChange={e => setThemeName(e.target.value)}
              placeholder="My Theme" className="w-full px-3 py-2.5 rounded-xl border border-outline/20 bg-background text-foreground text-sm" />
          </div>
          <div>
            <label className="block text-label-sm font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea value={themeDescription} onChange={e => setThemeDescription(e.target.value)}
              placeholder="Optional description..." rows={2} className="w-full px-3 py-2.5 rounded-xl border border-outline/20 bg-background text-foreground text-sm" />
          </div>

          {/* Seed color */}
          <div>
            <label className="block text-label-sm font-medium text-muted-foreground mb-1.5">Seed Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={seedColor} onChange={e => setSeedColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border border-outline/20" />
              <input type="text" value={seedColor} onChange={e => setSeedColor(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-outline/20 bg-background text-foreground font-mono text-sm" />
              <IconButton variant="ghost" size="sm" onClick={randomizeColor} title="Randomize">
                <Shuffle className="w-4 h-4" />
              </IconButton>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setSeedColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${seedColor === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button variant={previewMode === 'light' ? 'filled' : 'outlined'} size="sm" onClick={() => setPreviewMode('light')}>
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button variant={previewMode === 'dark' ? 'filled' : 'outlined'} size="sm" onClick={() => setPreviewMode('dark')}>
              <Moon className="w-4 h-4" /> Dark
            </Button>
          </div>

          <Button onClick={handleSaveTheme} disabled={saving || !themeName.trim()} className="w-full gap-2">
            {saving ? 'Saving...' : 'Save Theme'} <Save className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="text-label-sm font-medium text-muted-foreground">Live Preview</div>
          <div className="rounded-2xl overflow-hidden border border-outline/10" style={{ backgroundColor: currentScheme.background || '#fff' }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: currentScheme.surfaceContainer || '#f5f5f5' }}>
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: currentScheme.primary }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: currentScheme.onSurface }}>App Title</div>
                <div className="text-xs" style={{ color: currentScheme.onSurfaceVariant }}>Subtitle text</div>
              </div>
            </div>
            {/* Body */}
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: currentScheme.primary, color: currentScheme.onPrimary }}>Primary</div>
                <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: currentScheme.secondaryContainer, color: currentScheme.onSecondaryContainer }}>Secondary</div>
                <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: currentScheme.tertiaryContainer, color: currentScheme.onTertiaryContainer }}>Tertiary</div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-medium border"
                  style={{ borderColor: currentScheme.outline, color: currentScheme.onSurface }}>Outlined</div>
                <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: currentScheme.errorContainer, color: currentScheme.onErrorContainer }}>Error</div>
              </div>
              <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: currentScheme.surfaceContainerHigh, color: currentScheme.onSurface }}>
                Card content with surface-container-high background.
              </div>
              <div className="flex gap-2">
                {COLOR_ROLES.slice(0, 8).map(role => (
                  <div key={role} className="flex-1 aspect-square rounded-lg border border-outline/10" style={{ backgroundColor: currentScheme[role] || '#ccc' }} title={role} />
                ))}
              </div>
            </div>
          </div>

          {/* Color palette strip */}
          <div className="space-y-2">
            <div className="text-label-sm font-medium text-muted-foreground">Color Palette</div>
            <div className="flex gap-1 h-8 rounded-xl overflow-hidden">
              {['primary', 'secondary', 'tertiary', 'error', 'surface', 'outline'].map(key => (
                <div key={key} className="flex-1 relative group cursor-default" style={{ backgroundColor: currentScheme[key] || '#ccc' }}>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: currentScheme[`on${key.charAt(0).toUpperCase() + key.slice(1)}` as ColorRole] || currentScheme.onSurface }}>
                    {key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Available themes */}
          <div className="space-y-2">
            <div className="text-label-sm font-medium text-muted-foreground">Saved Themes</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {availableProfiles.map(t => (
                <div key={t.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${colorProfileId === t.id ? 'border-primary bg-primary/5' : 'border-outline/10 hover:bg-surface-variant/30'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full border border-outline/20" style={{ backgroundColor: t.seed }} />
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <IconButton variant="ghost" size="sm" onClick={() => setColorProfile(t.id)} title="Apply">
                      <Sun className="w-3.5 h-3.5" />
                    </IconButton>
                    {t.id !== 'default' && (
                      <IconButton variant="ghost" size="sm" onClick={() => handleDeleteTheme(t.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-error" />
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
