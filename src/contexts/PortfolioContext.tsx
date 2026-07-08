import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { getAllPortfolioData } from '@/lib/auth';
import {
  profileData as staticProfile,
  introContent as staticIntro,
  projects as staticProjects,
  experiences as staticExperiences,
  education as staticEducation,
  skills as staticSkills,
  socialLinks as staticSocialLinks,
  contactInfo as staticContacts,
  languages as staticLanguages,
  testimonials as staticTestimonials,
} from '@/data/portfolio-data';
import type { Project, Experience, Education, SocialLink, Contact, Language, Testimonial } from '@/types';

export interface ProfileData {
  name: string;
  pronouns: string;
  verified: boolean;
  image: string;
  about: string;
  role?: string;
  location?: string;
  easter_egg?: {
    name: string;
    image: string;
    shortcut?: string;
  };
}

export interface IntroData {
  paragraphs: string[];
}

export interface PortfolioData {
  profile: ProfileData;
  intro: IntroData;
  projects: Project[];
  experiences: Experience[];
  education: Education[];
  skills: string[];
  social_links: SocialLink[];
  contacts: Contact[];
  languages: Language[];
  testimonials: Testimonial[];
}

// ─── Cache Configuration ────────────────────────────────────────────
const CACHE_KEY = 'revy_portfolio_cache';
const CACHE_META_KEY = 'revy_portfolio_cache_meta';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes primary TTL
const STALE_TTL = 15 * 60 * 1000; // 15 minutes stale TTL (serve stale while revalidate)
const CACHE_VERSION = 1; // bump to invalidate all caches

interface CacheMeta {
  ts: number;
  version: number;
}

interface CacheEntry {
  data: PortfolioData;
  meta: CacheMeta;
}

// ─── Default Data ───────────────────────────────────────────────────
const defaultData: PortfolioData = {
  profile: staticProfile,
  intro: staticIntro,
  projects: staticProjects,
  experiences: staticExperiences,
  education: staticEducation,
  skills: staticSkills,
  social_links: staticSocialLinks,
  contacts: staticContacts,
  languages: staticLanguages,
  testimonials: staticTestimonials,
};

// ─── Cache Helpers (memoized on module level) ────────────────────────
function loadCacheEntry(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const metaRaw = localStorage.getItem(CACHE_META_KEY);
    if (!raw || !metaRaw) return null;

    const meta: CacheMeta = JSON.parse(metaRaw);
    // Version check for cache invalidation
    if (meta.version !== CACHE_VERSION) {
      clearPortfolioCache();
      return null;
    }
    const age = Date.now() - meta.ts;
    // Beyond stale TTL → treat as expired
    if (age > STALE_TTL) {
      clearPortfolioCache();
      return null;
    }
    const data: PortfolioData = JSON.parse(raw);
    return { data, meta };
  } catch {
    clearPortfolioCache();
    return null;
  }
}

function isCacheStale(entry: CacheEntry): boolean {
  return Date.now() - entry.meta.ts > CACHE_TTL;
}

function saveCache(data: PortfolioData) {
  try {
    const meta: CacheMeta = { ts: Date.now(), version: CACHE_VERSION };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearPortfolioCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_META_KEY);
  } catch {
    /* ignore */
  }
}

// ─── Context Type ───────────────────────────────────────────────────
interface PortfolioContextType {
  data: PortfolioData; // merged (db + static fallback) for public display
  dbData: Partial<PortfolioData> | null; // raw db data only, null = not fetched yet
  isLoading: boolean; // initial load
  isFetching: boolean; // background refresh in progress
  error: string | null; // last error
  refresh: (force?: boolean) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  data: defaultData,
  dbData: null,
  isLoading: true,
  isFetching: false,
  error: null,
  refresh: async () => {},
});

export const usePortfolio = () => useContext(PortfolioContext);

// ─── Build Helpers ──────────────────────────────────────────────────
function buildFresh(raw: Record<string, unknown>): PortfolioData {
  return {
    profile: (raw.profile as ProfileData) ?? defaultData.profile,
    intro: (raw.intro as IntroData) ?? defaultData.intro,
    projects: (raw.projects as Project[]) ?? defaultData.projects,
    experiences: (raw.experiences as Experience[]) ?? defaultData.experiences,
    education: (raw.education as Education[]) ?? defaultData.education,
    skills: (raw.skills as string[]) ?? defaultData.skills,
    social_links: (raw.social_links as SocialLink[]) ?? defaultData.social_links,
    contacts: (raw.contacts as Contact[]) ?? defaultData.contacts,
    languages: (raw.languages as Language[]) ?? defaultData.languages,
    testimonials: (raw.testimonials as Testimonial[]) ?? defaultData.testimonials,
  };
}

