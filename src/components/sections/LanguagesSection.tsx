import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolioStore } from '@/stores/portfolio-store';

export function LanguagesSection() {
  const data = usePortfolioStore((s) => s.data);
  return (
    <div className="mb-6" data-aos="fade-up">
      <SectionLabel text="Languages" />
      <div className="space-y-2">
        {data.languages.map((language, index) => (
          <div key={language.name} className="flex items-center gap-2 text-body-sm text-foreground" data-aos="slide-right" data-aos-delay={index * 100}>
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
