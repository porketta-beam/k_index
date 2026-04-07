import { streamText } from "ai";
import { z } from "zod";
import { registry } from "@/lib/ai/registry";
import { BATTLE_CONFIG } from "@/lib/ai/config";
import { BUDGET_MODELS } from "@/lib/types";

// Vercel function timeout -- 60s is sufficient for streaming AI responses
// Per RESEARCH.md Pitfall 5: Streaming Timeout on Vercel
export const maxDuration = 60;

const requestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt must be under 2000 characters"),
  modelId: z.enum(BUDGET_MODELS),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, modelId } = requestSchema.parse(body);

    const result = streamText({
      model: registry.languageModel(modelId),
      system: BATTLE_CONFIG.systemPrompt,
      prompt,
      maxOutputTokens: BATTLE_CONFIG.maxOutputTokens,
      temperature: BATTLE_CONFIG.temperature,
      onFinish: async ({ text, usage }) => {
        // Phase 1: Log token usage for cost monitoring only.
        // Database persistence (insertBattle/updateBattleResponse) is NOT wired here.
        // The full battle creation flow (random model pairing, position assignment,
        // battleId generation) does not exist until Phase 2.
        // This endpoint streams a single model response; Phase 2 orchestrates paired battles.
        console.log(
          `[battle/stream] ${modelId}: ${usage?.totalTokens ?? "?"} tokens, ${text.length} chars`,
        );
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 },
      );
    }

    console.error("[battle/stream] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
