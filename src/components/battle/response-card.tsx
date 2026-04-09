"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreamingIndicator } from "./streaming-indicator";
import { cn } from "@/lib/utils";

interface ResponseCardProps {
  slot: "a" | "b";
  responseText: string;
  isStreaming: boolean;
  duration: number | null;
  revealedModelName: string | null;
  isWinner: boolean;
  className?: string;
}

export function ResponseCard({
  slot,
  responseText,
  isStreaming,
  duration,
  revealedModelName,
  isWinner,
  className,
}: ResponseCardProps) {
  const label = slot === "a" ? "Model A" : "Model B";
  const isRevealed = revealedModelName !== null;

  return (
    <Card
      className={cn(
        "flex flex-col",
        isWinner && "border-l-4 border-l-success",
        isRevealed && slot === "a" && "border-t-2 border-t-reveal-a",
        isRevealed && slot === "b" && "border-t-2 border-t-reveal-b",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          {isRevealed ? (
            <Badge
              className={cn(
                slot === "a"
                  ? "bg-reveal-a text-reveal-a-foreground"
                  : "bg-reveal-b text-reveal-b-foreground",
              )}
            >
              {revealedModelName}
            </Badge>
          ) : (
            <Badge variant="secondary">{label}</Badge>
          )}
          {isWinner && (
            <Badge variant="outline" className="text-success border-success">
              선택됨
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isStreaming && <span>응답 생성 중...</span>}
          {!isStreaming && responseText.length > 0 && (
            <span className="flex items-center gap-1">
              완료
              {duration !== null && (
                <span className="font-mono">{duration.toFixed(1)}초</span>
              )}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto max-h-[50vh] md:max-h-[60vh]">
        {responseText.length > 0 ? (
          <div
            className="text-base leading-[1.6] whitespace-pre-wrap"
            aria-live="polite"
          >
            {responseText}
            {isStreaming && <StreamingIndicator className="ml-1 align-middle" />}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
