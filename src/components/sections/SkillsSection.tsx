import { SectionLabel } from '@/components/shared/SectionLabel';
import { SkillTag } from '@/components/shared/SkillTag';
import { usePortfolioStore } from '@/stores/portfolio-store';

export function SkillsSection() {
  const data = usePortfolioStore((s) => s.data);
  return (
    <div className="mb-6" data-aos="fade-up">
      <SectionLabel text="Skills" />
      <div className="flex flex-wrap gap-2">
        {data.skills.map((skill, index) => (
          <div key={skill} data-aos="zoom-in" data-aos-delay={index * 50}>
            <SkillTag skill={skill} />
          </div>
        ))}
      </div>
    </div>
  );
}
