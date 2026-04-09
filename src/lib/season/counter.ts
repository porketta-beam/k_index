import { redis } from "@/lib/redis/client";

/**
 * Atomically increment the battle counter for a season.
 * Redis INCR is single-operation atomic -- no race conditions (SEASON-01, DATA-02).
 * Returns the NEW value after increment.
 */
export async function incrementBattleCounter(seasonId: string): Promise<number> {
  const count = await redis.incr(`season:${seasonId}:battles`);
  return count;
}

/**
 * Get the current battle count for a season.
 * Returns 0 if the key does not exist (new season, no battles yet).
 */
export async function getBattleCount(seasonId: string): Promise<number> {
  const count = await redis.get<number>(`season:${seasonId}:battles`);
  return count ?? 0;
}
