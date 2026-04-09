import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  DEFAULT_CATEGORY_ID,
  getCategoryById,
  getDefaultPrompt,
} from "./categories";

describe("categories", () => {
  it("has exactly 5 entries", () => {
    expect(CATEGORIES).toHaveLength(5);
  });

  it("has the correct category IDs", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toEqual([
      "general",
      "homework",
      "cover-letter",
      "counseling",
      "creative",
    ]);
  });

  it("every category has non-empty emoji, label, and defaultPrompt", () => {
    for (const cat of CATEGORIES) {
      expect(cat.emoji.length).toBeGreaterThan(0);
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.defaultPrompt.length).toBeGreaterThan(0);
    }
  });

  it("does not contain a coding category (D-01)", () => {
    const codingCat = CATEGORIES.find((c) => c.id === "coding");
    expect(codingCat).toBeUndefined();
  });

  it("DEFAULT_CATEGORY_ID equals 'general' (D-02)", () => {
    expect(DEFAULT_CATEGORY_ID).toBe("general");
  });

  it("getCategoryById returns the correct category", () => {
    const homework = getCategoryById("homework");
    expect(homework).toBeDefined();
    expect(homework!.id).toBe("homework");
    expect(homework!.label).toBe("과제 도움");
  });

  it("getCategoryById returns undefined for nonexistent category", () => {
    expect(getCategoryById("nonexistent")).toBeUndefined();
  });
});

describe("default prompt", () => {
  it("returns the correct prompt for a known category", () => {
    const generalCat = getCategoryById("general");
    expect(getDefaultPrompt("general")).toBe(generalCat!.defaultPrompt);
  });

  it("returns the general category prompt for a nonexistent category (fallback)", () => {
    const generalCat = getCategoryById("general");
    expect(getDefaultPrompt("nonexistent")).toBe(generalCat!.defaultPrompt);
  });
});
