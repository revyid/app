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

const CACHE_KEY = 'revy_portfolio_cache';
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
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

interface PortfolioContextType {
  data: PortfolioData;
  isLoading: boolean;
  hasLoaded: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  data: defaultData,
  isLoading: true,
  hasLoaded: false,
  refresh: async () => {},
});

export const usePortfolio = () => useContext(PortfolioContext);

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

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortfolioData>(() => loadCache() ?? defaultData);
  const [isLoading, setIsLoading] = useState(() => !loadCache());
  const [hasLoaded, setHasLoaded] = useState(() => !!loadCache());
  const hasLoadedRef = useRef(!!loadCache());

  const markLoaded = useCallback(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setHasLoaded(true);
    }
  }, []);

  const refresh = useCallback(async (force?: boolean) => {
    if (force) clearCache();
    const cached = loadCache();
    if (cached && !force) {
      setData(cached);
      setIsLoading(false);
      markLoaded();
      // background refresh
      getAllPortfolioData().then(raw => {
        const fresh = buildFresh(raw as Record<string, unknown>);
        setData(fresh);
        saveCache(fresh);
      }).catch(() => {});
      return;
    }
    try {
      const raw = await getAllPortfolioData();
      const fresh = buildFresh(raw as Record<string, unknown>);
      setData(fresh);
      saveCache(fresh);
    } catch {
      // fall back to static data
    } finally {
      setIsLoading(false);
      markLoaded();
    }
  }, [markLoaded]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PortfolioContext.Provider value={{ data, isLoading, hasLoaded, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}
