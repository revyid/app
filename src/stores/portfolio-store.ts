import { create } from 'zustand';
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
  easter_egg?: { name: string; image: string; shortcut?: string };
}

export interface IntroData { paragraphs: string[] }

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

// ─── localStorage cache layer (design decision — Phase 6) ──────────────
// The homepage loads portfolio data via getAllPortfolioData() in lib/auth.ts,
// which calls the Supabase RPC `get_all_portfolio_data` directly (NOT via
// /api/portfolio). This localStorage cache sits in front of that RPC to avoid
// a round-trip on every page load: on first visit we fetch + cache; on
// subsequent visits within CACHE_TTL we serve from cache, then revalidate.
//
// This is SEPARATE from the HTTP cache on /api/portfolio (s-maxage=3600),
// which only benefits EXTERNAL consumers of the public Portfolio API. The
// homepage doesn't go through /api/portfolio, so the HTTP cache doesn't help
// the homepage — the localStorage cache does.
//
// Decision: KEEP both layers. They serve different consumers:
//   - localStorage cache → homepage client (fast first paint, 5min TTL)
//   - HTTP cache (/api/portfolio) → external API consumers (1h TTL, edge-cached)
// Removing the localStorage layer would add a network round-trip to every
// homepage load, which is a performance regression for the primary user flow.
const CACHE_KEY = 'revy_portfolio_v2';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — shorter than the HTTP cache so
                                 // admin edits show up reasonably fast after
                                 // the admin clears the cache via refresh(true).

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

function loadCache(): PortfolioData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function saveCache(data: PortfolioData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

function buildFresh(raw: Record<string, unknown>): PortfolioData {
  const get = <T,>(key: string, fallback: T): T => {
    const val = raw[key];
    if (val === null || val === undefined) return fallback;
    if (Array.isArray(val) && val.length === 0) return fallback;
    return val as T;
  };

  return {
    profile: get('profile', defaultData.profile),
    intro: get('intro', defaultData.intro),
    projects: get('projects', defaultData.projects),
    experiences: get('experiences', defaultData.experiences),
    education: get('education', defaultData.education),
    skills: get('skills', defaultData.skills),
    social_links: get('social_links', defaultData.social_links),
    contacts: get('contacts', defaultData.contacts),
    languages: get('languages', defaultData.languages),
    testimonials: get('testimonials', defaultData.testimonials),
  };
}

interface PortfolioStore {
  data: PortfolioData;
  isReady: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

let fetching = false;

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  data: loadCache() ?? defaultData,
  isReady: loadCache() !== null,

  refresh: async (force?: boolean) => {
    if (fetching) return;
    fetching = true;

    if (force) clearCache();

    try {
      const raw = await getAllPortfolioData();
      if (Object.keys(raw).length > 0) {
        const fresh = buildFresh(raw);
        set({ data: fresh, isReady: true });
        saveCache(fresh);
      } else {
        set({ isReady: true });
      }
    } catch (err) {
      console.error('[Portfolio] FETCH ERROR:', err);
      set({ isReady: true });
    } finally {
      fetching = false;
    }
  },
}));
