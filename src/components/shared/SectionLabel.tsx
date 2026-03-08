interface SectionLabelProps {
  text: string;
}

export function SectionLabel({ text }: SectionLabelProps) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-4">
      {text}
    </h2>
  );
}
