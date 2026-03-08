import { motion } from 'framer-motion';
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  TrendingUp,
  Code2,
  Palette,
  Globe,
  Zap,
  Heart
} from 'lucide-react';
import { bentoItem, containerVariants } from '@/lib/motion-presets';

interface BentoItem {
  id: string;
  title: string;
  value?: string;
  description: string;
  icon: React.ElementType;
  color: string;
  size: 'small' | 'medium' | 'large' | 'wide';
  trend?: { value: number; positive: boolean };
}

const bentoItems: BentoItem[] = [
  {
    id: 'projects',
    title: 'Projects',
    value: '24',
    description: 'Completed projects',
    icon: Briefcase,
    color: 'from-primary to-primary/70',
    size: 'medium',
    trend: { value: 12, positive: true },
  },
  {
    id: 'experience',
    title: 'Experience',
    value: '7+',
    description: 'Years of experience',
    icon: TrendingUp,
    color: 'from-secondary to-secondary/70',
    size: 'small',
  },
  {
    id: 'education',
    title: 'Education',
    value: '6',
    description: 'Degrees & certifications',
    icon: GraduationCap,
    color: 'from-tertiary to-tertiary/70',
    size: 'medium',
  },
  {
    id: 'skills',
    title: 'Tech Stack',
    description: 'React, TypeScript, Node.js, Python, AWS, Docker',
    icon: Code2,
    color: 'from-gopix-cyan to-gopix-cyan/70',
    size: 'wide',
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    value: '15',
    description: 'Client reviews',
    icon: Heart,
    color: 'from-gopix-rose to-gopix-rose/70',
    size: 'small',
    trend: { value: 8, positive: true },
  },
  {
    id: 'awards',
    title: 'Awards',
    value: '5',
    description: 'Industry recognition',
    icon: Award,
    color: 'from-gopix-amber to-gopix-amber/70',
    size: 'small',
  },
  {
    id: 'design',
    title: 'Design System',
    description: 'Material 3 + Gopix hybrid aesthetic',
    icon: Palette,
    color: 'from-gopix-magenta to-gopix-magenta/70',
    size: 'medium',
  },
  {
    id: 'global',
    title: 'Global Reach',
    description: 'Working with clients worldwide',
    icon: Globe,
    color: 'from-gopix-lime to-gopix-lime/70',
    size: 'large',
  },
];

export function BentoDashboard() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className="mb-16"
    >
      <div className="mb-8">
        <motion.h2 
          variants={bentoItem(0)}
          className="text-headline-sm font-medium text-foreground mb-2"
        >
          Dashboard
        </motion.h2>
        <motion.p 
          variants={bentoItem(1)}
          className="text-body-md text-muted-foreground"
        >
          Quick overview of my work and achievements
        </motion.p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px]">
        {bentoItems.map((item, index) => {
          const Icon = item.icon;
          const sizeClasses = {
            small: 'col-span-1 row-span-1',
            medium: 'col-span-1 md:col-span-2 row-span-1',
            large: 'col-span-2 row-span-2',
            wide: 'col-span-2 row-span-1',
          };

          return (
            <motion.div
              key={item.id}
              variants={bentoItem(index)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-3xl ${sizeClasses[item.size]} group cursor-pointer`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-90`} />
              
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                  backgroundSize: '20px 20px',
                }} />
              </div>

              {/* Glow Effect */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-white/20 blur-xl"
              />

              {/* Content */}
              <div className="relative h-full p-5 flex flex-col justify-between text-white">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  
                  {item.trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-label-sm ${
                      item.trend.positive ? 'bg-white/20' : 'bg-error/20'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${item.trend.positive ? '' : 'rotate-180'}`} />
                      <span>{item.trend.value}%</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div>
                  {item.value && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="text-display-sm font-bold mb-1"
                    >
                      {item.value}
                    </motion.div>
                  )}
                  <h3 className="text-title-sm font-medium mb-1">{item.title}</h3>
                  <p className="text-body-sm text-white/70 line-clamp-2">{item.description}</p>
                </div>

                {/* Hover Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
              </div>

              {/* Bottom Shine */}
              <motion.div
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
              />
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
