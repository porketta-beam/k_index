import { describe, it, expect } from "vitest";
import { selectModelPair } from "./pairing";
import { BUDGET_MODELS } from "@/lib/types";

describe("selectModelPair", () => {
  it("returns two different models", () => {
    const result = selectModelPair();
    expect(result.modelA).not.toBe(result.modelB);
  });

  it("returns models from BUDGET_MODELS pool", () => {
    const result = selectModelPair();
    expect(BUDGET_MODELS).toContain(result.modelA);
    expect(BUDGET_MODELS).toContain(result.modelB);
  });

  it("returns a random positionA of 'left' or 'right'", () => {
    const positions = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const result = selectModelPair();
      positions.add(result.positionA);
    }
    // With 50 iterations, both positions should appear
    expect(positions.has("left")).toBe(true);
    expect(positions.has("right")).toBe(true);
  });

  it("produces varying model pairs over multiple calls", () => {
    const pairs = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const result = selectModelPair();
      pairs.add(`${result.modelA}|${result.modelB}`);
    }
    // With 3 models and 30 iterations, should see multiple distinct pairs
    expect(pairs.size).toBeGreaterThan(1);
  });
});
