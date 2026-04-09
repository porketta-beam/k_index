"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_CHARS = 2000;

interface BattleInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function BattleInput({ onSubmit, disabled, loading }: BattleInputProps) {
  const [question, setQuestion] = useState("");

  const charCount = question.length;
  const isEmpty = question.trim().length === 0;
  const isTooLong = charCount > MAX_CHARS;

  const handleSubmit = () => {
    if (isEmpty || isTooLong || disabled) return;
    onSubmit(question.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <Textarea
          placeholder="한국어로 질문을 입력하세요"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "min-h-[120px] resize-none text-base leading-[1.6]",
            isTooLong && "border-destructive focus-visible:ring-destructive",
          )}
          aria-label="배틀 질문 입력"
        />
        <span
          className={cn(
            "absolute bottom-2 right-3 text-sm font-mono",
            isTooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={disabled || isEmpty || isTooLong}
        className="w-full sm:w-auto"
        size="lg"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            응답 생성 중...
          </span>
        ) : (
          "배틀 시작"
        )}
      </Button>
    </div>
  );
}
