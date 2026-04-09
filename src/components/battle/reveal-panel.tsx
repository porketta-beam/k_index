"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WinRateBar } from "./win-rate-bar";
import { getCategoryById } from "@/lib/categories";
import type { BattleVoteResponse } from "@/lib/types";

interface RevealPanelProps {
  revealData: BattleVoteResponse;
  category: string;
  onNewBattle: () => void;
}

export function RevealPanel({ revealData, category, onNewBattle }: RevealPanelProps) {
  const categoryLabel = getCategoryById(category)?.label ?? "일반";

  return (
    <div className="space-y-6">
      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {categoryLabel} 카테고리 승률
        </h3>
        <WinRateBar
          modelName={revealData.modelA.displayName}
          wins={revealData.winRates.modelA.wins}
          total={revealData.winRates.modelA.total}
          colorClass="bg-reveal-a"
        />
        <WinRateBar
          modelName={revealData.modelB.displayName}
          wins={revealData.winRates.modelB.wins}
          total={revealData.winRates.modelB.total}
          colorClass="bg-reveal-b"
        />
      </div>

      <div className="flex justify-center">
        <Button onClick={onNewBattle} size="lg">
          새 배틀 시작
        </Button>
      </div>
    </div>
  );
}
