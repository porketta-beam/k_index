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
