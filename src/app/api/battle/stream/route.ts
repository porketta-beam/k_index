import { streamText } from "ai";
import { z } from "zod";
import { registry } from "@/lib/ai/registry";
import { BATTLE_CONFIG } from "@/lib/ai/config";
import { verifyBattleToken } from "@/lib/battle/session";

export const maxDuration = 60;

const requestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  slot: z.enum(["a", "b"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, slot } = requestSchema.parse(body);

    const session = verifyBattleToken(token);
    if (!session) {
      return Response.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    // CRITICAL (D-08): Model ID comes from signed token, never from client
    const modelId = slot === "a" ? session.mA : session.mB;
    // CRITICAL (D-08): Question comes from signed token, not from client
    const prompt = session.q;

    const result = streamText({
      model: registry.languageModel(modelId),
      system: session.sp, // Phase 3: system prompt from signed token, not hardcoded
      prompt,
      maxOutputTokens: BATTLE_CONFIG.maxOutputTokens,
      temperature: BATTLE_CONFIG.temperature,
    });

    return result.toTextStreamResponse();
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
