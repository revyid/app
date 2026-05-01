import { useEffect, lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { IntroSection } from '@/components/sections/IntroSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { EducationSection } from '@/components/sections/EducationSection';
import { ContactFullSection } from '@/components/sections/ContactFullSection';
import { Footer } from '@/components/sections/Footer';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useActiveSection } from '@/contexts/ActiveSectionContext';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

const PublicAnalytics = lazy(() => import('@/components/shared/PublicAnalytics').then(m => ({ default: m.PublicAnalytics })));

const SECTION_IDS = ['about', 'projects', 'experience', 'education', 'contact'];

/**
 * Thin divider between major sections — adds visual breathing room.
 */
const SectionDivider = memo(function SectionDivider() {
  return (
    <div className="py-2">
      <div className="h-px bg-gradient-to-r from-transparent via-outline/20 to-transparent" />
    </div>
  );
});

export function HomePage() {
  const activeId = useScrollSpy(SECTION_IDS);
  const { setActiveSection } = useActiveSection();

  useEffect(() => {
    setActiveSection(activeId);
    return () => setActiveSection('');
  }, [activeId, setActiveSection]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Intro */}
      <motion.div variants={itemVariants}>
        <IntroSection />
      </motion.div>

      <SectionDivider />

      {/* Skills */}
      <motion.div
        id="skills"
        className="scroll-mt-24"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}
      >
        <SkillsSection />
      </motion.div>

      <SectionDivider />

      {/* Projects */}
      <motion.div
        id="projects"
        className="scroll-mt-24"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
      >
        <ProjectsSection />
      </motion.div>

      <SectionDivider />

      <motion.div
        id="analytic"
        className="scroll-mt-24"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
      >
        {/* Analytics — lazy, low-priority */}
        <Suspense fallback={<div className="mb-10 h-96 animate-pulse bg-surface-container/20 rounded-3xl" />}>
          <PublicAnalytics />
        </Suspense>
      </motion.div>


      {/* Experience & Testimonials */}
      <motion.div
        id="experience"
        className="scroll-mt-24"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
      >
        <ExperienceSection />
        <TestimonialsSection />
      </motion.div>

      <SectionDivider />

      {/* Education */}
      <motion.div
        id="education"
        className="scroll-mt-24"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}
      >
        <EducationSection />
      </motion.div>

      <SectionDivider />

      {/* Contact */}
      <motion.div
        id="contact"
        className="scroll-mt-24"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={containerVariants}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}
      >
        <ContactFullSection />
      </motion.div>

      <Footer />
    </motion.div>
  );
}
