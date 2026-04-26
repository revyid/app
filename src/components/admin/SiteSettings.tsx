import { useState, useEffect } from 'react';
import { Settings, Globe } from 'lucide-react';
import { getSiteSetting, updateSiteSetting } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/ImageUpload';

export function SiteSettings() {
  const [siteLogo, setSiteLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [profileHeader, setProfileHeader] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getSiteSetting('site_logo'),
      getSiteSetting('favicon'),
      getSiteSetting('profile_header'),
      getSiteSetting('github_username'),
      getSiteSetting('site_title'),
      getSiteSetting('site_description'),
    ]).then(([logo, icon, header, github, title, desc]) => {
      setSiteLogo(logo || '');
      setFavicon(icon || '');
      setProfileHeader(header || '');
      setGithubUsername(github || '');
      setSiteTitle(title || '');
      setSiteDescription(desc || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSiteSetting('site_logo', siteLogo),
        updateSiteSetting('favicon', favicon),
        updateSiteSetting('profile_header', profileHeader),
        updateSiteSetting('github_username', githubUsername),
        updateSiteSetting('site_title', siteTitle),
        updateSiteSetting('site_description', siteDescription),
      ]);
      alert('Settings saved!');
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Settings className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-on-surface">Site Settings</h3>
      </div>

      {/* Profile Header / Banner */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-on-surface-variant">Profile Header / Banner</label>
        <ImageUpload value={profileHeader} onChange={setProfileHeader} previewClass="aspect-[4/1]" placeholder="Header image URL" />
        <p className="text-xs text-on-surface-variant">Recommended: 1920×400px</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-on-surface-variant">Site Logo</label>
          <ImageUpload value={siteLogo} onChange={setSiteLogo} previewClass="aspect-square max-w-[80px]" placeholder="Logo URL" />
        </div>

        {/* Favicon */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Favicon
          </label>
          <ImageUpload value={favicon} onChange={setFavicon} previewClass="aspect-square max-w-[48px]" placeholder="Favicon URL" />
        </div>
      </div>

      {/* Text settings */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-on-surface-variant">GitHub Username</label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="your-github-username"
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-on-surface-variant">Used for public GitHub stats</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-on-surface-variant">Site Title</label>
          <input
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="Site title for SEO"
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-on-surface-variant">Site Description</label>
          <textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder="Site description for SEO"
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Settings className="w-4 h-4" />
        {saving ? 'Saving…' : 'Save Settings'}
      </Button>

      {/* Preview */}
      {(siteLogo || siteTitle) && (
        <div className="p-4 rounded-2xl border border-border bg-surface-container">
          <p className="text-xs font-medium text-on-surface-variant mb-2">Preview</p>
          <div className="flex items-center gap-3">
            {siteLogo && <img src={siteLogo} alt="logo" className="w-8 h-8 rounded object-cover" />}
            <div>
              <div className="text-sm font-semibold text-on-surface">{siteTitle || 'Site Title'}</div>
              <div className="text-xs text-on-surface-variant">{siteDescription || 'Site description'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
