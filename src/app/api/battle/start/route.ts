import { z } from "zod";
import { BUDGET_MODELS } from "@/lib/types";
import { insertBattle } from "@/lib/db/queries";

const requestSchema = z.object({
  question: z
    .string()
    .min(1, "질문을 입력해주세요")
    .max(2000, "질문이 너무 깁니다"),
  category: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, category } = requestSchema.parse(body);

    // 2개 모델 무작위 선택
    const shuffled = [...BUDGET_MODELS].sort(() => Math.random() - 0.5);
    const [modelA, modelB] = shuffled.slice(0, 2);
    const positionA = Math.random() > 0.5 ? "left" : "right";

    const battle = await insertBattle({
      question,
      model_a: modelA,
      model_b: modelB,
      position_a: positionA,
      category: category ?? "general",
    });

    return Response.json({
      battleId: battle.id,
      leftModelId: positionA === "left" ? modelA : modelB,
      rightModelId: positionA === "right" ? modelA : modelB,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("[battle/start] Error:", error);
    return Response.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
