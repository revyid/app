import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Briefcase, 
  GraduationCap, 
  MessageCircle, 
  User,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  label: string;
  icon: React.ElementType;
  sectionId: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { id: 'home', label: 'Home', icon: Home, sectionId: 'home' },
  { id: 'projects', label: 'Projects', icon: Briefcase, sectionId: 'projects' },
  { id: 'experience', label: 'Experience', icon: User, sectionId: 'experience' },
  { id: 'education', label: 'Education', icon: GraduationCap, sectionId: 'education' },
  { id: 'testimonials', label: 'Testimonials', icon: Sparkles, sectionId: 'testimonials' },
  { id: 'contact', label: 'Contact', icon: MessageCircle, sectionId: 'contact' },
];

export function ContextualBreadcrumbs() {
  const [activeSection, setActiveSection] = useState('home');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show breadcrumbs after scrolling past hero
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);

      // Determine active section
      for (const item of breadcrumbs) {
        const element = document.getElementById(item.sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeIndex = breadcrumbs.findIndex((b) => b.id === activeSection);
  const visibleBreadcrumbs = breadcrumbs.slice(0, activeIndex + 1);

  const handleClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-1 px-4 py-2 rounded-full glass-dark shadow-elevation-3">
            {visibleBreadcrumbs.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === visibleBreadcrumbs.length - 1;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center"
                >
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />
                  )}
                  <motion.button
                    onClick={() => handleClick(item.sectionId)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-surface-variant text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-label-sm font-medium">{item.label}</span>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mini breadcrumb for mobile
export function MiniBreadcrumbs() {
  const [activeSection, setActiveSection] = useState('home');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);

      for (const item of breadcrumbs) {
        const element = document.getElementById(item.sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeItem = breadcrumbs.find((b) => b.id === activeSection);
  const activeIndex = breadcrumbs.findIndex((b) => b.id === activeSection);

  if (!activeItem) return null;

  const Icon = activeItem.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-4 z-40 md:hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-full glass-dark shadow-elevation-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-label-sm font-bold text-primary-foreground">
                {activeIndex + 1}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-label-sm font-medium text-foreground">
                {activeItem.label}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
