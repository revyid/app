import { SectionLabel } from '@/components/shared/SectionLabel';
import { SkillTag } from '@/components/shared/SkillTag';
import { usePortfolio } from '@/contexts/PortfolioContext';

export function SkillsSection() {
  const { data } = usePortfolio();
  return (
    <div className="mb-6">
      <SectionLabel text="Skills" />
      <div className="flex flex-wrap gap-2">
        {data.skills.map((skill) => (
          <SkillTag key={skill} skill={skill} />
        ))}
      </div>
    </div>
  );
}
