import { useState, useEffect } from 'react';
import { Settings, Key, Copy, Check, RefreshCw } from 'lucide-react';
import { getSiteSetting, updateSiteSetting, getSiteApiKey, regenerateSiteApiKey } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/shared/ImageUpload';

export function SiteSettings() {
  const [siteLogo, setSiteLogo] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [unlimitedApiKeys, setUnlimitedApiKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Site API key state
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [siteKeyLoading, setSiteKeyLoading] = useState(true);
  const [siteKeyVisible, setSiteKeyVisible] = useState(false);
  const [siteKeyCopied, setSiteKeyCopied] = useState(false);
  const [siteKeyRegenerating, setSiteKeyRegenerating] = useState(false);
  const [newSiteKey, setNewSiteKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getSiteSetting('site_logo'),
      getSiteSetting('github_username'),
      getSiteSetting('unlimited_api_keys'),
    ]).then(([logo, github, unlimited]) => {
      setSiteLogo(logo || '');
      setGithubUsername(github || '');
      setUnlimitedApiKeys(unlimited === 'true');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Load site API key on mount
  useEffect(() => {
    getSiteApiKey().then(key => {
      setSiteKey(key);
      setSiteKeyLoading(false);
    }).catch(() => setSiteKeyLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSiteSetting('site_logo', siteLogo),
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

  const handleRegenerateSiteKey = async () => {
    if (!confirm('Regenerate the site API key? The old key will stop working immediately.')) return;
    setSiteKeyRegenerating(true);
    const result = await regenerateSiteApiKey();
    if (result.key) {
      setNewSiteKey(result.key);
      setSiteKey(result.key);
      setSiteKeyVisible(true);
    } else {
      alert(result.error || 'Failed to regenerate key');
    }
    setSiteKeyRegenerating(false);
  };

  const copySiteKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSiteKeyCopied(true);
    setTimeout(() => setSiteKeyCopied(false), 2000);
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
          <p className="text-xs text-on-surface-variant">Bypass rate limits for all users</p>
        </div>
        <button
          onClick={() => setUnlimitedApiKeys(!unlimitedApiKeys)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${unlimitedApiKeys ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow ${unlimitedApiKeys ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {/* Site API Key */}
      <div className="p-4 rounded-xl border border-border bg-surface-container space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-on-surface">Site API Key</p>
        </div>
        <p className="text-xs text-on-surface-variant">
          Internal key used by the website for GitHub data. Keep this secret.
        </p>

        {siteKeyLoading ? (
          <div className="text-xs text-on-surface-variant">Loading...</div>
        ) : newSiteKey ? (
          <div className="space-y-2">
            <div className="p-3 bg-success/10 border border-success/30 rounded-xl">
              <p className="text-xs text-success font-medium mb-1">New key generated! Copy it now — it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-foreground break-all select-all">{newSiteKey}</code>
                <button onClick={() => copySiteKey(newSiteKey)} className="p-1.5 rounded-lg hover:bg-surface transition-colors shrink-0">
                  {siteKeyCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
                </button>
              </div>
            </div>
          </div>
        ) : siteKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-xs font-mono bg-background rounded-lg border border-border text-foreground truncate">
              {siteKeyVisible ? siteKey : siteKey.slice(0, 14) + '••••••••••••'}
            </code>
            <button onClick={() => setSiteKeyVisible(!siteKeyVisible)} className="px-2 py-2 text-xs text-on-surface-variant hover:text-foreground transition-colors">
              {siteKeyVisible ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => copySiteKey(siteKey)} className="p-2 rounded-lg hover:bg-surface transition-colors">
              {siteKeyCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
            </button>
            <button onClick={handleRegenerateSiteKey} disabled={siteKeyRegenerating} className="p-2 rounded-lg hover:bg-surface transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 text-on-surface-variant ${siteKeyRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        ) : (
          <Button onClick={handleRegenerateSiteKey} disabled={siteKeyRegenerating} variant="outlined" className="w-full gap-2">
            <Key className="w-4 h-4" />
            {siteKeyRegenerating ? 'Generating...' : 'Generate Site API Key'}
          </Button>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Settings className="w-4 h-4" />
        {saving ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  );
}
