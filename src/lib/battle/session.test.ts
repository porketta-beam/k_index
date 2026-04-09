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
    sId: "",
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

describe("HMAC battle token with category fields", () => {
  it("roundtrips cat and sp fields", () => {
    const session: BattleSession = {
      sid: "cat-test-id",
      q: "과제 도와주세요",
      mA: "openai:gpt-4o-mini",
      mB: "google:gemini-2.5-flash",
      pA: "right",
      cat: "homework",
      sp: "test prompt for homework category",
      sId: "",
      ts: Date.now(),
    };
    const token = createBattleToken(session);
    const result = verifyBattleToken(token);
    expect(result).not.toBeNull();
    expect(result!.cat).toBe("homework");
    expect(result!.sp).toBe("test prompt for homework category");
  });

  it("roundtrips 500-char Korean sp field", () => {
    const longKoreanPrompt = "가".repeat(500);
    const session: BattleSession = {
      sid: "long-prompt-test",
      q: "테스트 질문",
      mA: "anthropic:claude-haiku-4-5",
      mB: "google:gemini-2.5-flash",
      pA: "left",
      cat: "general",
      sp: longKoreanPrompt,
      sId: "",
      ts: Date.now(),
    };
    const token = createBattleToken(session);
    const result = verifyBattleToken(token);
    expect(result).not.toBeNull();
    expect(result!.sp).toBe(longKoreanPrompt);
    expect(result!.sp.length).toBe(500);
  });

  it("returns session with cat and sp fields present", () => {
    const session: BattleSession = {
      sid: "fields-check",
      q: "필드 확인",
      mA: "openai:gpt-4o-mini",
      mB: "anthropic:claude-haiku-4-5",
      pA: "left",
      cat: "creative",
      sp: "창의적 프롬프트",
      sId: "",
      ts: Date.now(),
    };
    const token = createBattleToken(session);
    const result = verifyBattleToken(token);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("cat");
    expect(result).toHaveProperty("sp");
  });

  it("expired token with cat/sp still returns null (TTL preserved)", () => {
    const session: BattleSession = {
      sid: "expired-cat",
      q: "만료 테스트",
      mA: "openai:gpt-4o-mini",
      mB: "google:gemini-2.5-flash",
      pA: "right",
      cat: "counseling",
      sp: "상담 프롬프트",
      sId: "",
      ts: Date.now() - 31 * 60 * 1000,
    };
    const token = createBattleToken(session);
    expect(verifyBattleToken(token)).toBeNull();
  });

  it("tampered token with cat/sp still returns null (HMAC preserved)", () => {
    const session: BattleSession = {
      sid: "tampered-cat",
      q: "변조 테스트",
      mA: "openai:gpt-4o-mini",
      mB: "anthropic:claude-haiku-4-5",
      pA: "left",
      cat: "cover-letter",
      sp: "자소서 프롬프트",
      sId: "",
      ts: Date.now(),
    };
    const token = createBattleToken(session);
    const tampered = token.slice(0, -1) + "x";
    expect(verifyBattleToken(tampered)).toBeNull();
  });
});
