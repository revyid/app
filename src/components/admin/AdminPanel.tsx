import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ChevronDown, ChevronUp, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPortfolioData, upsertPortfolioSection } from '@/lib/auth';
import { Button, IconButton } from '@/components/ui/button';
import { bottomSheetContent, modalBackdrop } from '@/lib/motion-presets';

// ─── Types ──────────────────────────────────────────────────────────
type Section = 'profile' | 'projects' | 'experiences' | 'education' | 'skills' | 'social_links' | 'contacts' | 'languages' | 'intro';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'intro', label: 'Intro' },
  { key: 'projects', label: 'Projects' },
  { key: 'experiences', label: 'Experiences' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'social_links', label: 'Social Links' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'languages', label: 'Languages' },
];

// ─── JSON Editor ─────────────────────────────────────────────────────
function JsonEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-48 font-mono text-xs p-3 rounded-lg border resize-y bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          error ? 'border-destructive' : 'border-border'
        }`}
        spellCheck={false}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Section Panel ────────────────────────────────────────────────────
function SectionPanel({
  sectionKey,
  label,
  initialData,
  onSaved,
}: {
  sectionKey: Section;
  label: string;
  initialData: unknown;
  onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [jsonStr, setJsonStr] = useState(() => JSON.stringify(initialData ?? (isArraySection(sectionKey) ? [] : {}), null, 2));
  const [jsonError, setJsonError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function isArraySection(s: Section) {
    return ['projects', 'experiences', 'education', 'skills', 'social_links', 'contacts', 'languages'].includes(s);
  }

  const handleSave = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
      setJsonError(undefined);
    } catch {
      setJsonError('Invalid JSON');
      return;
    }

    setSaving(true);
    const result = await upsertPortfolioSection(sectionKey, parsed);
    setSaving(false);

    if (result.error) {
      setJsonError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    }
  };

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
            <div className="p-4 space-y-3">
              <JsonEditor value={jsonStr} onChange={setJsonStr} error={jsonError} />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saved ? 'Saved!' : 'Save'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────
interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPortfolioData();
      setPortfolioData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && user?.is_admin) {
      loadData();
    }
  }, [isOpen, user?.is_admin, loadData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            {...modalBackdrop}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...bottomSheetContent}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] flex flex-col rounded-t-2xl bg-background border-t border-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-base">Admin Panel</h2>
              </div>
              <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
                <X className="w-4 h-4" />
              </IconButton>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {!user?.is_admin ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Admin access required.</p>
                </div>
              ) : loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive text-sm">{error}</div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground pb-1">
                    Edit portfolio data. Changes are saved to the database and reflected live.
                  </p>
                  {SECTIONS.map(({ key, label }) => (
                    <SectionPanel
                      key={key}
                      sectionKey={key}
                      label={label}
                      initialData={portfolioData[key]}
                      onSaved={loadData}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
