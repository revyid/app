'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Activity, Shield, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listApiKeys, getApiUsageToday } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [keyCount, setKeyCount] = useState(0);
  const [usageToday, setUsageToday] = useState(0);

  useEffect(() => {
    if (user) {
      listApiKeys().then(keys => setKeyCount(keys.length));
      getApiUsageToday().then(count => setUsageToday(count));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-outline/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-body-sm">
              ← Back to Portfolio
            </Link>
          </div>
          <span className="text-title-sm font-semibold text-foreground">Dashboard</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-headline-sm font-semibold text-foreground mb-1">
            Welcome, {user?.display_name || user?.email}
          </h1>
          <p className="text-body-md text-muted-foreground">Manage your API keys and monitor usage</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-surface border border-outline/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-label-sm text-muted-foreground">Total Keys</p>
                <p className="text-title-sm font-semibold text-foreground">{keyCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-surface border border-outline/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-label-sm text-muted-foreground">Requests (1h)</p>
                <p className="text-title-sm font-semibold text-foreground">{usageToday}/100</p>
              </div>
            </div>
            <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((usageToday / 100) * 100, 100)}%` }}
                className={`h-full rounded-full ${usageToday > 80 ? 'bg-error' : usageToday > 50 ? 'bg-warning' : 'bg-primary'}`}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-surface border border-outline/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center">
                <Shield className="w-5 h-5 text-tertiary" />
              </div>
              <div>
                <p className="text-label-sm text-muted-foreground">Rate Limit</p>
                <p className="text-title-sm font-semibold text-foreground">100/hr</p>
              </div>
            </div>
          </motion.div>
        </div>

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

          <Link href="/dashboard/docs" className="group block p-6 rounded-2xl bg-surface border border-outline/20 hover:border-primary/50 transition-colors">
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
      </main>
    </div>
  );
}
