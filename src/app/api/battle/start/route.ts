import { z } from "zod";
import { nanoid } from "nanoid";
import { selectModelPair } from "@/lib/ai/pairing";
import { createBattleToken } from "@/lib/battle/session";
import { checkSeasonActive } from "@/lib/season/gate";
import { CATEGORIES } from "@/lib/categories";
import type { BattleStartResponse } from "@/lib/types";

const requestSchema = z.object({
  question: z
    .string()
    .min(1, "질문을 입력해주세요")
    .max(2000, "질문은 2,000자 이내로 입력해주세요"),
  category: z
    .string()
    .refine(
      (val) => CATEGORIES.some((c) => c.id === val),
      "유효하지 않은 카테고리입니다",
    ),
  systemPrompt: z
    .string()
    .min(1, "시스템 프롬프트를 입력해주세요")
    .max(500, "시스템 프롬프트는 500자 이내로 입력해주세요"),
});

export async function POST(req: Request) {
  try {
    // Season gate -- FIRST check before anything else (D-05, D-07, SEASON-02)
    const seasonCheck = await checkSeasonActive();
    if (!seasonCheck.active) {
      return Response.json(
        {
          error: "season_ended",
          seasonNumber: seasonCheck.seasonNumber,
          message: `시즌 ${seasonCheck.seasonNumber ?? ""} 배틀이 끝났습니다!`,
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { question, category, systemPrompt } = requestSchema.parse(body);

    const { modelA, modelB, positionA } = selectModelPair();

    const token = createBattleToken({
      sid: nanoid(),
      q: question,
      mA: modelA,
      mB: modelB,
      pA: positionA, // D-03, BATTLE-06: randomized position stored in token
      cat: category,      // Phase 3: category ID from validated request
      sp: systemPrompt,   // Phase 3: system prompt from validated request
      sId: seasonCheck.seasonId!,  // Phase 4: season_id from gate (non-null when active)
      ts: Date.now(),
    });

    return Response.json({ token } satisfies BattleStartResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[battle/start] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
