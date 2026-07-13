import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolioStore } from '@/stores/portfolio-store';

export function AboutSection() {
  const data = usePortfolioStore((s) => s.data);
  return (
    <div data-aos="fade-up">
      <SectionLabel text="About" />
      <p className="text-body-sm text-muted-foreground leading-relaxed break-words">
        {data.profile.about}
      </p>
    </div>
  );
}
