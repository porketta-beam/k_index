"use client";

import { useEffect, useState } from "react";

/**
 * Detects which child element is most visible in a scroll-snap container.
 * Uses IntersectionObserver with 50% threshold to determine the active card.
 *
 * @param containerRef - Ref to the scroll-snap container element
 * @returns The index (0 or 1) of the currently visible card
 */
export function useActiveCard(
  containerRef: React.RefObject<HTMLDivElement | null>
): 0 | 1 {
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.children;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = Array.from(cards).indexOf(entry.target as Element);
            if (index === 0 || index === 1) {
              setActiveIndex(index as 0 | 1);
            }
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    for (const card of Array.from(cards)) {
      observer.observe(card);
    }

    return () => observer.disconnect();
  }, [containerRef]);

  return activeIndex;
}
