import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockSingle = vi.fn();
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockEqChain = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockUpdate = vi.fn(() => ({ eq: mockEqChain }));
const mockLimitSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockLimitSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelectQuery = vi.fn();

vi.mock("@/lib/db/client", () => {
  const fromImpl = (table: string) => {
    if (table === "seasons") {
      return {
        select: (...args: unknown[]) => {
          mockSelectQuery(...args);
          const orderFn = (...orderArgs: unknown[]) => {
            mockOrder(...orderArgs);
            return {
              limit: (...limitArgs: unknown[]) => {
                mockLimit(...limitArgs);
                return { single: mockLimitSingle };
              },
            };
          };
          return {
            eq: (...eqArgs: unknown[]) => {
              mockEq(...eqArgs);
              return {
                order: orderFn,
              };
            },
            order: orderFn,
          };
        },
        insert: (...args: unknown[]) => {
          mockInsert(...args);
          return { select: vi.fn(() => ({ single: mockSingle })) };
        },
        update: (...args: unknown[]) => {
          mockUpdate(...args);
          return { eq: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })) };
        },
      };
    }
    return {};
  };
  return { supabase: { from: fromImpl } };
});

vi.mock("@/lib/season/counter", () => ({
  getBattleCount: vi.fn(),
}));

import { getCurrentSeason, createSeason, endSeason } from "@/lib/season/queries";

describe("season queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentSeason", () => {
    it("should return active season when found", async () => {
      const season = { id: "s1", season_number: 1, status: "active", threshold: 500, battle_count: 0, started_at: "2026-01-01T00:00:00Z", ended_at: null };
      mockLimitSingle.mockResolvedValue({ data: season, error: null });

      const result = await getCurrentSeason();
      expect(result).toEqual(season);
    });

    it("should return null when no active season", async () => {
      mockLimitSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await getCurrentSeason();
      expect(result).toBeNull();
    });
  });

  describe("createSeason", () => {
    it("should create season with auto-incremented number", async () => {
      // Mock: no existing seasons
      mockLimitSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });
      // Mock: insert succeeds
      const newSeason = { id: "s1", season_number: 1, status: "active", threshold: 500, battle_count: 0, started_at: "2026-01-01", ended_at: null };
      mockSingle.mockResolvedValue({ data: newSeason, error: null });

      const result = await createSeason(500);
      expect(result).toEqual(newSeason);
      expect(mockInsert).toHaveBeenCalledWith({
        season_number: 1,
        status: "active",
        threshold: 500,
      });
    });
  });

  describe("endSeason", () => {
    it("should update season status to ended", async () => {
      const ended = { id: "s1", season_number: 1, status: "ended", threshold: 500, battle_count: 42, started_at: "2026-01-01", ended_at: "2026-01-15" };
      mockSingle.mockResolvedValue({ data: ended, error: null });

      const result = await endSeason("s1", 42);
      expect(result).toEqual(ended);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: "ended",
        battle_count: 42,
      }));
    });
  });
});
