import { supabase } from "@/lib/db/client";
import { getBattleCount } from "@/lib/season/counter";
import type { Season } from "@/lib/types";

/**
 * Get the currently active season, if any.
 */
export async function getCurrentSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .order("season_number", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Season;
}

/**
 * Create a new season with auto-incremented season number (D-02, SEASON-04).
 * Season number = MAX(existing season_number) + 1, or 1 for the first season.
 */
export async function createSeason(threshold: number): Promise<Season> {
  // Get the highest season number
  const { data: maxRow } = await supabase
    .from("seasons")
    .select("season_number")
    .order("season_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = maxRow ? (maxRow.season_number as number) + 1 : 1;

  const { data, error } = await supabase
    .from("seasons")
    .insert({
      season_number: nextNumber,
      status: "active",
      threshold,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create season: ${error.message}`);
  return data as Season;
}

/**
 * End a season: set status to 'ended', record ended_at and final battle_count (D-02, SEASON-04).
 */
export async function endSeason(seasonId: string, finalBattleCount: number): Promise<Season> {
  const { data, error } = await supabase
    .from("seasons")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      battle_count: finalBattleCount,
    })
    .eq("id", seasonId)
    .select()
    .single();

  if (error) throw new Error(`Failed to end season: ${error.message}`);
  return data as Season;
}

/**
 * Auto-end season if the Redis counter has reached or exceeded the threshold (SEASON-02).
 * Called after each vote's counter increment.
 */
export async function endSeasonIfThresholdReached(seasonId: string, threshold: number): Promise<boolean> {
  const count = await getBattleCount(seasonId);
  if (count >= threshold) {
    await endSeason(seasonId, count);
    return true;
  }
  return false;
}
