import type { Project, Experience, Education, Testimonial, Contact, SocialLink, Language } from '@/types';

export const profileData = {
  name: 'Revy',
  pronouns: 'he/him',
  verified: true,
  image: 'https://scontent.fdjb3-1.fna.fbcdn.net/v/t1.15752-9/643924451_1568867384412033_1644968556563542165_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=fc17b8&efg=eyJxZV9ncm91cHMiOlsiaWdkX2Jlc3RfZWZmb3J0X2ltYWdlOmNvbnRyb2wiXX0%3D&_nc_ohc=EnT2yurEBykQ7kNvwGa2RWR&_nc_oc=AdnEKoxUJMz3LJ6CP5JTHsVUubuCAAMI4dCBT2q9zhWTIYDjKzg5PJRHu5gWiVB8VJA&_nc_zt=23&_nc_ht=scontent.fdjb3-1.fna&_nc_ss=8&oh=03_Q7cD4wGbnq5XFiQKnZZTUqmQeQrRU5TtA6XE02qKxye2_JtUkQ&oe=69D48A14',
  about: 'I am a full-stack software engineer with 2+ years of experience in building web and mobile apps.',
};

export const contactInfo = [
  { id: '1', type: 'email', label: 'revy8k@gmail.com', value: 'revy8k@gmail.com', href: 'mailto:revy8k@gmail.com', icon: 'Mail' },
  { id: '2', type: 'website', label: 'revy.my.id', value: 'revy.my.id', href: 'https://revy.my.id', icon: 'Globe' },
  { id: '3', type: 'phone', label: '+62 812-3456-7890', value: '+62 812-3456-7890', href: 'tel:+6281234567890', icon: 'Phone' },
];

export const skills = [
  'JavaScript',
  'React',
  'Python',
  'Git',
  'CI/CD',
  'Node.js',
  'Docker',
  'MongoDB',
  'Typescript',
];

export const languages: Language[] = [
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'English', flag: '🇬🇧' },
];

export const socialLinks: SocialLink[] = [
  { platform: 'X', href: 'https://x.com', icon: 'Twitter' },
  { platform: 'Threads', href: 'https://threads.net', icon: 'AtSign' },
  { platform: 'Instagram', href: 'https://instagram.com/revy.id', icon: 'Instagram' },
  { platform: 'LinkedIn', href: 'https://linkedin.com', icon: 'Linkedin' },
  { platform: 'GitHub', href: 'https://github.com/revyid', icon: 'Github' },
  { platform: 'YouTube', href: 'https://youtube.com', icon: 'Youtube' },
];

export const introContent = {
  paragraphs: [
    "I'm Revy, a software engineer from Jambi, Indonesia. My expertise lies in developing innovative and user-focused products for both web and mobile platforms, where I emphasize intuitive design and robust functionality.",
    "Holding a Master's degree in Computer Science from the Senior High School 1 Bungo, my journey began in a dynamic startup, progressing to lead positions in established tech firms.",
  ],
};

export const projects: Project[] = [
  {
    id: '1',
    title: 'Redeploy',
    date: 'Feb 24, 2026',
    role: 'Fullstack Developer',
    category: 'Developer Tools',
    color: '#cf00b3ff',
    icon: 'LayoutDashboard',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    href: 'https://deploy.revy.my.id',
  },
  {
    id: '2',
    title: 'Redeploy CLI',
    date: 'Mar 15, 2024',
    role: 'Backend / CLI Developer',
    category: 'DevOps Tool',
    color: '#A78BFA',
    icon: 'Terminal',
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80',
    href: 'https://github.com/revyid/redeploy-cli',
  },
  {
    id: '3',
    title: 'IP Geolocation',
    date: 'Jan 12, 2024',
    role: 'Fullstack Developer',
    category: 'Web Application',
    color: '#86EFAC',
    icon: 'Globe',
    thumbnail: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
    href: 'https://ipgeo.revy.my.id',
  }
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
    name: 'Unknown',
    role: 'Unknown',
    quote: "Unknown",
    avatar: '',
  },
];

export const fullContacts: Contact[] = [
  { id: '1', type: 'email', label: 'Email', value: 'revy8k@gmail.com', href: 'mailto:revy8k@gmail.com', icon: 'Mail' },
  { id: '2', type: 'phone', label: 'Phone', value: '+62 812345678', href: 'tel:+62812345678', icon: 'Phone' },
  { id: '3', type: 'meeting', label: 'Meeting', value: 'Book call', href: 'https://cal.com/justinfarrugia/30min', icon: 'Calendar' },
  { id: '4', type: 'website', label: 'Website', value: 'revy.my.id', href: 'https://revy.my.id', icon: 'Globe' },
  { id: '5', type: 'twitter', label: 'X (Twitter)', value: '@henrywalker', href: 'https://x.com', icon: 'Twitter' },
  { id: '6', type: 'linkedin', label: 'LinkedIn', value: '/henryw', href: 'https://linkedin.com', icon: 'Linkedin' },
];
