import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ChevronDown, ChevronUp, Loader2, Shield, Plus, Trash2, Palette, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { upsertPortfolioSection } from '@/lib/auth';
import { Button, IconButton } from '@/components/ui/button';
import { modalBackdrop, bottomSheetContent } from '@/lib/motion-presets';
import type { Project, Experience, Education, SocialLink, Contact, Language, Testimonial } from '@/types';
import type { ProfileData, IntroData } from '@/contexts/PortfolioContext';
import { ThemeBuilder } from './ThemeBuilder';
import { SiteSettings } from './SiteSettings';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ImageUpload } from '@/components/shared/ImageUpload';

// ─── Helpers ─────────────────────────────────────────────────────────
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
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
    />
  );
}

function SaveButton({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button size="sm" onClick={onSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? 'Saved!' : 'Save'}
      </Button>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────
function Section({ label, children, onSave, saving, saved, error }: {
  label: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="font-medium text-sm">{label}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {children}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <SaveButton saving={saving} saved={saved} onSave={onSave} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── useSave hook ─────────────────────────────────────────────────────
function useSave(section: string, onSaved: () => void) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  const save = async (data: unknown) => {
    setSaving(true);
    setError(undefined);
    const result = await upsertPortfolioSection(section, data);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Force refresh after a short delay to ensure DB write completes
      setTimeout(() => onSaved(), 300);
    }
  };

  return { save, saving, saved, error };
}

// ─── Profile Section ──────────────────────────────────────────────────
function ProfileSection({ initial, onSaved }: { initial: ProfileData; onSaved: () => void }) {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);
  const { save, saving, saved, error } = useSave('profile', onSaved);
  const set = (k: keyof ProfileData) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Section label="Profile" onSave={() => save(form)} saving={saving} saved={saved} error={error}>
      <Field label="Name"><Input value={form.name} onChange={set('name')} /></Field>
      <Field label="Pronouns"><Input value={form.pronouns} onChange={set('pronouns')} /></Field>
      <Field label="Profile Image">
        <ImageUpload value={form.image} onChange={set('image')} previewClass="aspect-square max-w-[120px]" />
      </Field>
      <Field label="About"><Textarea value={form.about} onChange={set('about')} rows={4} /></Field>
      <div className="pt-2 border-t border-border space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Easter Egg (Ctrl+Alt+L)</p>
        <Field label="Name"><Input value={form.easter_egg?.name ?? ''} onChange={(v) => setForm(f => ({ ...f, easter_egg: { ...f.easter_egg, name: v, image: f.easter_egg?.image ?? '', shortcut: f.easter_egg?.shortcut ?? 'Ctrl+Alt+L' } }))} /></Field>
        <Field label="Image">
          <ImageUpload
            value={form.easter_egg?.image ?? ''}
            onChange={(v) => setForm(f => ({ ...f, easter_egg: { ...f.easter_egg, name: f.easter_egg?.name ?? '', image: v, shortcut: f.easter_egg?.shortcut ?? 'Ctrl+Alt+L' } }))}
            previewClass="aspect-square max-w-[120px]"
          />
        </Field>
      </div>
    </Section>
  );
}

