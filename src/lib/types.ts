export const BUDGET_MODELS = [
  "openai:gpt-4o-mini",
  "anthropic:claude-haiku-4-5",
  "google:gemini-2.5-flash",
] as const;

export type BudgetModelId = (typeof BUDGET_MODELS)[number];

export type BattleStatus =
  | "pending"
  | "streaming"
  | "voting"
  | "completed"
  | "error";

export interface Battle {
  id: string;
  question: string;
  model_a: BudgetModelId;
  model_b: BudgetModelId;
  response_a: string | null;
  response_b: string | null;
  position_a: "left" | "right";
  category: string;
  season_id: string | null;
  status: BattleStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Vote {
  id: string;
  battle_id: string;
  winner: "a" | "b";
  created_at: string;
}

export interface StreamRequest {
  prompt: string;
  modelId: BudgetModelId;
}

// NEW: Battle session payload stored in HMAC token
export interface BattleSession {
  sid: string;       // nanoid session ID
  q: string;         // question text
  mA: BudgetModelId; // model ID for slot A
  mB: BudgetModelId; // model ID for slot B
  pA: "left" | "right"; // randomized A/B position assignment (D-03, BATTLE-06)
  cat: string;       // category ID (e.g., "general", "homework") — Phase 3
  sp: string;        // system prompt text — Phase 3
  sId: string;       // Phase 4: season_id threaded from gate to vote
  ts: number;        // creation timestamp (Date.now())
}

// NEW: API response types
export interface BattleStartResponse {
  token: string; // HMAC-signed opaque token
}

export interface BattleVoteRequest {
  token: string;
  winner: "a" | "b";
  responseA: string;
  responseB: string;
  durationA: number; // seconds, 1 decimal per D-05
  durationB: number;
}

export interface ModelReveal {
  id: BudgetModelId;
  displayName: string;
}

export interface WinRateData {
  wins: number;
  total: number;
}

export interface BattleVoteResponse {
  modelA: ModelReveal;
  modelB: ModelReveal;
  winRates: {
    modelA: WinRateData;
    modelB: WinRateData;
  };
}

// Season system types (Phase 4)
export type SeasonStatus = "active" | "ended";

export interface Season {
  id: string;
  season_number: number;
  status: SeasonStatus;
  threshold: number;
  battle_count: number;
  started_at: string;
  ended_at: string | null;
}

export interface SeasonGateResult {
  active: boolean;
  seasonId: string | null;
  seasonNumber: number | null;
}
