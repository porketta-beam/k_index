import { getModelStats } from "@/lib/db/queries";
import { supabase } from "@/lib/db/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;

    let countQuery = supabase
      .from("battles")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed");

    if (category) {
      countQuery = countQuery.eq("category", category);
    }

    const [modelStats, totalResult] = await Promise.all([
      getModelStats(category),
      countQuery,
    ]);

    return Response.json({
      modelStats,
      totalBattles: totalResult.count ?? 0,
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
