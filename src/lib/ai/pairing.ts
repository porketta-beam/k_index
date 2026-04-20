import { BUDGET_MODELS, type BudgetModelId } from "@/lib/types";

/**
 * Select two different models randomly from BUDGET_MODELS (D-01, D-02).
 * Assign random A/B positions (D-03, BATTLE-06).
 * Returns positionA to store in DB for analytics.
 */
export function selectModelPair(): {
  modelA: BudgetModelId;
  modelB: BudgetModelId;
  positionA: "left" | "right";
} {
  // Fisher-Yates shuffle of indices
  const indices = [0, 1, 2];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Take first two -- guaranteed different per D-02
  // A/B assignment is inherently random because shuffle is random (D-03)
  return {
    modelA: BUDGET_MODELS[indices[0]],
    modelB: BUDGET_MODELS[indices[1]],
    // D-03, BATTLE-06: Randomize which side Model A appears on
    positionA: Math.random() < 0.5 ? "left" : "right",
  };
}
