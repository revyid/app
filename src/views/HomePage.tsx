import { useEffect, lazy, Suspense, memo } from 'react';
import { IntroSection } from '@/components/sections/IntroSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { Footer } from '@/components/sections/Footer';
import { MobileSidebarSections } from '@/app/(main)/shell';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useActiveSectionStore } from '@/stores/active-section-store';

const ProjectsSection = lazy(() => import('@/components/sections/ProjectsSection').then(m => ({ default: m.ProjectsSection })));
const ShowcaseSection = lazy(() => import('@/components/sections/ShowcaseSection').then(m => ({ default: m.ShowcaseSection })));
const ExperienceSection = lazy(() => import('@/components/sections/ExperienceSection').then(m => ({ default: m.ExperienceSection })));
const TestimonialsSection = lazy(() => import('@/components/sections/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const EducationSection = lazy(() => import('@/components/sections/EducationSection').then(m => ({ default: m.EducationSection })));
const ContactFullSection = lazy(() => import('@/components/sections/ContactFullSection').then(m => ({ default: m.ContactFullSection })));
const PublicAnalytics = lazy(() => import('@/components/shared/PublicAnalytics').then(m => ({ default: m.PublicAnalytics })));

const SECTION_IDS = ['skills', 'projects', 'stats', 'experience', 'education', 'contact'];

const SectionDivider = memo(function SectionDivider() {
  return (
    <div className="py-2">
      <div className="h-px bg-gradient-to-r from-transparent via-outline/20 to-transparent" />
    </div>
  );
});

export function HomePage() {
  const activeId = useScrollSpy(SECTION_IDS);
  const setActiveSection = useActiveSectionStore((s) => s.setActiveSection);

  useEffect(() => {
    setActiveSection(activeId);
    return () => setActiveSection('');
  }, [activeId, setActiveSection]);

  return (
    <div>
      {/* Mobile: profile sections at top */}
      <MobileSidebarSections />

      <IntroSection />
      <SectionDivider />

      <div id="skills" className="scroll-mt-24">
        <SkillsSection />
      </div>
      <SectionDivider />

      <div id="projects" className="scroll-mt-24">
        <Suspense fallback={<div className="mb-10 h-40 animate-pulse bg-surface-container/20 rounded-3xl" />}>
          <ProjectsSection />
        </Suspense>
      </div>
      <SectionDivider />

      <Suspense fallback={<div className="mb-10 h-32 animate-pulse bg-surface-container/20 rounded-3xl" />}>
        <ShowcaseSection />
      </Suspense>
      <SectionDivider />

      <div id="stats" className="scroll-mt-24">
        <Suspense fallback={<div className="mb-10 h-96 animate-pulse bg-surface-container/20 rounded-3xl" />}>
          <PublicAnalytics />
        </Suspense>
      </div>
      <SectionDivider />

      <div id="experience" className="scroll-mt-24">
        <Suspense fallback={<div className="mb-10 h-40 animate-pulse bg-surface-container/20 rounded-3xl" />}>
          <ExperienceSection />
          <TestimonialsSection />
        </Suspense>
      </div>
      <SectionDivider />

      <div id="education" className="scroll-mt-24">
        <Suspense fallback={<div className="mb-10 h-40 animate-pulse bg-surface-container/20 rounded-3xl" />}>
          <EducationSection />
        </Suspense>
      </div>
      <SectionDivider />

      <div id="contact" className="scroll-mt-24">
        <Suspense fallback={<div className="mb-10 h-40 animate-pulse bg-surface-container/20 rounded-3xl" />}>
          <ContactFullSection />
        </Suspense>
      </div>

      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
