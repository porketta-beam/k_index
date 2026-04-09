"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface SeasonEndedProps {
  seasonNumber: number | null;
}

export function SeasonEnded({ seasonNumber }: SeasonEndedProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // UI-SPEC Accessibility: Focus management on mount
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card
        ref={cardRef}
        tabIndex={-1}
        role="status"
        aria-label={
          seasonNumber
            ? `시즌 ${seasonNumber} 배틀이 끝났습니다`
            : "현재 진행 중인 시즌이 없습니다"
        }
        className="max-w-md w-full mx-auto text-center
          px-8 py-12
          md:px-8 md:py-12
          animate-in fade-in zoom-in-95 duration-400
          motion-reduce:animate-none motion-reduce:opacity-100
          outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Season number display: only shown when season number is available */}
        {seasonNumber !== null && (
          <p className="text-5xl font-bold text-foreground mb-6 font-[family-name:var(--font-pretendard)]">
            시즌 {seasonNumber}
          </p>
        )}

        {/* Ended message */}
        <h2 className="text-2xl font-bold text-foreground mb-2 font-[family-name:var(--font-pretendard)]">
          {seasonNumber !== null
            ? "배틀이 끝났습니다!"
            : "현재 진행 중인 시즌이 없습니다"}
        </h2>

        {/* Wait message */}
        <p className="text-base text-muted-foreground font-[family-name:var(--font-pretendard)]">
          다음 시즌을 기다려주세요
        </p>
      </Card>
    </div>
  );
}
