import { supabase } from "@/lib/db/client";
import type { Battle, BattleStatus, Vote } from "@/lib/types";

export async function insertBattle(data: {
  question: string;
  model_a: string;
  model_b: string;
  position_a: "left" | "right";
  category?: string;
}): Promise<Battle> {
  const { data: battle, error } = await supabase
    .from("battles")
    .insert({
      question: data.question,
      model_a: data.model_a,
      model_b: data.model_b,
      position_a: data.position_a,
      category: data.category ?? "general",
      status: "pending" as BattleStatus,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert battle: ${error.message}`);
  return battle as Battle;
}

export async function updateBattleResponse(
  battleId: string,
  field: "response_a" | "response_b",
  response: string,
): Promise<void> {
  const { error } = await supabase
    .from("battles")
    .update({ [field]: response })
    .eq("id", battleId);

  if (error)
    throw new Error(`Failed to update battle response: ${error.message}`);
}

export async function updateBattleStatus(
  battleId: string,
  status: BattleStatus,
  completedAt?: string,
): Promise<void> {
  const updateData: Record<string, unknown> = { status };
  if (completedAt) updateData.completed_at = completedAt;

  const { error } = await supabase
    .from("battles")
    .update(updateData)
    .eq("id", battleId);

  if (error)
    throw new Error(`Failed to update battle status: ${error.message}`);
}

export async function insertVote(data: {
  battle_id: string;
  winner: "a" | "b";
}): Promise<Vote> {
  const { data: vote, error } = await supabase
    .from("votes")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert vote: ${error.message}`);
  return vote as Vote;
}

export async function getBattleById(
  battleId: string,
): Promise<Battle | null> {
  const { data, error } = await supabase
    .from("battles")
    .select()
    .eq("id", battleId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to get battle: ${error.message}`);
  }
  return data as Battle;
}

/**
 * Insert battle + vote in one operation (D-07: save at vote time only).
 *
 * ACCEPTED RISK: Uses sequential inserts because Supabase JS client does not
 * support transactions. If the vote insert fails after the battle insert
 * succeeds, an orphaned completed battle record is left in the DB. This is
 * acceptable for v1 because: (1) vote insert failures are rare (schema is
 * simple), (2) orphaned battles do not affect win rate computation (the RPC
 * function joins battles+votes, so battles without votes are excluded),
 * (3) adding a PostgreSQL RPC for atomic write is a Phase 3+ optimization
 * if orphan rate becomes measurable.
 */
export async function insertBattleWithVote(data: {
  question: string;
  modelA: string;
  modelB: string;
  positionA: "left" | "right";
  responseA: string;
  responseB: string;
  winner: "a" | "b";
  category: string;
  durationA: number;
  durationB: number;
}): Promise<{ battle: Battle; vote: Vote }> {
  // Insert battle as completed
  const { data: battle, error: battleError } = await supabase
    .from("battles")
    .insert({
      question: data.question,
      model_a: data.modelA,
      model_b: data.modelB,
      response_a: data.responseA,
      response_b: data.responseB,
      position_a: data.positionA, // D-03, BATTLE-06: randomized position from session token
      category: data.category,
      status: "completed" as BattleStatus,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (battleError) throw new Error(`Failed to insert battle: ${battleError.message}`);

  // Insert vote linked to the battle
  const { data: vote, error: voteError } = await supabase
    .from("votes")
    .insert({
      battle_id: (battle as Battle).id,
      winner: data.winner,
    })
    .select()
    .single();

  if (voteError) throw new Error(`Failed to insert vote: ${voteError.message}`);

  return { battle: battle as Battle, vote: vote as Vote };
}

/**
 * Get win rates per model for a given category (D-09, BATTLE-05).
 * Calls the PostgreSQL RPC function get_model_win_rates.
 */
export async function getModelWinRates(
  category: string,
): Promise<Array<{ model_id: string; wins: number; total: number }>> {
  const { data, error } = await supabase.rpc("get_model_win_rates", {
    category_filter: category,
  });

  if (error) {
    console.error("[getModelWinRates] RPC error:", error);
    return []; // Graceful fallback: show 0% win rates rather than crash
  }

  return (data ?? []) as Array<{ model_id: string; wins: number; total: number }>;
}
