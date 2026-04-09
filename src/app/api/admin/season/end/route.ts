import { verifyAdminKey } from "@/lib/admin/auth";
import { getCurrentSeason, endSeason } from "@/lib/season/queries";
import { getBattleCount } from "@/lib/season/counter";

export async function POST(req: Request) {
  // D-01: Admin auth via bearer token
  if (!verifyAdminKey(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const current = await getCurrentSeason();
    if (!current) {
      return Response.json(
        { error: "No active season to end" },
        { status: 404 },
      );
    }

    // Get final count from Redis for denormalized storage
    const finalCount = await getBattleCount(current.id);
    const ended = await endSeason(current.id, finalCount);

    return Response.json({ season: ended });
  } catch (error) {
    console.error("[admin/season/end] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
