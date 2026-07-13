'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart3, Palette, Settings, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { upsertPortfolioSection } from '@/lib/auth';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ThemeBuilder } from '@/components/admin/ThemeBuilder';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { UserManagement } from '@/components/admin/UserManagement';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import type { Project, Experience, Education, SocialLink, Contact, Language, Testimonial } from '@/types';
import type { ProfileData, IntroData } from '@/stores/portfolio-store';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-outline/20 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-container transition-colors text-left">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{expanded ? 'Collapse' : 'Expand'}</span>
      </button>
      {expanded && <div className="px-4 py-4 border-t border-outline/10 space-y-4">{children}</div>}
    </div>
  );
}

function PortfolioEditor() {
  const data = usePortfolioStore((s) => s.data);
  const refresh = usePortfolioStore((s) => s.refresh);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (section: string, sectionData: unknown) => {
    setSaving(true);
    try {
      await upsertPortfolioSection(section, sectionData);
      await refresh(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Changes are saved to the database and reflected live.</p>
        <Button size="sm" disabled={saving} className="gap-2">
          {saving ? <LoadingIndicator className="w-4 h-4" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Saved!' : 'Save All'}
        </Button>
      </div>

      <Section title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name"><Input value={data.profile.name} onChange={() => {}} /></Field>
          <Field label="Pronouns"><Input value={data.profile.pronouns} onChange={() => {}} /></Field>
        </div>
        <Field label="About"><Textarea value={data.profile.about} onChange={() => {}} rows={3} /></Field>
      </Section>

      <Section title="Intro">
        <Field label="Paragraphs">
          <Textarea
            value={data.intro.paragraphs.join('\n\n')}
            onChange={() => {}}
            rows={4}
            placeholder="Separate paragraphs with blank lines"
          />
        </Field>
      </Section>

      <Section title="Skills">
        <Field label="Skills (comma-separated)">
          <Input value={data.skills.join(', ')} onChange={() => {}} placeholder="React, TypeScript, Node.js" />
        </Field>
      </Section>

      <Section title={`Projects (${data.projects.length})`}>
        {data.projects.map((project, i) => (
          <div key={project.id} className="p-3 bg-surface-container rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{project.title}</span>
              <span className="text-xs text-muted-foreground">{project.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>{project.date}</span>
              <span>{project.role}</span>
            </div>
          </div>
        ))}
      </Section>

      <Section title={`Experience (${data.experiences.length})`}>
        {data.experiences.map((exp) => (
          <div key={exp.id} className="p-3 bg-surface-container rounded-lg space-y-1">
            <div className="text-sm font-medium">{exp.title}</div>
            <div className="text-xs text-muted-foreground">{exp.company} · {exp.location}</div>
            <div className="text-xs text-muted-foreground">{exp.dateRange}</div>
          </div>
        ))}
      </Section>

      <Section title={`Education (${data.education.length})`}>
        {data.education.map((edu) => (
          <div key={edu.id} className="p-3 bg-surface-container rounded-lg">
            <div className="text-sm font-medium">{edu.degree}</div>
            <div className="text-xs text-muted-foreground">{edu.institution} · {edu.year}</div>
          </div>
        ))}
      </Section>

      <Section title={`Testimonials (${data.testimonials?.length ?? 0})`}>
        {(data.testimonials ?? []).map((t) => (
          <div key={t.id} className="p-3 bg-surface-container rounded-lg">
            <div className="text-sm font-medium">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.role}</div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.quote}</p>
          </div>
        ))}
      </Section>

      <Section title={`Social Links (${data.social_links.length})`}>
        {data.social_links.map((link) => (
          <div key={link.platform} className="flex items-center gap-2 p-2 bg-surface-container rounded-lg text-sm">
            <span className="font-medium">{link.platform}</span>
            <span className="text-muted-foreground text-xs truncate">{link.href}</span>
          </div>
        ))}
      </Section>

      <Section title={`Contacts (${data.contacts.length})`}>
        {data.contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-2 p-2 bg-surface-container rounded-lg text-sm">
            <span className="font-medium">{c.type}</span>
            <span className="text-muted-foreground text-xs">{c.label}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
];

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><LoadingIndicator className="w-8 h-8" /></div>}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'portfolio';

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/';
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingIndicator className="w-8 h-8" />
      </div>
    );
  }

  if (!user) return null;

  if (!user.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-error" />
        <h1 className="text-title-lg font-semibold text-foreground">Access Denied</h1>
        <p className="text-body-md text-muted-foreground">You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-semibold text-foreground flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          Admin Panel
        </h1>
        <p className="text-body-md text-muted-foreground mt-1">
          Manage your portfolio, analytics, themes, and settings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <a
              key={tab.id}
              href={`/admin?tab=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'bg-surface-variant/50 text-muted-foreground hover:bg-surface-variant hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </a>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'portfolio' && <PortfolioEditor />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'themes' && <ThemeBuilder />}
          {activeTab === 'settings' && <SiteSettings />}
          {activeTab === 'users' && <UserManagement />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
