import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env before importing session module
vi.mock("@/lib/env", () => ({
  env: {
    BATTLE_SESSION_SECRET: "test-secret-key-that-is-at-least-32-chars-long",
  },
}));

import { createBattleToken, verifyBattleToken } from "./session";
import type { BattleSession } from "@/lib/types";

describe("createBattleToken / verifyBattleToken", () => {
  const validSession: BattleSession = {
    sid: "test-session-id",
    q: "한국의 수도는?",
    mA: "openai:gpt-4o-mini",
    mB: "anthropic:claude-haiku-4-5",
    pA: "left",
    cat: "general",
    sp: "당신은 한국어 AI 어시스턴트입니다.",
    ts: Date.now(),
  };

  it("creates a token that can be verified", () => {
    const token = createBattleToken(validSession);
    const result = verifyBattleToken(token);
    expect(result).not.toBeNull();
    expect(result!.sid).toBe(validSession.sid);
    expect(result!.q).toBe(validSession.q);
    expect(result!.mA).toBe(validSession.mA);
    expect(result!.mB).toBe(validSession.mB);
    expect(result!.pA).toBe(validSession.pA);
  });

  it("rejects a tampered token", () => {
    const token = createBattleToken(validSession);
    const tampered = token.slice(0, -1) + "x";
    expect(verifyBattleToken(tampered)).toBeNull();
  });

  it("rejects an expired token (older than 30 minutes)", () => {
    const expiredSession: BattleSession = {
      ...validSession,
      ts: Date.now() - 31 * 60 * 1000,
    };
    const token = createBattleToken(expiredSession);
    expect(verifyBattleToken(token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyBattleToken("")).toBeNull();
    expect(verifyBattleToken("no-dot-separator")).toBeNull();
    expect(verifyBattleToken(".")).toBeNull();
  });
});
