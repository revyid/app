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
  refresh: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  data: defaultData,
  isReady: false,
  refresh: async () => {},
});

export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortfolioData>(defaultData);
  const [isReady, setIsReady] = useState(false);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) { console.log('[Portfolio] BLOCKED - already fetching'); return; }
    fetchingRef.current = true;
    console.log('[Portfolio] START fetch');

    try {
      const raw = await getAllPortfolioData();
      console.log('[Portfolio] RAW keys:', Object.keys(raw), '| profile:', (raw.profile as any)?.name);
      if (Object.keys(raw).length > 0) {
        const fresh = buildFresh(raw);
        console.log('[Portfolio] BUILT profile.name:', fresh.profile.name);
        setData(fresh);
        console.log('[Portfolio] setData DONE');
      } else {
        console.log('[Portfolio] RAW EMPTY - keeping default');
      }
    } catch (err) {
      console.error('[Portfolio] FETCH ERROR:', err);
    } finally {
      fetchingRef.current = false;
      setIsReady(true);
      console.log('[Portfolio] isReady=true');
    }
  }, []);

  useEffect(() => { refresh(); }, []);

  return (
    <PortfolioContext.Provider value={{ data, isReady, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}
