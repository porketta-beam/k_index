"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VotePanelProps {
  onVote: (winner: "a" | "b") => void;
  disabled: boolean;
  loading: boolean;
  selectedWinner: "a" | "b" | null;
}

export function VotePanel({ onVote, disabled, loading, selectedWinner }: VotePanelProps) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-bold">어떤 응답이 더 좋았나요?</h2>
      <div className="flex justify-center gap-4">
        <Button
          variant={selectedWinner === "a" ? "default" : "outline"}
          size="lg"
          className={cn(
            "min-w-[140px] min-h-[44px] transition-all duration-150",
            selectedWinner === "b" && "opacity-50",
          )}
          onClick={() => onVote("a")}
          disabled={disabled || loading || selectedWinner !== null}
          aria-disabled={disabled}
          aria-describedby={disabled ? "vote-wait-message" : undefined}
        >
          {loading && selectedWinner === "a" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "A가 더 좋아"
          )}
        </Button>

        <Button
          variant={selectedWinner === "b" ? "default" : "outline"}
          size="lg"
          className={cn(
            "min-w-[140px] min-h-[44px] transition-all duration-150",
            selectedWinner === "a" && "opacity-50",
          )}
          onClick={() => onVote("b")}
          disabled={disabled || loading || selectedWinner !== null}
          aria-disabled={disabled}
          aria-describedby={disabled ? "vote-wait-message" : undefined}
        >
          {loading && selectedWinner === "b" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "B가 더 좋아"
          )}
        </Button>
      </div>

      {disabled && (
        <p id="vote-wait-message" className="text-sm text-muted-foreground">
          두 응답이 모두 완료될 때까지 기다려주세요
        </p>
      )}
    </div>
  );
}
