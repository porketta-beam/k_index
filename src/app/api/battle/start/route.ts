import { z } from "zod";
import { nanoid } from "nanoid";
import { selectModelPair } from "@/lib/ai/pairing";
import { createBattleToken } from "@/lib/battle/session";
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
