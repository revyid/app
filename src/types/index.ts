export interface Project {
  id: string;
  title: string;
  date: string;
  role: string;
  category: string;
  color: string;
  icon: string;
  href?: string;
  thumbnail?: string;
  // Detail fields
  description?: string;
  techStack?: string[];
  features?: string[];
  status?: 'live' | 'wip' | 'archived';
  repoUrl?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  dateRange: string;
  description: string;
  logoColor: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar?: string;
}

export interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  href: string;
  icon: string;
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: string;
}

export interface Language {
  name: string;
  flag: string;
}
