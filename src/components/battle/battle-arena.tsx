"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { toast } from "sonner";
import { useBattleStore } from "@/lib/store/battle-store";
import { BattleInput } from "./battle-input";
import { ResponseCard } from "./response-card";
import { VotePanel } from "./vote-panel";
import { RevealPanel } from "./reveal-panel";
import type { BattleStartResponse, BattleVoteResponse } from "@/lib/types";

export function BattleArena() {
  const store = useBattleStore();
  const startTimeRef = useRef<number>(0);
  const voteLoadingRef = useRef<boolean>(false);

  // -- Dual useCompletion hooks (RESEARCH.md Pattern 2) --
  // Each hook manages one stream independently (D-04, BATTLE-02)
  // streamProtocol: "text" pairs with toTextStreamResponse() on server
  const completionA = useCompletion({
    api: "/api/battle/stream",
    streamProtocol: "text",
    id: "battle-a", // Unique ID to prevent hook collision
    onFinish: () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      store.setDurationA(elapsed);
      store.setStreamingA(false);
    },
    onError: (error) => {
      // D-06: One model error = entire battle error
      store.setError(error.message || "응답을 생성하는 중 오류가 발생했습니다");
    },
  });

  const completionB = useCompletion({
    api: "/api/battle/stream",
    streamProtocol: "text",
    id: "battle-b",
    onFinish: () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      store.setDurationB(elapsed);
      store.setStreamingB(false);
    },
    onError: (error) => {
      store.setError(error.message || "응답을 생성하는 중 오류가 발생했습니다");
    },
  });

  // D-06: When phase becomes "error", abort both streams immediately
  useEffect(() => {
    if (store.phase === "error") {
      completionA.stop();
      completionB.stop();
    }
  }, [store.phase, completionA, completionB]);

  // -- Battle start handler --
  const handleStartBattle = useCallback(async (question: string) => {
    try {
      const res = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "서버 오류" }));
        store.setError(err.error || "배틀을 시작할 수 없습니다");
        return;
      }

      const { token } = (await res.json()) as BattleStartResponse;

      // Update store BEFORE triggering streams
      store.startBattle(question, token);

      // Record start time for duration tracking (D-05)
      // Use performance.now() per RESEARCH.md Pitfall 7
      startTimeRef.current = performance.now();

      // Trigger both streams in parallel (D-04, BATTLE-02)
      // RESEARCH.md Pitfall 1: Pass body at complete() call site, not hook init
      completionA.complete(question, {
        body: { token, slot: "a" },
      });
      completionB.complete(question, {
        body: { token, slot: "b" },
      });
    } catch {
      store.setError("네트워크 오류가 발생했습니다");
    }
  }, [store, completionA, completionB]);

  // -- Vote handler --
  const handleVote = useCallback(async (winner: "a" | "b") => {
    if (voteLoadingRef.current) return;
    voteLoadingRef.current = true;

    store.setVoteSubmitted(winner);

    try {
      // RESEARCH.md Pitfall 3: Read completion text from useCompletion hooks
      const res = await fetch("/api/battle/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: store.battleToken,
          winner,
          responseA: completionA.completion,
          responseB: completionB.completion,
          durationA: store.durationA ?? 0,
          durationB: store.durationB ?? 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "투표 실패" }));
        toast.error(err.error || "투표를 기록할 수 없습니다");
        voteLoadingRef.current = false;
        return;
      }

      const revealData = (await res.json()) as BattleVoteResponse;

      // D-04, D-11: Reveal models, keep response texts visible
      store.setReveal(revealData);
      toast.success("투표가 기록되었습니다!");
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      voteLoadingRef.current = false;
    }
  }, [store, completionA, completionB]);

  // -- New battle handler (D-12) --
  const handleNewBattle = useCallback(() => {
    completionA.stop();
    completionB.stop();
    store.reset();
  }, [store, completionA, completionB]);

  // -- Retry handler (error state) --
  const handleRetry = useCallback(() => {
    completionA.stop();
    completionB.stop();
    store.reset();
  }, [store, completionA, completionB]);

  // -- Render --
  const { phase, question, durationA, durationB, winner, revealData, errorMessage } = store;
  const isStreaming = phase === "streaming";
  const isVoting = phase === "voting";
  const isRevealed = phase === "reveal";
  const isError = phase === "error";
  const isIdle = phase === "idle";

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="text-center space-y-1">
        <h1 className="text-2xl font-bold">K-Index</h1>
        <p className="text-sm text-muted-foreground">AI 블라인드 배틀</p>
      </header>

      {/* Battle Input (visible in idle state, disabled during streaming) */}
      {(isIdle || isStreaming) && (
        <BattleInput
          onSubmit={handleStartBattle}
          disabled={isStreaming}
          loading={isStreaming}
        />
      )}

      {/* Question display (read-only after submission, per D-11) */}
      {!isIdle && question && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">질문:</span> {question}
        </div>
      )}

      {/* Response cards (appear during streaming, persist through reveal) */}
      {(isStreaming || isVoting || isRevealed || isError) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponseCard
            slot="a"
            responseText={completionA.completion}
            isStreaming={completionA.isLoading}
            duration={durationA}
            revealedModelName={revealData?.modelA.displayName ?? null}
            isWinner={winner === "a"}
          />
          <ResponseCard
            slot="b"
            responseText={completionB.completion}
            isStreaming={completionB.isLoading}
            duration={durationB}
            revealedModelName={revealData?.modelB.displayName ?? null}
            isWinner={winner === "b"}
          />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center space-y-4">
          <p className="text-destructive">
            {errorMessage || "응답을 생성하는 중 오류가 발생했습니다"}
          </p>
          <button
            onClick={handleRetry}
            className="text-primary hover:underline font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Vote panel (visible when voting, disabled during streaming) */}
      {(isStreaming || isVoting) && !isError && (
        <VotePanel
          onVote={handleVote}
          disabled={isStreaming}
          loading={winner !== null && !isRevealed}
          selectedWinner={winner}
        />
      )}

      {/* Reveal panel (appears after vote) */}
      {isRevealed && revealData && (
        <RevealPanel
          revealData={revealData}
          onNewBattle={handleNewBattle}
        />
      )}

      {/* Empty state for new visitors */}
      {isIdle && (
        <div className="text-center py-12 space-y-2">
          <h2 className="text-xl font-semibold">첫 번째 배틀을 시작해보세요!</h2>
          <p className="text-muted-foreground">
            한국어로 질문을 입력하면 두 AI가 경쟁합니다. 더 좋은 답변을 선택해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
