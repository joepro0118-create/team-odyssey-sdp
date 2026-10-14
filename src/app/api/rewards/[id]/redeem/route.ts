import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json, readBody } from "@/lib/server/http";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await readBody(request);
    const { supabase } = await requireSupabaseUser(request);
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_reward_id: (await context.params).id,
    });
    if (error) {
      const status = /insufficient|out of stock|unavailable/i.test(error.message)
        ? 409
        : 400;
      throw new MarketplaceError(error.message, status);
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row)
      throw new MarketplaceError("The reward could not be redeemed.", 500);
    return json({
      id: row.id,
      rewardId: row.reward_id,
      pointsSpent: row.points_spent,
      status: row.status,
      createdAt: row.created_at,
    });
  } catch (error) {
    return apiError(error);
  }
}
