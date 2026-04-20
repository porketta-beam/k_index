import { supabase } from "@/lib/db/client";
import type { SeasonGateResult } from "@/lib/types";

/**
 * Check if there is an active season that allows new battles (SEASON-02, D-05).
 * Called at the top of /api/battle/start before any model selection or token creation.
 * Queries Supabase directly (no cache) to ensure admin changes are immediately visible.
 */
export async function checkSeasonActive(): Promise<SeasonGateResult> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id, season_number, status")
    .eq("status", "active")
    .order("season_number", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No active season found -- either all ended or none exist
    return { active: false, seasonId: null, seasonNumber: null };
  }

  return {
    active: true,
    seasonId: data.id as string,
    seasonNumber: data.season_number as number,
  };
}
