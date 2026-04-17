import { supabase } from "@/lib/db/client";
import type { Battle, BattleStatus, Vote, VoteResult } from "@/lib/types";

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
  winner: VoteResult;
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

export interface ModelStat {
  modelId: string;
  totalBattles: number;
  wins: number;
  winRate: number;
}

function normalizeModelId(id: string): string {
  if (id.startsWith("anthropic:claude-haiku-4-5")) return "anthropic:claude-haiku-4-5-20251001";
  return id;
}

export async function getModelStats(category?: string): Promise<ModelStat[]> {
  // model_a 기준 집계
  let queryA = supabase
    .from("battles")
    .select("model_a, votes(winner)")
    .eq("status", "completed");

  // model_b 기준 집계
  let queryB = supabase
    .from("battles")
    .select("model_b, votes(winner)")
    .eq("status", "completed");

  if (category) {
    queryA = queryA.eq("category", category);
    queryB = queryB.eq("category", category);
  }

  const [{ data: asA, error: errA }, { data: asB, error: errB }] =
    await Promise.all([queryA, queryB]);

  if (errA || errB) throw new Error("Failed to get model stats");


  const map: Record<string, { battles: number; wins: number }> = {};

  for (const row of asA ?? []) {
    const id = normalizeModelId(row.model_a);
    if (!map[id]) map[id] = { battles: 0, wins: 0 };
    map[id].battles += 1;
    const votes = row.votes as { winner: string }[] | null;
    if (votes?.[0]?.winner === "a") map[id].wins += 1;
  }

  for (const row of asB ?? []) {
    const id = normalizeModelId(row.model_b);
    if (!map[id]) map[id] = { battles: 0, wins: 0 };
    map[id].battles += 1;
    const votes = row.votes as { winner: string }[] | null;
    if (votes?.[0]?.winner === "b") map[id].wins += 1;
  }

  return Object.entries(map)
    .map(([modelId, { battles, wins }]) => ({
      modelId,
      totalBattles: battles,
      wins,
      winRate: battles > 0 ? Math.round((wins / battles) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}
