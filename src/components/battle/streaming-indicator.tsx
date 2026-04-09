"use client";

import { cn } from "@/lib/utils";

export function StreamingIndicator({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full bg-primary animate-pulse",
        className,
      )}
      style={{ animationDuration: "800ms" }}
      aria-hidden="true"
    />
  );
}
