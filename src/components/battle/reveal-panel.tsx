"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WinRateBar } from "./win-rate-bar";
import type { BattleVoteResponse } from "@/lib/types";

interface RevealPanelProps {
  revealData: BattleVoteResponse;
  onNewBattle: () => void;
}

export function RevealPanel({ revealData, onNewBattle }: RevealPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <Separator />

      <div className="space-y-4">
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
