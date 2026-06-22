interface SectionLabelProps {
  text: string;
}

export function SectionLabel({ text }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-0.5 bg-primary rounded-full origin-left animate-[scaleX_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_forwards] scale-x-0 opacity-0" />
      <h2 className="text-label-sm font-semibold uppercase tracking-widest text-primary">
        {text}
      </h2>
    </div>
  );
}
