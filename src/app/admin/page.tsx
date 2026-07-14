'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart3, Palette, Settings, Users, AlertCircle, Plus, Trash2, Pencil, X, Check, Link2, KeyRound, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { upsertPortfolioSection, deletePortfolioItem } from '@/lib/auth';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ThemeBuilder } from '@/components/admin/ThemeBuilder';
import { SiteSettings } from '@/components/admin/SiteSettings';
import { UserManagement } from '@/components/admin/UserManagement';
import { ShortUrlsAdmin } from '@/components/admin/ShortUrlsAdmin';
import { ApiKeysAdmin } from '@/components/admin/ApiKeysAdmin';
import { ChatModeration } from '@/components/admin/ChatModeration';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import type { Project, Experience, Education, SocialLink, Contact, Testimonial } from '@/types';
import type { ProfileData, IntroData, PortfolioData } from '@/stores/portfolio-store';

// ─── Primitive field components (now with REAL onChange handlers) ───────────

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

function Section({ title, children, dirty }: { title: string; children: React.ReactNode; dirty?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-outline/20 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-container transition-colors text-left">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          {title}
          {dirty && <span className="w-2 h-2 rounded-full bg-warning" title="Unsaved changes" />}
        </span>
        <span className="text-xs text-muted-foreground">{expanded ? 'Collapse' : 'Expand'}</span>
      </button>
      {expanded && <div className="px-4 py-4 border-t border-outline/10 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Small IconButton for inline CRUD actions ───────────────────────────────

function IconButton({ onClick, title, children, className = '' }: {
  onClick: () => void; title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-variant/60 transition-colors ${className}`}>
      {children}
    </button>
  );
}

// ─── Portfolio Editor (the main fix — previously all inputs were no-ops) ─────

function PortfolioEditor() {
  const storeData = usePortfolioStore((s) => s.data);
  const refresh = usePortfolioStore((s) => s.refresh);

  // Local editable copy. Initialized from the store, updated on every change.
  // We track a dirty set so "Save All" only persists sections that actually changed.
  const [draft, setDraft] = useState<PortfolioData | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ section: string; itemId: string; label: string } | null>(null);

  // Initialize draft when store data arrives/changes (but don't clobber local edits)
  useEffect(() => {
    if (!draft && storeData) {
      setDraft(storeData);
    }
  }, [storeData, draft]);

  // Helper: mark a section dirty + update draft
  function updateSection<K extends keyof PortfolioData>(section: K, value: PortfolioData[K]) {
    setDraft(prev => prev ? { ...prev, [section]: value } : prev);
    setDirty(prev => new Set(prev).add(section));
  }

  // Helper: mark a section dirty without changing its data (e.g. after a delete that already mutated state)
  function markDirty(section: string) {
    setDirty(prev => new Set(prev).add(section));
  }

  async function handleSaveAll() {
    if (!draft || dirty.size === 0) {
      toast.info('No changes to save.');
      return;
    }
    setSaving(true);
    const sections = Array.from(dirty);
    let failed = 0;
    await Promise.all(sections.map(async (section) => {
      const result = await upsertPortfolioSection(section, draft[section as keyof PortfolioData]);
      if (result.error) {
        failed++;
        toast.error(`Failed to save ${section}: ${result.error}`);
      }
    }));
    if (failed === 0) {
      toast.success(`Saved ${sections.length} section${sections.length === 1 ? '' : 's'}.`);
      setDirty(new Set());
      await refresh(true);
    } else {
      toast.error(`${failed} section(s) failed to save. See console for details.`);
    }
    setSaving(false);
  }

  // Delete handler for list items — uses the existing delete_portfolio_item RPC
  async function handleConfirmDelete() {
    if (!deleteTarget || !draft) return;
    const { section, itemId } = deleteTarget;
    setSaving(true);
    const result = await deletePortfolioItem(section, itemId);
    if (result.error) {
      toast.error(`Delete failed: ${result.error}`);
    } else {
      // Optimistically remove from local draft
      const sectionData = draft[section as keyof PortfolioData] as unknown as Array<{ id: string }>;
      if (Array.isArray(sectionData)) {
        updateSection(section as keyof PortfolioData, sectionData.filter(item => item.id !== itemId) as any);
      }
      toast.success('Item deleted.');
      await refresh(true);
    }
    setSaving(false);
    setDeleteTarget(null);
  }

  if (!draft) {
    return <div className="flex items-center justify-center min-h-[200px]"><LoadingIndicator className="w-6 h-6" /></div>;
  }

  // ─── List-section CRUD helpers ────────────────────────────────────────────
  // These are only used for array sections (projects, experiences, etc.).
  // We use `any` for the template/patch types because PortfolioData[K] is a
  // union of object types and arrays, and TypeScript can't narrow K to "only
  // the array keys" without a much more complex generic constraint. The runtime
  // behavior is correct — callers pass the right shape for each section.
  const d = draft; // capture non-null draft for closures (TS can't narrow across function boundaries)

  function addItem<K extends keyof PortfolioData>(section: K, template: any) {
    const list = d[section] as unknown as any[];
    updateSection(section, [...list, template] as any);
  }

  function editItem<K extends keyof PortfolioData>(section: K, itemId: string, patch: Partial<any>) {
    const list = d[section] as unknown as any[];
    updateSection(section, list.map(it => it.id === itemId ? { ...it, ...patch } : it) as any);
  }

  // Render
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {dirty.size > 0
            ? `${dirty.size} section${dirty.size === 1 ? '' : 's'} with unsaved changes.`
            : 'Changes are saved to the database and reflected live.'}
        </p>
        <Button size="sm" disabled={saving || dirty.size === 0} onClick={handleSaveAll} className="gap-2">
          {saving ? <LoadingIndicator className="w-4 h-4" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : `Save All${dirty.size > 0 ? ` (${dirty.size})` : ''}`}
        </Button>
      </div>

      {/* Profile */}
      <Section title="Profile" dirty={dirty.has('profile')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name"><Input value={draft.profile.name} onChange={v => updateSection('profile', { ...draft.profile, name: v })} /></Field>
          <Field label="Pronouns"><Input value={draft.profile.pronouns} onChange={v => updateSection('profile', { ...draft.profile, pronouns: v })} /></Field>
          <Field label="Role"><Input value={draft.profile.role ?? ''} onChange={v => updateSection('profile', { ...draft.profile, role: v })} /></Field>
          <Field label="Location"><Input value={draft.profile.location ?? ''} onChange={v => updateSection('profile', { ...draft.profile, location: v })} /></Field>
          <Field label="Image URL"><Input value={draft.profile.image} onChange={v => updateSection('profile', { ...draft.profile, image: v })} /></Field>
          <Field label="Verified"><Input type="checkbox" value="" onChange={() => updateSection('profile', { ...draft.profile, verified: !draft.profile.verified })} /></Field>
        </div>
        <Field label="About"><Textarea value={draft.profile.about} onChange={v => updateSection('profile', { ...draft.profile, about: v })} rows={3} /></Field>
      </Section>

      {/* Intro */}
      <Section title="Intro" dirty={dirty.has('intro')}>
        <Field label="Paragraphs (separate with blank lines)">
          <Textarea
            value={draft.intro.paragraphs.join('\n\n')}
            onChange={v => updateSection('intro', { paragraphs: v.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) })}
            rows={4}
            placeholder="Separate paragraphs with blank lines"
          />
        </Field>
      </Section>

      {/* Skills */}
      <Section title="Skills" dirty={dirty.has('skills')}>
        <Field label="Skills (comma-separated)">
          <Input value={draft.skills.join(', ')} onChange={v => updateSection('skills', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="React, TypeScript, Node.js" />
        </Field>
      </Section>

      {/* Projects — full CRUD */}
      <Section title={`Projects (${draft.projects.length})`} dirty={dirty.has('projects')}>
        <div className="space-y-3">
          {draft.projects.map((project) => (
            <ProjectEditor key={project.id} project={project}
              onChange={patch => editItem('projects', project.id, patch)}
              onDelete={() => setDeleteTarget({ section: 'projects', itemId: project.id, label: project.title })}
            />
          ))}
          <Button variant="outlined" size="sm" className="gap-2"
            onClick={() => addItem('projects', { id: `proj_${Date.now()}`, title: 'New Project', date: '', role: '', category: '', color: '#3b82f6', icon: 'code' } as Project)}>
            <Plus className="w-3.5 h-3.5" /> Add Project
          </Button>
        </div>
      </Section>

      {/* Experience — full CRUD */}
      <Section title={`Experience (${draft.experiences.length})`} dirty={dirty.has('experiences')}>
        <div className="space-y-3">
          {draft.experiences.map((exp) => (
            <ExperienceEditor key={exp.id} experience={exp}
              onChange={patch => editItem('experiences', exp.id, patch)}
              onDelete={() => setDeleteTarget({ section: 'experiences', itemId: exp.id, label: exp.title })}
            />
          ))}
          <Button variant="outlined" size="sm" className="gap-2"
            onClick={() => addItem('experiences', { id: `exp_${Date.now()}`, title: 'New Role', company: '', location: '', dateRange: '', description: '', logoColor: '#3b82f6' } as Experience)}>
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </Button>
        </div>
      </Section>

      {/* Education — full CRUD */}
      <Section title={`Education (${draft.education.length})`} dirty={dirty.has('education')}>
        <div className="space-y-3">
          {draft.education.map((edu) => (
            <EducationEditor key={edu.id} education={edu}
              onChange={patch => editItem('education', edu.id, patch)}
              onDelete={() => setDeleteTarget({ section: 'education', itemId: edu.id, label: edu.degree })}
            />
          ))}
          <Button variant="outlined" size="sm" className="gap-2"
            onClick={() => addItem('education', { id: `edu_${Date.now()}`, institution: '', degree: '', year: '' } as Education)}>
            <Plus className="w-3.5 h-3.5" /> Add Education
          </Button>
        </div>
      </Section>

      {/* Testimonials — full CRUD */}
      <Section title={`Testimonials (${draft.testimonials?.length ?? 0})`} dirty={dirty.has('testimonials')}>
        <div className="space-y-3">
          {(draft.testimonials ?? []).map((t) => (
            <TestimonialEditor key={t.id} testimonial={t}
              onChange={patch => editItem('testimonials', t.id, patch)}
              onDelete={() => setDeleteTarget({ section: 'testimonials', itemId: t.id, label: t.name })}
            />
          ))}
          <Button variant="outlined" size="sm" className="gap-2"
            onClick={() => addItem('testimonials', { id: `test_${Date.now()}`, name: '', role: '', quote: '' } as Testimonial)}>
            <Plus className="w-3.5 h-3.5" /> Add Testimonial
          </Button>
        </div>
      </Section>

      {/* Social Links — full CRUD */}
      <Section title={`Social Links (${draft.social_links.length})`} dirty={dirty.has('social_links')}>
        <div className="space-y-3">
          {draft.social_links.map((link, idx) => (
            <SocialLinkEditor key={idx} link={link}
              onChange={patch => {
                const next = draft.social_links.map((l, i) => i === idx ? { ...l, ...patch } : l);
                updateSection('social_links', next);
              }}
              onDelete={() => {
                updateSection('social_links', draft.social_links.filter((_, i) => i !== idx));
                markDirty('social_links');
              }}
            />
          ))}
          <Button variant="outlined" size="sm" className="gap-2"
            onClick={() => addItem('social_links', { platform: '', href: '', icon: 'link' } as SocialLink)}>
            <Plus className="w-3.5 h-3.5" /> Add Social Link
          </Button>
        </div>
      </Section>

      {/* Contacts — full CRUD */}
      <Section title={`Contacts (${draft.contacts.length})`} dirty={dirty.has('contacts')}>
        <div className="space-y-3">
          {draft.contacts.map((c) => (
            <ContactEditor key={c.id} contact={c}
              onChange={patch => editItem('contacts', c.id, patch)}
              onDelete={() => setDeleteTarget({ section: 'contacts', itemId: c.id, label: c.type })}
            />
          ))}
          <Button variant="outlined" size="sm" className="gap-2"
            onClick={() => addItem('contacts', { id: `con_${Date.now()}`, type: '', label: '', value: '', href: '', icon: 'mail' } as Contact)}>
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </Button>
        </div>
      </Section>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete item?"
        description={`This will permanently remove "${deleteTarget?.label}" from ${deleteTarget?.section}. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

// ─── Per-item editors (inline editable cards) ───────────────────────────────

function ItemCard({ label, onDelete, children }: { label: string; onDelete: () => void; children: React.ReactNode }) {
  return (
    <div className="p-3 bg-surface-container rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <IconButton onClick={onDelete} title="Delete"><Trash2 className="w-3.5 h-3.5 text-error" /></IconButton>
      </div>
      {children}
    </div>
  );
}

function ProjectEditor({ project, onChange, onDelete }: { project: Project; onChange: (patch: Partial<Project>) => void; onDelete: () => void }) {
  return (
    <ItemCard label={project.title || 'Untitled Project'} onDelete={onDelete}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Title"><Input value={project.title} onChange={v => onChange({ title: v })} /></Field>
        <Field label="Date"><Input value={project.date} onChange={v => onChange({ date: v })} placeholder="2024" /></Field>
        <Field label="Role"><Input value={project.role} onChange={v => onChange({ role: v })} /></Field>
        <Field label="Category"><Input value={project.category} onChange={v => onChange({ category: v })} /></Field>
        <Field label="Color"><Input value={project.color} onChange={v => onChange({ color: v })} placeholder="#3b82f6" /></Field>
        <Field label="Icon"><Input value={project.icon} onChange={v => onChange({ icon: v })} placeholder="code" /></Field>
        <Field label="URL"><Input value={project.href ?? ''} onChange={v => onChange({ href: v })} placeholder="https://..." /></Field>
        <Field label="Status"><Input value={project.status ?? ''} onChange={v => onChange({ status: v as Project['status'] })} placeholder="live|wip|archived" /></Field>
      </div>
      <Field label="Description"><Textarea value={project.description ?? ''} onChange={v => onChange({ description: v })} rows={2} /></Field>
    </ItemCard>
  );
}

function ExperienceEditor({ experience, onChange, onDelete }: { experience: Experience; onChange: (patch: Partial<Experience>) => void; onDelete: () => void }) {
  return (
    <ItemCard label={experience.title || 'Untitled Role'} onDelete={onDelete}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Title"><Input value={experience.title} onChange={v => onChange({ title: v })} /></Field>
        <Field label="Company"><Input value={experience.company} onChange={v => onChange({ company: v })} /></Field>
        <Field label="Location"><Input value={experience.location} onChange={v => onChange({ location: v })} /></Field>
        <Field label="Date Range"><Input value={experience.dateRange} onChange={v => onChange({ dateRange: v })} placeholder="2023 - Present" /></Field>
        <Field label="Logo Color"><Input value={experience.logoColor} onChange={v => onChange({ logoColor: v })} placeholder="#3b82f6" /></Field>
      </div>
      <Field label="Description"><Textarea value={experience.description} onChange={v => onChange({ description: v })} rows={2} /></Field>
    </ItemCard>
  );
}

function EducationEditor({ education, onChange, onDelete }: { education: Education; onChange: (patch: Partial<Education>) => void; onDelete: () => void }) {
  return (
    <ItemCard label={education.degree || 'Untitled Education'} onDelete={onDelete}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Institution"><Input value={education.institution} onChange={v => onChange({ institution: v })} /></Field>
        <Field label="Degree"><Input value={education.degree} onChange={v => onChange({ degree: v })} /></Field>
        <Field label="Year"><Input value={education.year} onChange={v => onChange({ year: v })} placeholder="2020" /></Field>
      </div>
    </ItemCard>
  );
}

function TestimonialEditor({ testimonial, onChange, onDelete }: { testimonial: Testimonial; onChange: (patch: Partial<Testimonial>) => void; onDelete: () => void }) {
  return (
    <ItemCard label={testimonial.name || 'Untitled Testimonial'} onDelete={onDelete}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Name"><Input value={testimonial.name} onChange={v => onChange({ name: v })} /></Field>
        <Field label="Role"><Input value={testimonial.role} onChange={v => onChange({ role: v })} /></Field>
      </div>
      <Field label="Quote"><Textarea value={testimonial.quote} onChange={v => onChange({ quote: v })} rows={2} /></Field>
      <Field label="Avatar URL"><Input value={testimonial.avatar ?? ''} onChange={v => onChange({ avatar: v })} placeholder="https://..." /></Field>
    </ItemCard>
  );
}

function SocialLinkEditor({ link, onChange, onDelete }: { link: SocialLink; onChange: (patch: Partial<SocialLink>) => void; onDelete: () => void }) {
  return (
    <ItemCard label={link.platform || 'Untitled Link'} onDelete={onDelete}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Platform"><Input value={link.platform} onChange={v => onChange({ platform: v })} placeholder="github" /></Field>
        <Field label="Icon"><Input value={link.icon} onChange={v => onChange({ icon: v })} placeholder="github" /></Field>
      </div>
      <Field label="URL"><Input value={link.href} onChange={v => onChange({ href: v })} placeholder="https://..." /></Field>
    </ItemCard>
  );
}

function ContactEditor({ contact, onChange, onDelete }: { contact: Contact; onChange: (patch: Partial<Contact>) => void; onDelete: () => void }) {
  return (
    <ItemCard label={contact.type || 'Untitled Contact'} onDelete={onDelete}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Type"><Input value={contact.type} onChange={v => onChange({ type: v })} placeholder="email" /></Field>
        <Field label="Label"><Input value={contact.label} onChange={v => onChange({ label: v })} /></Field>
        <Field label="Value"><Input value={contact.value} onChange={v => onChange({ value: v })} /></Field>
        <Field label="Icon"><Input value={contact.icon} onChange={v => onChange({ icon: v })} placeholder="mail" /></Field>
      </div>
      <Field label="Link (href)"><Input value={contact.href} onChange={v => onChange({ href: v })} placeholder="mailto:..." /></Field>
    </ItemCard>
  );
}

// ─── Admin shell (unchanged) ────────────────────────────────────────────────

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'short-urls', label: 'Short URLs', icon: Link2 },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  { id: 'chat', label: 'Chat Mod', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
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
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'portfolio');

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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'bg-surface-variant/50 text-muted-foreground hover:bg-surface-variant hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
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
          {activeTab === 'short-urls' && <ShortUrlsAdmin />}
          {activeTab === 'api-keys' && <ApiKeysAdmin />}
          {activeTab === 'chat' && <ChatModeration />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'settings' && <SiteSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
