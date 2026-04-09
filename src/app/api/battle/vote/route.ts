import { z } from "zod";
import { verifyBattleToken } from "@/lib/battle/session";
import { MODEL_DISPLAY_NAMES } from "@/lib/ai/config";
import { insertBattleWithVote, getModelWinRates } from "@/lib/db/queries";
import type { BattleVoteResponse } from "@/lib/types";

const requestSchema = z.object({
  token: z.string().min(1),
  winner: z.enum(["a", "b"]),
  responseA: z.string().min(1, "Response A is required"),
  responseB: z.string().min(1, "Response B is required"),
  durationA: z.number().min(0),
  durationB: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, winner, responseA, responseB, durationA, durationB } =
      requestSchema.parse(body);

    const session = verifyBattleToken(token);
    if (!session) {
      return Response.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    // D-07: Save battle + vote to DB in one operation at vote time
    const category = session.cat; // Phase 3: read category from signed token
    await insertBattleWithVote({
      question: session.q,
      modelA: session.mA,
      modelB: session.mB,
      positionA: session.pA, // D-03, BATTLE-06: use randomized position from token
      responseA,
      responseB,
      winner,
      category,
      durationA,
      durationB,
    });

    // D-09, D-10, BATTLE-05: Get win rates for revealed models
    const winRateRows = await getModelWinRates(category);

    const modelAWins = winRateRows.find((r) => r.model_id === session.mA);
    const modelBWins = winRateRows.find((r) => r.model_id === session.mB);

    const response: BattleVoteResponse = {
      modelA: {
        id: session.mA,
        displayName: MODEL_DISPLAY_NAMES[session.mA] ?? session.mA,
      },
      modelB: {
        id: session.mB,
        displayName: MODEL_DISPLAY_NAMES[session.mB] ?? session.mB,
      },
      winRates: {
        modelA: {
          wins: Number(modelAWins?.wins ?? 0),
          total: Number(modelAWins?.total ?? 0),
        },
        modelB: {
          wins: Number(modelBWins?.wins ?? 0),
          total: Number(modelBWins?.total ?? 0),
        },
      },
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[battle/vote] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
