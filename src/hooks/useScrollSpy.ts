import { useState, useEffect, useRef } from 'react';

/**
 * Performant scroll spy using IntersectionObserver instead of scroll events.
 * Returns the id of the section currently in the upper viewport area.
 */
export function useScrollSpy(sectionIds: string[], offset = 120) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Track which sections are currently intersecting
    const visibleSections = new Map<string, IntersectionObserverEntry>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        // Pick the first visible section in DOM order
        if (visibleSections.size === 0) {
          setActiveId('');
          return;
        }

        // Find topmost visible section
        let topSection = '';
        let topY = Infinity;
        visibleSections.forEach((entry, id) => {
          if (entry.boundingClientRect.top < topY) {
            topY = entry.boundingClientRect.top;
            topSection = id;
          }
        });

        setActiveId(topSection);
      },
      {
        // Section is "active" when it enters the top portion of the viewport
        rootMargin: `-${offset}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    // Observe all section elements
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sectionIds, offset]);

  return activeId;
}
