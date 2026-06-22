import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';

export function AboutSection() {
  const { data } = usePortfolio();
  return (
    <div className="mb-6">
      <SectionLabel text="About" />
      <p className="text-body-sm text-muted-foreground leading-relaxed break-words">
        {data.profile.about}
      </p>
    </div>
  );
}
