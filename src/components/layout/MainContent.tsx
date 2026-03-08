import { motion } from 'framer-motion';
import { materialFadeThrough } from '@/lib/motion-presets';
import { IntroSection } from '@/components/sections/IntroSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { EducationSection } from '@/components/sections/EducationSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { ContactFullSection } from '@/components/sections/ContactFullSection';
import { Footer } from '@/components/sections/Footer';

export function MainContent() {
  return (
    <motion.main
      variants={materialFadeThrough}
      initial="initial"
      animate="animate"
      className="flex-1 min-w-0"
    >
      <div id="home">
        <IntroSection />
      </div>
      <div id="projects">
        <ProjectsSection />
      </div>
      <ExperienceSection />
      <div id="education">
        <EducationSection />
      </div>
      <TestimonialsSection />
      <ContactFullSection />
      <Footer />
    </motion.main>
  );
}
