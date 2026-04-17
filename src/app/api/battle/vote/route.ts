import { z } from "zod";
import { insertVote, updateBattleStatus, getBattleById } from "@/lib/db/queries";
import type { VoteResult } from "@/lib/types";

const voteSchema = z.object({
  battleId: z.string().min(1),
  voteResult: z.enum(["left", "right", "tie", "both_bad"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { battleId, voteResult } = voteSchema.parse(body);

    const battle = await getBattleById(battleId);
    if (!battle) {
      return Response.json({ error: "배틀을 찾을 수 없습니다" }, { status: 404 });
    }

    // tie / both_bad는 그대로, left/right는 position_a 기준으로 a/b 변환
    let winner: VoteResult;
    if (voteResult === "tie" || voteResult === "both_bad") {
      winner = voteResult;
    } else {
      winner = (voteResult === "left") === (battle.position_a === "left") ? "a" : "b";
    }

    await insertVote({ battle_id: battleId, winner });
    await updateBattleStatus(battleId, "completed", new Date().toISOString());

    return Response.json({
      winner,
      leftModelId:
        battle.position_a === "left" ? battle.model_a : battle.model_b,
      rightModelId:
        battle.position_a === "right" ? battle.model_a : battle.model_b,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("[battle/vote] Error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
