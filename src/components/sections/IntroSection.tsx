import { memo } from 'react';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolioStore } from '@/stores/portfolio-store';

export const IntroSection = memo(function IntroSection() {
  const data = usePortfolioStore((s) => s.data);

  return (
    <section className="mb-10 relative overflow-hidden py-6 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-[32px]">
      {/* Static CSS blob decorations — no JS animation cost */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -left-12 w-32 h-32 rounded-full bg-tertiary/12 blur-2xl" />
        <div className="absolute -bottom-12 right-1/4 w-40 h-40 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Subtle tint — no blur cost */}
      <div className="absolute inset-0 bg-background/60 z-[1]" />

      {/* Content */}
      <div className="relative z-10 w-full sm:w-2/3 p-4 sm:p-0" data-aos="fade-up" data-aos-delay="100">
        <SectionLabel text="Intro" />
        <div className="space-y-4">
          {data.intro.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-body-lg text-foreground leading-relaxed" data-aos="fade-up" data-aos-delay={200 + index * 100}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
});
