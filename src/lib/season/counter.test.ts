import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis client
vi.mock("@/lib/redis/client", () => ({
  redis: {
    incr: vi.fn(),
    get: vi.fn(),
  },
}));

import { incrementBattleCounter, getBattleCount } from "@/lib/season/counter";
import { redis } from "@/lib/redis/client";

describe("season counter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("incrementBattleCounter", () => {
    it("should call redis.incr with correct key and return new count", async () => {
      (redis.incr as ReturnType<typeof vi.fn>).mockResolvedValue(42);
      const result = await incrementBattleCounter("season-uuid-123");
      expect(redis.incr).toHaveBeenCalledWith("season:season-uuid-123:battles");
      expect(result).toBe(42);
    });

    it("should return 1 for first increment", async () => {
      (redis.incr as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      const result = await incrementBattleCounter("new-season");
      expect(result).toBe(1);
    });
  });

  describe("getBattleCount", () => {
    it("should return count from redis", async () => {
      (redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(100);
      const result = await getBattleCount("season-uuid-123");
      expect(result).toBe(100);
    });

    it("should return 0 when key does not exist", async () => {
      (redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await getBattleCount("nonexistent");
      expect(result).toBe(0);
    });
  });
});
