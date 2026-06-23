import { Quote } from 'lucide-react';
import type { Testimonial } from '@/types';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="group block cursor-pointer focus-ring rounded-[24px] transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.97]">
      <div className="relative card-filled p-0 overflow-hidden rounded-[24px]">
        <div className="absolute inset-0 state-layer pointer-events-none rounded-[inherit]" />
        <div className="absolute inset-0 m3-ripple pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit]" />

        <div className="absolute top-4 right-4 opacity-5">
          <Quote className="w-24 h-24 text-primary" />
        </div>

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative overflow-hidden rounded-[12px] transition-all duration-300 group-hover:scale-105 group-hover:rounded-[14px]">
              <div className="w-14 h-14 overflow-hidden bg-surface-variant ring-2 ring-surface shadow-lg rounded-[inherit]">
                {testimonial.avatar ? (
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-medium bg-surface-variant">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface" />
            </div>

            <div>
              <h3 className="font-semibold text-foreground text-base">{testimonial.name}</h3>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>

          <div className="relative">
            <svg viewBox="0 0 24 24" className="absolute -left-1 -top-2 w-6 h-6" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V9c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V9c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 5v3c0 1 0 1 1 1z" />
            </svg>
            <p className="text-foreground leading-relaxed pl-4">"{testimonial.quote}"</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
}
