import { verifyAdminKey } from "@/lib/admin/auth";
import { getCurrentSeason, createSeason } from "@/lib/season/queries";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  // D-01: Admin auth via bearer token
  if (!verifyAdminKey(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if there's already an active season
    const current = await getCurrentSeason();
    if (current) {
      return Response.json(
        { error: "A season is already active", season: current },
        { status: 409 },
      );
    }

    // D-03: threshold from env var
    const season = await createSeason(env.SEASON_BATTLE_THRESHOLD);

    return Response.json({ season }, { status: 201 });
  } catch (error) {
    console.error("[admin/season/start] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
