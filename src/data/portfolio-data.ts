import type { Project, Experience, Education, Testimonial, Contact, SocialLink, Language } from '@/types';

export const profileData = {
  name: 'Henry Walker',
  pronouns: 'he/him',
  verified: true,
  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  about: 'Brooklyn based full-stack software engineer with 7+ years of experience in building web and mobile apps.',
};

export const contactInfo = [
  { id: '1', type: 'email', label: 'hey@henrywalker.com', value: 'hey@henrywalker.com', href: 'mailto:hey@henrywalker.com', icon: 'Mail' },
  { id: '2', type: 'website', label: 'henrywalker.com', value: 'henrywalker.com', href: 'https://henrywalker.com', icon: 'Globe' },
  { id: '3', type: 'phone', label: '555-1234-5678', value: '555-1234-5678', href: 'tel:555-1234-5678', icon: 'Phone' },
];

export const skills = [
  'JavaScript',
  'React',
  'Python',
  'Git',
  'Agile',
  'CI/CD',
  'Node.js',
  'Docker',
  'MongoDB',
  'Typescript',
  'AWS',
];

export const languages: Language[] = [
  { name: 'English', flag: '🇬🇧' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'Chinese', flag: '🇨🇳' },
];

export const socialLinks: SocialLink[] = [
  { platform: 'X', href: 'https://x.com', icon: 'Twitter' },
  { platform: 'Threads', href: 'https://threads.net', icon: 'AtSign' },
  { platform: 'Instagram', href: 'https://instagram.com', icon: 'Instagram' },
  { platform: 'LinkedIn', href: 'https://linkedin.com', icon: 'Linkedin' },
  { platform: 'GitHub', href: 'https://github.com', icon: 'Github' },
  { platform: 'YouTube', href: 'https://youtube.com', icon: 'Youtube' },
];

export const introContent = {
  paragraphs: [
    "I'm Henry Walker, a product engineer from Brooklyn, New York City. My expertise lies in developing innovative and user-focused products for both web and mobile platforms, where I emphasize intuitive design and robust functionality.",
    "Holding a Master's degree in Computer Science from the Nova University of Science and Technology, my journey began in a dynamic startup, progressing to lead positions in established tech firms.",
  ],
};

export const projects: Project[] = [
  {
    id: '1',
    title: 'Interactive Data Dashboard',
    date: 'Jan 24, 2024',
    role: 'Frontend Lead',
    category: 'Internal Tools',
    color: '#FDBA74',
    icon: 'LayoutDashboard',
  },
  {
    id: '2',
    title: 'Personal Finance Tracker',
    date: 'Mar 15, 2024',
    role: 'Frontend Developer',
    category: 'Fintech',
    color: '#A78BFA',
    icon: 'Wallet',
  },
  {
    id: '3',
    title: 'Collaborative Coding Environment',
    date: 'Jan 12, 2024',
    role: 'Frontend Developer',
    category: 'Developer Tools',
    color: '#86EFAC',
    icon: 'Code2',
  },
];

export const experiences: Experience[] = [
  {
    id: '1',
    title: 'Frontend Lead',
    company: 'Alpha',
    location: 'Cupertino, CA',
    dateRange: 'Jan 24 - Present',
    description: 'Spearheaded the development of a suite of progressive web applications using React and Swift, and GraphQL.',
    logoColor: '#DC2626',
  },
  {
    id: '2',
    title: 'Frontend Engineer',
    company: 'Sigma',
    location: 'New York, NY',
    dateRange: 'Sep 22 - Dec 23',
    description: 'Enhanced user interfaces for the Sigma Web Player using React and Redux, achieving a 25% increase in user engagement.',
    logoColor: '#22C55E',
  },
];

export const education: Education[] = [
  {
    id: '1',
    institution: 'Nova University of Science and Technology',
    degree: 'Master of Science in Computer Science',
    year: '2015 - 2016',
  },
  {
    id: '2',
    institution: 'Brooklyn Institute of Technology',
    degree: 'Bachelor of Science in Software Engineering',
    year: '2011 - 2015',
  },
  {
    id: '3',
    institution: 'Meta',
    degree: 'Advanced Frontend Architecture Certification',
    year: '2022',
  },
  {
    id: '4',
    institution: 'Le Wagon',
    degree: 'Full Stack Web Development Certification',
    year: '2017',
  },
  {
    id: '5',
    institution: 'Google',
    degree: 'UX Design Professional Certificate',
    year: '2019',
  },
  {
    id: '6',
    institution: 'Amazon Web Services',
    degree: 'AWS Certified Solutions Architect',
    year: '2020',
  },
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Evelyn Brooks',
    role: 'Lead Engineer at Sigma, managed Henry directly',
    quote: "Having worked alongside Henry at Sigma, I've been consistently impressed by his exceptional skills as a frontend engineer. Henry's hands-on approach and dedication to building robust web and mobile applications have greatly contributed to our project's success.",
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Raj Patel',
    role: 'Junior Software Engineer at Omega, worked with Henry on the same team',
    quote: "Henry's expertise has been crucial in turning our ambitious project ideas into reality at Omega. His proficiency in both front-end and back-end development ensures a seamless integration of features, delivering a user experience that's both intuitive and high-performing.",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
];

export const fullContacts: Contact[] = [
  { id: '1', type: 'email', label: 'Email', value: 'hey@henrywalker.com', href: 'mailto:hey@henrywalker.com', icon: 'Mail' },
  { id: '2', type: 'phone', label: 'Phone', value: '+555 123 4567', href: 'tel:+5551234567', icon: 'Phone' },
  { id: '3', type: 'meeting', label: 'Meeting', value: 'Book call', href: 'https://cal.com/justinfarrugia/30min', icon: 'Calendar' },
  { id: '4', type: 'website', label: 'Website', value: 'henrywalker.com', href: 'https://henrywalker.com', icon: 'Globe' },
  { id: '5', type: 'twitter', label: 'X (Twitter)', value: '@henrywalker', href: 'https://x.com', icon: 'Twitter' },
  { id: '6', type: 'linkedin', label: 'LinkedIn', value: '/henryw', href: 'https://linkedin.com', icon: 'Linkedin' },
];
