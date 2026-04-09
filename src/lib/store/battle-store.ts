"use client";

import { create } from "zustand";
import type { BattleVoteResponse } from "@/lib/types";

/**
 * Battle phase state machine (UI-SPEC):
 * [idle] -> user submits question -> [streaming]
 * [streaming] -> both responses complete -> [voting]
 * [voting] -> user clicks vote -> [reveal]
 * [reveal] -> user clicks "new battle" -> [idle]
 * [streaming] -> error occurs -> [error]
 * [error] -> user clicks retry -> [idle]
 */
export type BattlePhase = "idle" | "streaming" | "voting" | "reveal" | "error";

interface BattleState {
  // State
  phase: BattlePhase;
  question: string;
  battleToken: string | null;
  streamingA: boolean;
  streamingB: boolean;
  durationA: number | null;  // seconds, 1 decimal (D-05)
  durationB: number | null;  // seconds, 1 decimal (D-05)
  winner: "a" | "b" | null;
  revealData: BattleVoteResponse | null;
  errorMessage: string | null;

  // Actions
  startBattle: (question: string, token: string) => void;
  setStreamingA: (streaming: boolean) => void;
  setStreamingB: (streaming: boolean) => void;
  setDurationA: (seconds: number) => void;
  setDurationB: (seconds: number) => void;
  setVoteSubmitted: (winner: "a" | "b") => void;
  setReveal: (data: BattleVoteResponse) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as BattlePhase,
  question: "",
  battleToken: null as string | null,
  streamingA: false,
  streamingB: false,
  durationA: null as number | null,
  durationB: null as number | null,
  winner: null as "a" | "b" | null,
  revealData: null as BattleVoteResponse | null,
  errorMessage: null as string | null,
};

export const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,

  startBattle: (question: string, token: string) =>
    set({
      phase: "streaming",
      question,
      battleToken: token,
      streamingA: true,
      streamingB: true,
      durationA: null,
      durationB: null,
      winner: null,
      revealData: null,
      errorMessage: null,
    }),

  // RESEARCH.md Pitfall 2: Race condition prevention
  // After set(), call get() to read the OTHER stream's status
  // This ensures both completions are checked correctly
  setStreamingA: (streaming: boolean) => {
    set({ streamingA: streaming });
    const state = get();
    if (!streaming && !state.streamingB && state.phase === "streaming") {
      set({ phase: "voting" });
    }
  },

  setStreamingB: (streaming: boolean) => {
    set({ streamingB: streaming });
    const state = get();
    if (!state.streamingA && !streaming && state.phase === "streaming") {
      set({ phase: "voting" });
    }
  },

  setDurationA: (seconds: number) =>
    set({ durationA: Math.round(seconds * 10) / 10 }), // 1 decimal per D-05

  setDurationB: (seconds: number) =>
    set({ durationB: Math.round(seconds * 10) / 10 }),

  setVoteSubmitted: (winner: "a" | "b") =>
    set({ winner }),

  setReveal: (data: BattleVoteResponse) =>
    set({ phase: "reveal", revealData: data }),

  // D-06: One model error = entire battle error, abort other stream
  setError: (message: string) =>
    set({
      phase: "error",
      errorMessage: message,
      streamingA: false,
      streamingB: false,
    }),

  // D-12: "New battle" button resets state to idle immediately
  reset: () => set(initialState),
}));
