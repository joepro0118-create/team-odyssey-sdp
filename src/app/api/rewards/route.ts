import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json } from "@/lib/server/http";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireSupabaseUser(request);
    const [rewardResult, balanceResult] = await Promise.all([
      supabase
        .from("rewards")
        .select("id, title, description, points_cost, stock, is_demo")
        .eq("active", true)
        .eq("is_demo", true)
        .order("points_cost"),
      supabase.rpc("get_my_points_balance"),
    ]);
    if (rewardResult.error)
      throw new MarketplaceError(rewardResult.error.message, 500);
    if (balanceResult.error)
      throw new MarketplaceError(balanceResult.error.message, 500);
    return json({
      balance: Number(balanceResult.data ?? 0),
      rewards: (rewardResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        pointsCost: row.points_cost,
        stock: row.stock,
        isDemo: true,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
