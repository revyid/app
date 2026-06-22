import { type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimateIn({ children, className = '', delay }: AnimateInProps) {
  const { ref, isVisible } = useInView();

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${isVisible ? 'is-visible' : ''} ${className}`}
      style={delay != null ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
