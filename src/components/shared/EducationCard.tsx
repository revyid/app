import { GraduationCap, Calendar } from 'lucide-react';
import type { Education } from '@/types';

interface EducationCardProps {
  education: Education;
}

export function EducationCard({ education }: EducationCardProps) {
  return (
    <div className="group block cursor-pointer focus-ring rounded-[24px] transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.96]">
      <div className="relative card-filled p-0 overflow-hidden h-full flex flex-col rounded-[24px]">
        <div className="absolute inset-0 state-layer pointer-events-none rounded-[inherit]" />
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit]" />

        <div className="relative p-6 flex-1 flex flex-col">
          <div className="w-12 h-12 bg-surface-variant flex items-center justify-center mb-4 shadow-[0_2px_4px_rgba(0,0,0,0.1)] rounded-[12px] transition-all duration-300 group-hover:scale-110 group-hover:-rotate-5 group-hover:rounded-[16px]">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>

          <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2">{education.institution}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{education.degree}</p>

          <div className="inline-flex items-center gap-1.5 h-7 bg-surface-variant px-3 rounded-[8px] border border-outline/10 w-fit">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{education.year}</span>
          </div>
        </div>

        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/10 rounded-full blur-2xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
      </div>
    </div>
  );
}
