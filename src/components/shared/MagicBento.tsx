'use client';

import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import gsap from 'gsap';

interface MagicBentoProps {
  children: ReactNode;
  className?: string;
  spotlight?: boolean;
  particles?: boolean;
  glow?: boolean;
}

export function MagicBento({
  children,
  className = '',
  spotlight = true,
  particles = true,
  glow = true,
}: MagicBentoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Spotlight effect — track mouse and update CSS variables
    const onMove = (e: MouseEvent) => {
      handleMouseMove(e);

      if (spotlight) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        container.style.setProperty('--spotlight-x', `${x}px`);
        container.style.setProperty('--spotlight-y', `${y}px`);
      }
    };

    container.addEventListener('mousemove', onMove, { passive: true });

    // Animate cards with GSAP
    const cards = container.querySelectorAll('[data-magic-card]');
    const cleanups: (() => void)[] = [];

    cards.forEach((card) => {
      const el = card as HTMLElement;

      const onMouseEnter = () => {
        if (glow) {
          gsap.to(el, {
            boxShadow: '0 0 30px rgba(var(--primary-rgb, 82, 230, 53), 0.3)',
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      };

      const onMouseLeave = () => {
        if (glow) {
          gsap.to(el, {
            boxShadow: '0 0 0px rgba(var(--primary-rgb, 82, 230, 53), 0)',
            duration: 0.3,
            ease: 'power2.out',
          });
        }
        gsap.to(el, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
      };

      const onMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const rect = el.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        gsap.to(el, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000,
        });

        if (glow) {
          el.style.setProperty('--card-glow-x', `${x}px`);
          el.style.setProperty('--card-glow-y', `${y}px`);
        }
      };

      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('mousemove', onMouseMove);

      cleanups.push(() => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('mousemove', onMouseMove);
      });
    });

    // Particle effect
    if (particles) {
      const createParticle = (x: number, y: number) => {
        const particle = document.createElement('div');
        particle.className = 'magic-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        container.appendChild(particle);

        gsap.fromTo(particle,
          { scale: 0, opacity: 1 },
          {
            scale: 2,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => particle.remove(),
          }
        );
      };

      const onCardHover = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-magic-card]')) {
          const rect = target.closest('[data-magic-card]')!.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const x = rect.left - containerRect.left + rect.width / 2;
          const y = rect.top - containerRect.top + rect.height / 2;

          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              createParticle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40
              );
            }, i * 100);
          }
        }
      };

      container.addEventListener('mouseenter', onCardHover, { passive: true });
      cleanups.push(() => container.removeEventListener('mouseenter', onCardHover));
    }

    return () => {
      container.removeEventListener('mousemove', onMove);
      cleanups.forEach(fn => fn());
    };
  }, [spotlight, particles, glow, handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className={`magic-bento-container relative ${className}`}
      style={{
        '--spotlight-x': '50%',
        '--spotlight-y': '50%',
      } as React.CSSProperties}
    >
      {/* Spotlight overlay */}
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: 'radial-gradient(600px circle at var(--spotlight-x) var(--spotlight-y), rgba(var(--primary-rgb, 82, 230, 53), 0.06), transparent 40%)',
          }}
        />
      )}
      {children}
    </div>
  );
}

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function MagicCard({ children, className = '', glowColor }: MagicCardProps) {
  return (
    <div
      data-magic-card
      className={`magic-card relative overflow-hidden rounded-2xl transition-all duration-300 ${className}`}
      style={glowColor ? { '--card-glow-color': glowColor } as React.CSSProperties : undefined}
    >
      {/* Card glow effect */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), ${glowColor || 'rgba(var(--primary-rgb, 82, 230, 53), 0.08)'}, transparent 40%)`,
        }}
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
