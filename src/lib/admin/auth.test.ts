import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { ADMIN_API_KEY: "a".repeat(32) }, // 32-char test key
}));

import { verifyAdminKey } from "@/lib/admin/auth";

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new Request("http://localhost/api/admin/test", { headers });
}

describe("verifyAdminKey", () => {
  it("should return true for valid admin key", () => {
    const req = makeRequest(`Bearer ${"a".repeat(32)}`);
    expect(verifyAdminKey(req)).toBe(true);
  });

  it("should return false for missing authorization header", () => {
    const req = makeRequest();
    expect(verifyAdminKey(req)).toBe(false);
  });

  it("should return false for wrong prefix (not Bearer)", () => {
    const req = makeRequest(`Basic ${"a".repeat(32)}`);
    expect(verifyAdminKey(req)).toBe(false);
  });

  it("should return false for wrong key", () => {
    const req = makeRequest(`Bearer ${"b".repeat(32)}`);
    expect(verifyAdminKey(req)).toBe(false);
  });

  it("should return false for key with different length", () => {
    const req = makeRequest("Bearer short");
    expect(verifyAdminKey(req)).toBe(false);
  });

  it("should return false for empty bearer token", () => {
    const req = makeRequest("Bearer ");
    expect(verifyAdminKey(req)).toBe(false);
  });
});
