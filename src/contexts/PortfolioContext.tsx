import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
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

interface PortfolioContextType {
  data: PortfolioData;
  isLoading: boolean;
  hasLoaded: boolean;
  refresh: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  data: defaultData,
  isLoading: true,
  hasLoaded: false,
  refresh: async () => {},
});

export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortfolioData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await getAllPortfolioData();
      setData(buildFresh(raw as Record<string, unknown>));
    } catch {
      // keep current data on error
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PortfolioContext.Provider value={{ data, isLoading, hasLoaded, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}
