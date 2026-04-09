"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBattleStore } from "@/lib/store/battle-store";

const MAX_PROMPT_CHARS = 500;

interface SystemPromptEditorProps {
  disabled?: boolean;
}

export function SystemPromptEditor({ disabled }: SystemPromptEditorProps) {
  const [open, setOpen] = useState(false);
  const { systemPrompt, isPromptModified, setSystemPrompt, resetPrompt } =
    useBattleStore();

  // UI-SPEC: Hidden during streaming/voting/reveal
  if (disabled) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
          />
          {open ? "시스템 프롬프트 숨기기" : "시스템 프롬프트 보기"}
          {isPromptModified && (
            <Badge variant="secondary" className="ml-2 text-xs animate-in fade-in duration-200">
              수정됨
            </Badge>
          )}
        </CollapsibleTrigger>
        {open && isPromptModified && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPrompt}
            className="animate-in fade-in duration-200"
          >
            기본값 복원
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="mt-2 space-y-1">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="text-sm min-h-[80px] max-h-[200px] resize-y"
            aria-label="시스템 프롬프트 편집"
            placeholder="이 카테고리의 시스템 프롬프트를 수정할 수 있습니다"
          />
          <p
            className={`text-xs font-mono text-right ${
              systemPrompt.length > MAX_PROMPT_CHARS
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {systemPrompt.length} / {MAX_PROMPT_CHARS}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
