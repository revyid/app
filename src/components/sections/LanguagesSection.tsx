import { SectionLabel } from '@/components/shared/SectionLabel';
import { usePortfolio } from '@/contexts/PortfolioContext';

export function LanguagesSection() {
  const { data } = usePortfolio();
  return (
    <div className="mb-6">
      <SectionLabel text="Languages" />
      <div className="space-y-2">
        {data.languages.map((language) => (
          <div key={language.name} className="flex items-center gap-2 text-body-sm text-foreground">
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
