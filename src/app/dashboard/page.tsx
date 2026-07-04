'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Activity, Shield, ArrowRight, ExternalLink, Link2, Trash2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listApiKeys, getApiUsageToday, getShortenUsageToday, getSiteSetting, listShortUrls, deleteShortUrl } from '@/lib/auth';

interface ShortUrl {
  id: string;
  slug: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [keyCount, setKeyCount] = useState(0);
  const [ghUsage, setGhUsage] = useState(0);
  const [shortenUsage, setShortenUsage] = useState(0);
  const [ghLimit, setGhLimit] = useState(100);
  const [shortenLimit, setShortenLimit] = useState(100);
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) window.location.href = '/';
  }, [user, isLoading]);

  const refreshData = () => {
    if (!user) return;
    listApiKeys().then(keys => setKeyCount(keys.length));
    getApiUsageToday().then(c => setGhUsage(c));
    getShortenUsageToday().then(c => setShortenUsage(c));
    getSiteSetting('rate_limit_github').then(v => { if (v) setGhLimit(parseInt(v)); });
    getSiteSetting('rate_limit_shorten').then(v => { if (v) setShortenLimit(parseInt(v)); });
    listShortUrls().then(urls => setShortUrls(urls));
  };

  useEffect(() => {
    refreshData();
    const h = () => { if (document.visibilityState === 'visible') refreshData(); };
    document.addEventListener('visibilitychange', h);
    // Poll every 5s for real-time updates
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshData();
    }, 5000);
    return () => {
      document.removeEventListener('visibilitychange', h);
      clearInterval(interval);
    };
  }, [user]);

  const handleCopyShortUrl = (url: string, slug: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDeleteShortUrl = async (slug: string) => {
    if (!confirm(`Delete short URL /s/${slug}?`)) return;
    const ok = await deleteShortUrl(slug);
    if (ok) setShortUrls(prev => prev.filter(u => u.slug !== slug));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-title-sm font-semibold text-foreground">Dashboard</span>
          {user?.is_admin && (
            <button onClick={() => document.dispatchEvent(new CustomEvent('open-admin'))} className="flex items-center gap-1.5 text-body-sm text-primary hover:text-primary/80 transition-colors">
              <Shield className="w-4 h-4" /> Admin
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-headline-sm font-semibold text-foreground mb-1">
            Welcome, {user?.display_name || user?.email}
          </h1>
          <p className="text-body-md text-muted-foreground">Manage your API keys, short URLs, and monitor usage</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-surface border border-outline/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-label-sm text-muted-foreground">API Keys</p>
                <p className="text-title-sm font-semibold text-foreground">{keyCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-surface border border-outline/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-label-sm text-muted-foreground">GitHub (1h)</p>
                <p className="text-title-sm font-semibold text-foreground">{ghUsage}/{ghLimit}</p>
              </div>
            </div>
            <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${Math.min((ghUsage / ghLimit) * 100, 100)}%` }}
                className={`h-full rounded-full ${ghUsage > ghLimit * 0.8 ? 'bg-error' : ghUsage > ghLimit * 0.5 ? 'bg-warning' : 'bg-primary'}`} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-surface border border-outline/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center">
                <Link2 className="w-5 h-5 text-tertiary" />
              </div>
              <div>
                <p className="text-label-sm text-muted-foreground">Shortener (today)</p>
                <p className="text-title-sm font-semibold text-foreground">{shortenUsage}/{shortenLimit}</p>
              </div>
            </div>
            <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${Math.min((shortenUsage / shortenLimit) * 100, 100)}%` }}
                className={`h-full rounded-full ${shortenUsage > shortenLimit * 0.8 ? 'bg-error' : shortenUsage > shortenLimit * 0.5 ? 'bg-warning' : 'bg-primary'}`} />
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/api-keys" className="group block p-6 rounded-2xl bg-surface border border-outline/20 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-title-sm font-semibold text-foreground">API Keys</h3>
                  <p className="text-body-sm text-muted-foreground">Create and manage your keys</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link href="/docs" className="group block p-6 rounded-2xl bg-surface border border-outline/20 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-title-sm font-semibold text-foreground">API Docs</h3>
                  <p className="text-body-sm text-muted-foreground">View endpoints and examples</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>

        {/* Short URLs List */}
        {shortUrls.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Short URLs</h2>
              <Link href="/docs/api-reference/shorten" className="text-body-sm text-primary hover:underline">API Docs</Link>
            </div>
            <div className="rounded-2xl border border-outline/20 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-surface-variant/50 border-b border-outline/15">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Short URL</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Original</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Clicks</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shortUrls.map(url => (
                    <tr key={url.id} className="border-b border-outline/10 last:border-0 hover:bg-surface-variant/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-primary font-mono text-[12px]">{url.short_url}</code>
                          <button onClick={() => handleCopyShortUrl(url.short_url, url.slug)}
                            className="p-1 rounded hover:bg-surface-variant transition-colors">
                            {copiedSlug === url.slug ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">{url.original_url}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground">{url.clicks}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDeleteShortUrl(url.slug)}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
