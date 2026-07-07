import { Calendar, Building2, MapPin, ArrowUpRight } from 'lucide-react';
import type { Experience } from '@/types';

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <div className="group block cursor-pointer focus-ring rounded-[24px] transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.97]">
      <div className="relative card-filled p-0 overflow-hidden rounded-[24px]">
        <div className="absolute inset-0 state-layer pointer-events-none rounded-[inherit]" />
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit]" />

        <div className="relative flex items-start gap-5 p-6">
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-primary rounded-[12px] transition-all duration-300 group-hover:rotate-y-10 group-hover:rounded-[16px]">
            <span className="text-primary-foreground font-bold text-xl">
              {experience.company.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground text-lg">{experience.title}</h3>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground mb-3">
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-surface-variant border border-outline/10">
                <Calendar className="w-4 h-4" />{experience.dateRange}
              </span>
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-surface-variant border border-outline/10">
                <Building2 className="w-4 h-4" />{experience.company}
              </span>
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-surface-variant border border-outline/10">
                <MapPin className="w-4 h-4" />{experience.location}
              </span>
            </div>

            <p className="text-body-sm text-muted-foreground leading-relaxed">{experience.description}</p>
          </div>
        </div>

        <div className="absolute left-0 top-4 bottom-4 w-1 origin-top bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out rounded-[4px]" />
      </div>
    </div>
  );
}