// ─── Intro Section ────────────────────────────────────────────────────
function IntroSectionEditor({ initial, onSaved }: { initial: IntroData; onSaved: () => void }) {
  const [paragraphs, setParagraphs] = useState(initial.paragraphs);
  useEffect(() => setParagraphs(initial.paragraphs), [initial]);
  const { save, saving, saved, error } = useSave('intro', onSaved);

  return (
    <Section label="Intro" onSave={() => save({ paragraphs })} saving={saving} saved={saved} error={error}>
      {paragraphs.map((p, i) => (
        <div key={i} className="flex gap-2">
          <Textarea value={p} onChange={(v) => setParagraphs((arr) => arr.map((x, j) => j === i ? v : x))} rows={3} />
          <IconButton variant="ghost" size="sm" onClick={() => setParagraphs((arr) => arr.filter((_, j) => j !== i))}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </IconButton>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setParagraphs((arr) => [...arr, ''])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Paragraph
      </Button>
    </Section>
  );
}

// ─── Skills Section ───────────────────────────────────────────────────
function SkillsSectionEditor({ initial, onSaved }: { initial: string[]; onSaved: () => void }) {
  const [skills, setSkills] = useState(initial);
  useEffect(() => setSkills(initial), [initial]);
  const { save, saving, saved, error } = useSave('skills', onSaved);

  return (
    <Section label="Skills" onSave={() => save(skills)} saving={saving} saved={saved} error={error}>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <div key={i} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
            <input
              value={skill}
              onChange={(e) => setSkills((arr) => arr.map((x, j) => j === i ? e.target.value : x))}
              className="text-sm bg-transparent outline-none w-24"
            />
            <button onClick={() => setSkills((arr) => arr.filter((_, j) => j !== i))}>
              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setSkills((arr) => [...arr, ''])}
          className="flex items-center gap-1 text-xs text-primary border border-dashed border-primary/50 rounded-full px-3 py-1 hover:bg-primary/10"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </Section>
  );
}

// ─── Languages Section ────────────────────────────────────────────────
function LanguagesSectionEditor({ initial, onSaved }: { initial: Language[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('languages', onSaved);
  const update = (i: number, k: keyof Language, v: string) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Languages" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((lang, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input value={lang.flag} onChange={(v) => update(i, 'flag', v)} placeholder="🇮🇩" />
          <Input value={lang.name} onChange={(v) => update(i, 'name', v)} placeholder="Indonesian" />
          <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </IconButton>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { name: '', flag: '' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Language
      </Button>
    </Section>
  );
}

// ─── Social Links Section ─────────────────────────────────────────────
function SocialLinksSectionEditor({ initial, onSaved }: { initial: SocialLink[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('social_links', onSaved);
  const update = (i: number, k: keyof SocialLink, v: string) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Social Links" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((link, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 items-center">
          <Input value={link.platform} onChange={(v) => update(i, 'platform', v)} placeholder="GitHub" />
          <Input value={link.icon} onChange={(v) => update(i, 'icon', v)} placeholder="Github" />
          <div className="flex gap-1">
            <Input value={link.href} onChange={(v) => update(i, 'href', v)} placeholder="https://..." />
            <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </IconButton>
          </div>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { platform: '', href: '', icon: '' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Link
      </Button>
    </Section>
  );
}

// ─── Contacts Section ─────────────────────────────────────────────────
function ContactsSectionEditor({ initial, onSaved }: { initial: Contact[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('contacts', onSaved);
  const update = (i: number, k: keyof Contact, v: string) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Contacts" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((c, i) => (
        <div key={i} className="p-3 border border-border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Contact {i + 1}</span>
            <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </IconButton>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Label"><Input value={c.label} onChange={(v) => update(i, 'label', v)} /></Field>
            <Field label="Icon"><Input value={c.icon} onChange={(v) => update(i, 'icon', v)} placeholder="Mail" /></Field>
            <Field label="Value"><Input value={c.value} onChange={(v) => update(i, 'value', v)} /></Field>
            <Field label="Href"><Input value={c.href} onChange={(v) => update(i, 'href', v)} placeholder="mailto:..." /></Field>
          </div>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { id: crypto.randomUUID(), type: 'email', label: '', value: '', href: '', icon: 'Mail' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Contact
      </Button>
    </Section>
  );
}

// ─── Projects Section ─────────────────────────────────────────────────
function ProjectsSectionEditor({ initial, onSaved }: { initial: Project[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('projects', onSaved);
  const update = (i: number, k: keyof Project, v: string | string[]) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Projects" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((p, i) => (
        <div key={p.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">{p.title || `Project ${i + 1}`}</span>
            <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </IconButton>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Title"><Input value={p.title} onChange={(v) => update(i, 'title', v)} /></Field>
            <Field label="Date"><Input value={p.date} onChange={(v) => update(i, 'date', v)} /></Field>
            <Field label="Role"><Input value={p.role} onChange={(v) => update(i, 'role', v)} /></Field>
            <Field label="Category"><Input value={p.category} onChange={(v) => update(i, 'category', v)} /></Field>
            <Field label="Color"><Input value={p.color} onChange={(v) => update(i, 'color', v)} placeholder="#000000" /></Field>
            <Field label="Icon"><Input value={p.icon} onChange={(v) => update(i, 'icon', v)} placeholder="Globe" /></Field>
            <Field label="Status">
              <select
                value={p.status ?? 'live'}
                onChange={(e) => update(i, 'status', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="live">Live</option>
                <option value="wip">In Progress</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="URL"><Input value={p.href ?? ''} onChange={(v) => update(i, 'href', v)} placeholder="https://..." /></Field>
            <Field label="Repo URL"><Input value={p.repoUrl ?? ''} onChange={(v) => update(i, 'repoUrl', v)} placeholder="https://github.com/..." /></Field>
            <Field label="Thumbnail">
              <ImageUpload value={p.thumbnail ?? ''} onChange={(v) => update(i, 'thumbnail', v)} previewClass="aspect-video" />
            </Field>
          </div>
          <Field label="Tech Stack (comma separated)">
            <Input
              value={(p.techStack ?? []).join(', ')}
              onChange={(v) => update(i, 'techStack', v.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="React, Node.js, Docker"
            />
          </Field>
          <Field label="Features (one per line)">
            <Textarea
              value={(p.features ?? []).join('\n')}
              onChange={(v) => update(i, 'features', v.split('\n').map(s => s.trim()).filter(Boolean))}
              placeholder="One-click deploy&#10;Real-time logs"
              rows={3}
            />
          </Field>
          <Field label="Description (Markdown supported)">
            <Textarea value={p.description ?? ''} onChange={(v) => update(i, 'description', v)} rows={5} placeholder="## About&#10;&#10;Describe your project with **markdown**..." />
          </Field>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { id: crypto.randomUUID(), title: '', date: '', role: '', category: '', color: '#6750A4', icon: 'Globe', href: '', thumbnail: '', description: '', techStack: [], features: [], status: 'live' as const, repoUrl: '' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Project
      </Button>
    </Section>
  );
}

// ─── Experiences Section ──────────────────────────────────────────────
function ExperiencesSectionEditor({ initial, onSaved }: { initial: Experience[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('experiences', onSaved);
  const update = (i: number, k: keyof Experience, v: string) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Experiences" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((exp, i) => (
        <div key={exp.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">{exp.title || `Experience ${i + 1}`}</span>
            <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </IconButton>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Title"><Input value={exp.title} onChange={(v) => update(i, 'title', v)} /></Field>
            <Field label="Company"><Input value={exp.company} onChange={(v) => update(i, 'company', v)} /></Field>
            <Field label="Location"><Input value={exp.location} onChange={(v) => update(i, 'location', v)} /></Field>
            <Field label="Date Range"><Input value={exp.dateRange} onChange={(v) => update(i, 'dateRange', v)} /></Field>
            <Field label="Logo Color"><Input value={exp.logoColor} onChange={(v) => update(i, 'logoColor', v)} placeholder="#000000" /></Field>
          </div>
          <Field label="Description"><Textarea value={exp.description} onChange={(v) => update(i, 'description', v)} rows={3} /></Field>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { id: crypto.randomUUID(), title: '', company: '', location: '', dateRange: '', description: '', logoColor: '#6750A4' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Experience
      </Button>
    </Section>
  );
}

// ─── Education Section ────────────────────────────────────────────────
function EducationSectionEditor({ initial, onSaved }: { initial: Education[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('education', onSaved);
  const update = (i: number, k: keyof Education, v: string) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Education" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((edu, i) => (
        <div key={edu.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">{edu.institution || `Education ${i + 1}`}</span>
            <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </IconButton>
          </div>
          <Field label="Institution"><Input value={edu.institution} onChange={(v) => update(i, 'institution', v)} /></Field>
          <Field label="Degree"><Input value={edu.degree} onChange={(v) => update(i, 'degree', v)} /></Field>
          <Field label="Year"><Input value={edu.year} onChange={(v) => update(i, 'year', v)} /></Field>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { id: crypto.randomUUID(), institution: '', degree: '', year: '' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Education
      </Button>
    </Section>
  );
}

// ─── Testimonials Section ─────────────────────────────────────────────
function TestimonialsSectionEditor({ initial, onSaved }: { initial: Testimonial[]; onSaved: () => void }) {
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const { save, saving, saved, error } = useSave('testimonials', onSaved);
  const update = (i: number, k: keyof Testimonial, v: string) =>
    setItems((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));

  return (
    <Section label="Testimonials" onSave={() => save(items)} saving={saving} saved={saved} error={error}>
      {items.map((t, i) => (
        <div key={t.id} className="p-3 border border-border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">{t.name || `Testimonial ${i + 1}`}</span>
            <IconButton variant="ghost" size="sm" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </IconButton>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><Input value={t.name} onChange={(v) => update(i, 'name', v)} /></Field>
            <Field label="Role"><Input value={t.role} onChange={(v) => update(i, 'role', v)} /></Field>
          </div>
          <Field label="Avatar URL"><Input value={t.avatar ?? ''} onChange={(v) => update(i, 'avatar', v)} placeholder="https://..." /></Field>
          <Field label="Quote"><Textarea value={t.quote} onChange={(v) => update(i, 'quote', v)} rows={3} /></Field>
        </div>
      ))}
      <Button variant="outlined" size="sm" onClick={() => setItems((arr) => [...arr, { id: crypto.randomUUID(), name: '', role: '', quote: '', avatar: '' }])} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add Testimonial
      </Button>
    </Section>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────
interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user } = useAuth();
  const { data, refresh } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'themes' | 'settings' | 'analytics'>('portfolio');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop — identical to CustomLogin */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-tertiary/15 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, 60, 0], y: [0, 80, 0], scale: [1, 0.8, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 right-1/3 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"
              />
            </div>
          </motion.div>

          {/* Bottom sheet — identical structure to CustomLogin */}
          <motion.div
            variants={bottomSheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl mx-0 sm:mx-4"
            style={{ maxHeight: '92vh' }}
          >
            <div className="relative rounded-t-[32px] sm:rounded-t-[36px] overflow-hidden" style={{ maxHeight: '92vh' }}>
              <div className="absolute inset-0 bg-surface/95 dark:bg-surface/95 backdrop-blur-[40px]" />

              <div className="relative flex flex-col" style={{ maxHeight: '92vh' }}>
                {/* Drag handle */}
                <div className="pt-3 pb-0 flex-shrink-0">
                  <div className="sheet-handle" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline/10 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-base">Admin Panel</h2>
                  </div>
                  <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
                    <X className="w-4 h-4" />
                  </IconButton>
                </div>

                {/* Tabs */}
                {user?.is_admin && (
                  <div className="flex border-b border-outline/10 flex-shrink-0">
                    {(['portfolio', 'themes', 'analytics', 'settings'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {tab === 'themes' ? (
                          <span className="flex items-center justify-center gap-1">
                            <Palette className="w-3.5 h-3.5" />Themes
                          </span>
                        ) : tab === 'analytics' ? (
                          <span className="flex items-center justify-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5" />Analytics
                          </span>
                        ) : tab === 'portfolio' ? 'Portfolio' : 'Settings'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {!user?.is_admin ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Admin access required.</p>
                    </div>
                  ) : activeTab === 'portfolio' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground pb-1">Changes are saved to the database and reflected live.</p>
                      <ProfileSection initial={data.profile} onSaved={refresh} />
                      <IntroSectionEditor initial={data.intro} onSaved={refresh} />
                      <SkillsSectionEditor initial={data.skills} onSaved={refresh} />
                      <LanguagesSectionEditor initial={data.languages} onSaved={refresh} />
                      <SocialLinksSectionEditor initial={data.social_links} onSaved={refresh} />
                      <ContactsSectionEditor initial={data.contacts} onSaved={refresh} />
                      <ProjectsSectionEditor initial={data.projects} onSaved={refresh} />
                      <ExperiencesSectionEditor initial={data.experiences} onSaved={refresh} />
                      <EducationSectionEditor initial={data.education} onSaved={refresh} />
                      <TestimonialsSectionEditor initial={data.testimonials ?? []} onSaved={refresh} />
                    </div>
                  ) : activeTab === 'themes' ? (
                    <ThemeBuilder />
                  ) : activeTab === 'analytics' ? (
                    <AnalyticsDashboard />
                  ) : (
                    <SiteSettings />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