function buildDbData(raw: Record<string, unknown>): Partial<PortfolioData> {
  const result: Partial<PortfolioData> = {};
  if (raw.profile !== undefined) result.profile = raw.profile as ProfileData;
  if (raw.intro !== undefined) result.intro = raw.intro as IntroData;
  if (raw.projects !== undefined) result.projects = raw.projects as Project[];
  if (raw.experiences !== undefined) result.experiences = raw.experiences as Experience[];
  if (raw.education !== undefined) result.education = raw.education as Education[];
  if (raw.skills !== undefined) result.skills = raw.skills as string[];
  if (raw.social_links !== undefined) result.social_links = raw.social_links as SocialLink[];
  if (raw.contacts !== undefined) result.contacts = raw.contacts as Contact[];
  if (raw.languages !== undefined) result.languages = raw.languages as Language[];
  if (raw.testimonials !== undefined) result.testimonials = raw.testimonials as Testimonial[];
  return result;
}

// ─── Provider ───────────────────────────────────────────────────────
export function PortfolioProvider({ children }: { children: ReactNode }) {
  // Initialize from cache only once
  const initialEntry = useRef<CacheEntry | null>(loadCacheEntry());
  const hasHydrated = useRef(false);

  const [data, setData] = useState<PortfolioData>(() => initialEntry.current?.data ?? defaultData);
  const [dbData, setDbData] = useState<Partial<PortfolioData> | null>(() => {
    // If we have cache, use it as initial dbData so admin panel doesn't spin forever
    if (initialEntry.current) {
      return buildDbData(initialEntry.current.data as unknown as Record<string, unknown>);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => !initialEntry.current);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate fetches
  const fetchInProgress = useRef(false);
  const refresh = useCallback(async (force?: boolean) => {
    // Prevent concurrent fetches — set this synchronously, before any await,
    // so a background revalidation and a forced refresh (e.g. AdminPanel
    // opening while a fetch is already in flight) can never both slip past
    // the guard and race each other.
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      if (force) clearPortfolioCache();

      const cached = loadCacheEntry();

      // Fast path: valid cache, no force → serve cache + background refresh
      if (cached && !force && !isCacheStale(cached)) {
        setData(cached.data);
        setDbData(buildDbData(cached.data as unknown as Record<string, unknown>));
        setIsLoading(false);
        // Silent background refresh
        setIsFetching(true);
        try {
          const raw = await getAllPortfolioData();
          const r = raw as Record<string, unknown>;
          const fresh = buildFresh(r);
          const dbOnly = buildDbData(r);
          setData(fresh);
          setDbData(dbOnly);
          saveCache(fresh);
          setError(null);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Background refresh failed';
          console.warn('[Portfolio] Background refresh failed:', msg);
          // Keep existing data, don't show error for background refresh
        } finally {
          setIsFetching(false);
        }
        return;
      }

      // Stale cache → serve immediately + refresh in background
      if (cached && !force && isCacheStale(cached)) {
        setData(cached.data);
        setDbData(buildDbData(cached.data as unknown as Record<string, unknown>));
        setIsLoading(false);
      }

      // Fetch from network
      setIsFetching(true);
      setError(null);

      try {
        const raw = await getAllPortfolioData();
        const r = raw as Record<string, unknown>;
        const fresh = buildFresh(r);
        const dbOnly = buildDbData(r);
        setData(fresh);
        setDbData(dbOnly);
        saveCache(fresh);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load portfolio data';
        console.error('[Portfolio] Fetch failed:', msg);
        setError(msg);
        // If we have cached data, keep using it (stale-while-error)
        if (!cached) {
          // No cache at all → keep static defaults, but mark dbData as empty so admin doesn't hang
          setDbData({});
        }
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      refresh();
    }
  }, [refresh]);

  return (
    <PortfolioContext.Provider value={{ data, dbData, isLoading, isFetching, error, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}
