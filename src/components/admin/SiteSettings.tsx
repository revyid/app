import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { getSiteSetting, updateSiteSetting } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/ImageUpload';

export function SiteSettings() {
  const [siteLogo, setSiteLogo] = useState('');
  const [profileHeader, setProfileHeader] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [unlimitedApiKeys, setUnlimitedApiKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getSiteSetting('site_logo'),
      getSiteSetting('profile_header'),
      getSiteSetting('github_username'),
      getSiteSetting('unlimited_api_keys'),
    ]).then(([logo, header, github, unlimited]) => {
      setSiteLogo(logo || '');
      setProfileHeader(header || '');
      setGithubUsername(github || '');
      setUnlimitedApiKeys(unlimited === 'true');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSiteSetting('site_logo', siteLogo),
        updateSiteSetting('profile_header', profileHeader),
        updateSiteSetting('github_username', githubUsername),
        updateSiteSetting('unlimited_api_keys', unlimitedApiKeys ? 'true' : 'false'),
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-on-surface-variant">Profile Header / Banner</label>
        <ImageUpload value={profileHeader} onChange={setProfileHeader} previewClass="aspect-[4/1]" placeholder="Header image URL" />
        <p className="text-xs text-on-surface-variant">Recommended: 1920×400px</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-on-surface-variant">Site Icon</label>
        <ImageUpload value={siteLogo} onChange={setSiteLogo} previewClass="aspect-square max-w-[48px]" placeholder="Icon URL" />
      </div>

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

      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-container">
        <div>
          <p className="text-sm font-medium text-on-surface">Unlimited API Keys</p>
          <p className="text-xs text-on-surface-variant">Bypass rate limits for all API key users</p>
        </div>
        <button
          onClick={() => setUnlimitedApiKeys(!unlimitedApiKeys)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${unlimitedApiKeys ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow ${unlimitedApiKeys ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Settings className="w-4 h-4" />
        {saving ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  );
}
