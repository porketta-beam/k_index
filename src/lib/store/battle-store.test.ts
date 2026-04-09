import { describe, test, expect, beforeEach } from "vitest";
import { useBattleStore } from "@/lib/store/battle-store";
import { getDefaultPrompt } from "@/lib/categories";

describe("battle-store category state", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useBattleStore.setState(useBattleStore.getInitialState());
  });

  // Initial state tests
  test("initial category is 'general'", () => {
    const state = useBattleStore.getState();
    expect(state.category).toBe("general");
  });

  test("initial systemPrompt is general default", () => {
    const state = useBattleStore.getState();
    expect(state.systemPrompt).toBe(getDefaultPrompt("general"));
  });

  test("initial isPromptModified is false", () => {
    const state = useBattleStore.getState();
    expect(state.isPromptModified).toBe(false);
  });

  test("initial pendingCategory is null", () => {
    const state = useBattleStore.getState();
    expect(state.pendingCategory).toBeNull();
  });

  // setCategory tests
  describe("setCategory", () => {
    test("switches category when prompt not modified", () => {
      useBattleStore.getState().setCategory("homework");
      const state = useBattleStore.getState();
      expect(state.category).toBe("homework");
      expect(state.systemPrompt).toBe(getDefaultPrompt("homework"));
      expect(state.isPromptModified).toBe(false);
      expect(state.pendingCategory).toBeNull();
    });

    test("sets pendingCategory when prompt is modified", () => {
      // Modify the prompt first
      useBattleStore.getState().setSystemPrompt("custom prompt");
      expect(useBattleStore.getState().isPromptModified).toBe(true);

      // Try to switch category
      useBattleStore.getState().setCategory("homework");
      const state = useBattleStore.getState();
      // Should NOT have switched
      expect(state.category).toBe("general");
      expect(state.pendingCategory).toBe("homework");
    });
  });

  // confirmCategorySwitch tests
  describe("confirmCategorySwitch", () => {
    test("switches to pendingCategory and resets prompt", () => {
      // Set up: modify prompt, try to switch
      useBattleStore.getState().setSystemPrompt("custom prompt");
      useBattleStore.getState().setCategory("homework");
      expect(useBattleStore.getState().pendingCategory).toBe("homework");

      // Confirm the switch
      useBattleStore.getState().confirmCategorySwitch();
      const state = useBattleStore.getState();
      expect(state.category).toBe("homework");
      expect(state.systemPrompt).toBe(getDefaultPrompt("homework"));
      expect(state.isPromptModified).toBe(false);
      expect(state.pendingCategory).toBeNull();
    });
  });

  // cancelCategorySwitch tests
  describe("cancelCategorySwitch", () => {
    test("clears pendingCategory without changing category", () => {
      // Set up: modify prompt, try to switch
      useBattleStore.getState().setSystemPrompt("custom prompt");
      useBattleStore.getState().setCategory("homework");
      expect(useBattleStore.getState().pendingCategory).toBe("homework");

      // Cancel the switch
      useBattleStore.getState().cancelCategorySwitch();
      const state = useBattleStore.getState();
      expect(state.category).toBe("general");
      expect(state.systemPrompt).toBe("custom prompt");
      expect(state.isPromptModified).toBe(true);
      expect(state.pendingCategory).toBeNull();
    });
  });

  // setSystemPrompt tests
  describe("setSystemPrompt", () => {
    test("sets isPromptModified true when different from default", () => {
      useBattleStore.getState().setSystemPrompt("something different");
      const state = useBattleStore.getState();
      expect(state.systemPrompt).toBe("something different");
      expect(state.isPromptModified).toBe(true);
    });

    test("sets isPromptModified false when matches default", () => {
      // First modify it
      useBattleStore.getState().setSystemPrompt("something different");
      expect(useBattleStore.getState().isPromptModified).toBe(true);

      // Set it back to default
      useBattleStore.getState().setSystemPrompt(getDefaultPrompt("general"));
      const state = useBattleStore.getState();
      expect(state.isPromptModified).toBe(false);
    });

    test("store accepts any string (500 char limit enforced by UI, not store)", () => {
      const longString = "a".repeat(1000);
      useBattleStore.getState().setSystemPrompt(longString);
      const state = useBattleStore.getState();
      expect(state.systemPrompt).toBe(longString);
      expect(state.systemPrompt.length).toBe(1000);
    });
  });

  // resetPrompt tests
  describe("resetPrompt", () => {
    test("resets to current category default", () => {
      // Switch to homework, then modify prompt
      useBattleStore.getState().setCategory("homework");
      useBattleStore.getState().setSystemPrompt("modified homework prompt");
      expect(useBattleStore.getState().isPromptModified).toBe(true);

      // Reset prompt
      useBattleStore.getState().resetPrompt();
      const state = useBattleStore.getState();
      expect(state.systemPrompt).toBe(getDefaultPrompt("homework"));
      expect(state.isPromptModified).toBe(false);
    });
  });

  // reset tests (D-05)
  describe("reset", () => {
    test("preserves category but resets prompt to default", () => {
      // Switch to homework and modify prompt
      useBattleStore.getState().setCategory("homework");
      useBattleStore.getState().setSystemPrompt("custom homework prompt");

      // Start a battle to change phase
      useBattleStore.getState().startBattle("test question", "test-token");
      expect(useBattleStore.getState().phase).toBe("streaming");

      // Reset (simulates "new battle" click)
      useBattleStore.getState().reset();
      const state = useBattleStore.getState();
      expect(state.category).toBe("homework"); // D-05: category preserved
      expect(state.systemPrompt).toBe(getDefaultPrompt("homework")); // D-05: prompt resets to default
      expect(state.phase).toBe("idle");
    });

    test("clears isPromptModified and pendingCategory", () => {
      // Set up modified state
      useBattleStore.getState().setSystemPrompt("modified");
      useBattleStore.getState().setCategory("homework"); // Sets pendingCategory since prompt modified
      expect(useBattleStore.getState().isPromptModified).toBe(true);
      expect(useBattleStore.getState().pendingCategory).toBe("homework");

      // Reset
      useBattleStore.getState().reset();
      const state = useBattleStore.getState();
      expect(state.isPromptModified).toBe(false);
      expect(state.pendingCategory).toBeNull();
    });
  });
});
