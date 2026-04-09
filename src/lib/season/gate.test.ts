import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/db/client", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { checkSeasonActive } from "@/lib/season/gate";

describe("season gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return active=true with season data when active season exists", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "uuid-1", season_number: 3, status: "active" },
      error: null,
    });

    const result = await checkSeasonActive();
    expect(result).toEqual({
      active: true,
      seasonId: "uuid-1",
      seasonNumber: 3,
    });
    expect(mockFrom).toHaveBeenCalledWith("seasons");
    expect(mockEq).toHaveBeenCalledWith("status", "active");
  });

  it("should return active=false when no active season exists", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    const result = await checkSeasonActive();
    expect(result).toEqual({
      active: false,
      seasonId: null,
      seasonNumber: null,
    });
  });

  it("should return active=false on unexpected error", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "500", message: "Internal error" },
    });

    const result = await checkSeasonActive();
    expect(result.active).toBe(false);
  });
});
