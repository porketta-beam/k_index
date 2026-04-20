"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { useActiveCard } from "@/hooks/use-active-card";
import { useBattleStore } from "@/lib/store/battle-store";
import { cn } from "@/lib/utils";

interface SwipeContainerProps {
  /** Slot A card content (ReactNode, typically a ResponseCard) */
  slotA: ReactNode;
  /** Slot B card content (ReactNode, typically a ResponseCard) */
  slotB: ReactNode;
}

/**
 * Mobile-only horizontal scroll-snap container for 2 response cards.
 * Hidden on md+ breakpoint (desktop shows side-by-side grid).
 *
 * Features:
 * - CSS scroll-snap for native swipe behavior (D-01)
 * - Swipe works during streaming (D-02)
 * - Dot indicators showing active card
 * - IntersectionObserver-based active card detection
 * - min-h-[300px] per card to prevent snap instability during streaming
 * - Accessible: role="tablist" on dots, role="tabpanel" on cards
 */
export function SwipeContainer({ slotA, slotB }: SwipeContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCard = useActiveCard(scrollContainerRef);
  const setMobileActiveCard = useBattleStore(
    (state) => state.setMobileActiveCard
  );

  // Sync active card to Zustand store
  useEffect(() => {
    setMobileActiveCard(activeCard);
  }, [activeCard, setMobileActiveCard]);

  return (
    <div className="md:hidden">
      {/* Scroll-snap container */}
      <div
        ref={scrollContainerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        role="region"
        aria-label="AI 응답 카드"
      >
        <div
          className="w-full flex-shrink-0 snap-start snap-always px-4 min-h-[300px]"
          role="tabpanel"
          aria-label="Model A 응답"
        >
          {slotA}
        </div>
        <div
          className="w-full flex-shrink-0 snap-start snap-always px-4 min-h-[300px]"
          role="tabpanel"
          aria-label="Model B 응답"
        >
          {slotB}
        </div>
      </div>

      {/* Dot indicators */}
      <div
        className="flex justify-center gap-2 mt-3"
        role="tablist"
        aria-label="응답 카드 선택"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCard === 0}
          aria-label="Model A"
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-150 ease-out",
            activeCard === 0
              ? "bg-foreground"
              : "bg-muted-foreground/30"
          )}
          onClick={() => {
            scrollContainerRef.current?.children[0]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "start",
            });
          }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={activeCard === 1}
          aria-label="Model B"
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-150 ease-out",
            activeCard === 1
              ? "bg-foreground"
              : "bg-muted-foreground/30"
          )}
          onClick={() => {
            scrollContainerRef.current?.children[1]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "start",
            });
          }}
        />
      </div>
    </div>
  );
}
