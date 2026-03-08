import { motion } from 'framer-motion';
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  TrendingUp,
  Code2,
  Palette,
  Globe,
  Heart,
  ArrowUpRight
} from 'lucide-react';
import { fluidSurface, containerVariants, SPRING_BOUNCY } from '@/lib/motion-presets';

interface FluidItem {
  id: string;
  title: string;
  value?: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  height: 'compact' | 'regular' | 'tall' | 'hero';
  trend?: { value: number; positive: boolean };
}

const fluidItems: FluidItem[] = [
  {
    id: 'projects',
    title: 'Projects',
    value: '24',
    description: 'Completed projects with real-world impact',
    icon: Briefcase,
    gradient: 'from-primary to-primary/80',
    height: 'hero',
    trend: { value: 12, positive: true },
  },
  {
    id: 'experience',
    title: 'Experience',
    value: '7+',
    description: 'Years building products',
    icon: TrendingUp,
    gradient: 'from-secondary to-secondary/80',
    height: 'compact',
  },
  {
    id: 'education',
    title: 'Education',
    value: '6',
    description: 'Degrees & certifications earned',
    icon: GraduationCap,
    gradient: 'from-tertiary to-tertiary/80',
    height: 'regular',
  },
  {
    id: 'skills',
    title: 'Tech Stack',
    description: 'React · TypeScript · Node.js · Python · AWS · Docker',
    icon: Code2,
    gradient: 'from-primary/90 to-primary/60',
    height: 'regular',
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    value: '15',
    description: 'Client reviews & endorsements',
    icon: Heart,
    gradient: 'from-secondary/90 to-secondary/60',
    height: 'compact',
    trend: { value: 8, positive: true },
  },
  {
    id: 'awards',
    title: 'Awards',
    value: '5',
    description: 'Industry recognition',
    icon: Award,
    gradient: 'from-tertiary/90 to-tertiary/60',
    height: 'compact',
  },
  {
    id: 'design',
    title: 'Design System',
    description: 'Strict Material 3 aesthetic',
    icon: Palette,
    gradient: 'from-primary/80 to-primary/50',
    height: 'regular',
  },
  {
    id: 'global',
    title: 'Global Reach',
    description: 'Working with clients worldwide across multiple timezones',
    icon: Globe,
    gradient: 'from-secondary/80 to-secondary/50',
    height: 'tall',
  },
];

const heightMap = {
  compact: 'min-h-[120px]',
  regular: 'min-h-[160px]',
  tall: 'min-h-[200px]',
  hero: 'min-h-[240px]',
};

export function FluidSurfaces() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={containerVariants}
      className="mb-12"
    >
      <div className="mb-8">
        <motion.h2 
          variants={fluidSurface(0)}
          className="text-headline-sm font-medium text-foreground mb-2"
        >
          Dashboard
        </motion.h2>
        <motion.p 
          variants={fluidSurface(1)}
          className="text-body-md text-muted-foreground"
        >
          Quick overview of my work and achievements
        </motion.p>
      </div>

      {/* Fluid Layered Surfaces — stacked full-width cards */}
      <div className="space-y-4">
        {/* Hero row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fluidItems.slice(0, 2).map((item, index) => (
            <FluidCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* Triple row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {fluidItems.slice(2, 5).map((item, index) => (
            <FluidCard key={item.id} item={item} index={index + 2} />
          ))}
        </div>

        {/* Wide row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fluidItems.slice(5, 8).map((item, index) => (
            <FluidCard key={item.id} item={item} index={index + 5} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FluidCard({ item, index }: { item: FluidItem; index: number }) {
  const Icon = item.icon;

  return (
    <motion.div
      variants={fluidSurface(index)}
      whileHover={{ 
        y: -6, 
        scale: 1.01,
        transition: SPRING_BOUNCY,
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden squircle-card ${heightMap[item.height]} group cursor-pointer`}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-90`} />
      
      {/* Noise grain overlay */}
      <div className="noise-grain absolute inset-0" />

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* Hover glow */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={SPRING_BOUNCY}
        className="absolute inset-0 bg-white/15 blur-2xl"
      />

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between text-primary-foreground z-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.15 }}
            transition={SPRING_BOUNCY}
            className="w-11 h-11 rounded-2xl bg-surface/20 backdrop-blur-sm flex items-center justify-center"
          >
            <Icon className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          
          {item.trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm backdrop-blur-sm ${
              item.trend.positive ? 'bg-surface/20 text-primary-foreground' : 'bg-error text-error-foreground'
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
              transition={{ ...SPRING_BOUNCY, delay: index * 0.08 + 0.2 }}
              className="text-display-sm font-bold mb-1"
            >
              {item.value}
            </motion.div>
          )}
          <h3 className="text-title-sm font-medium mb-1 text-primary-foreground">{item.title}</h3>
          <p className="text-body-sm text-primary-foreground/80 line-clamp-2">{item.description}</p>
        </div>

        {/* Hover arrow */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={SPRING_BOUNCY}
          className="absolute bottom-5 right-5 w-9 h-9 rounded-full bg-surface/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      </div>
      
      {/* Bottom shine line */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface/50 to-transparent"
      />
    </motion.div>
  );
}
