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
