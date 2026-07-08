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

const CACHE_KEY = 'revy_portfolio_v2';
const CACHE_TTL = 5 * 60 * 1000;

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

interface PortfolioContextType {
  data: PortfolioData;
  isReady: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  data: defaultData,
  isReady: false,
  refresh: async () => {},
});

export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const cached = useRef(loadCache());
  const [data, setData] = useState<PortfolioData>(() => cached.current ?? defaultData);
  const [isReady, setIsReady] = useState(() => cached.current !== null);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async (force?: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (force) clearCache();

    try {
      const raw = await getAllPortfolioData();
      if (Object.keys(raw).length > 0) {
        const fresh = buildFresh(raw);
        setData(fresh);
        saveCache(fresh);
      }
    } catch (err) {
      console.error('[PortfolioContext] fetch error:', err);
    } finally {
      fetchingRef.current = false;
      setIsReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, []);

  return (
    <PortfolioContext.Provider value={{ data, isReady, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}
