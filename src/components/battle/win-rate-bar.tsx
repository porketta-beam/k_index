"use client";

import { cn } from "@/lib/utils";

interface WinRateBarProps {
  modelName: string;
  wins: number;
  total: number;
  colorClass: string; // "bg-reveal-a" or "bg-reveal-b"
  className?: string;
}

export function WinRateBar({ modelName, wins, total, colorClass, className }: WinRateBarProps) {
  const percentage = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-baseline text-sm">
        <span className="font-medium">{modelName}</span>
        <span className="font-mono text-muted-foreground">
          승률: {percentage}% ({wins}승 / {total}전)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
