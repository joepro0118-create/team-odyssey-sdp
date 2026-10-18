import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json } from "@/lib/server/http";
import { requireSupabaseUser } from "@/lib/server/supabase";
import type { OperatorDashboardSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireSupabaseUser(request);

    // Try the privileged operator RPC first (requires profile.role = 'operator').
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "operator_dashboard_summary",
    );

    if (!rpcError && rpcData && typeof rpcData === "object") {
      const summary = rpcData as Record<string, unknown>;
      const response: OperatorDashboardSummary = {
        openListings: Number(summary.openListings ?? 0),
        acceptedListings: Number(summary.acceptedListings ?? 0),
        completedListings: Number(summary.completedListings ?? 0),
        totalPointsAwarded: Number(summary.totalPointsAwarded ?? 0),
        totalRedemptions: Number(summary.totalRedemptions ?? 0),
        demo: true,
      };
      return json(response);
    }

    // Fallback for prototype sessions: compute anonymous status counts from listings.
    const { data: rows, error: listError } = await supabase
      .from("listings")
      .select("status, points_reward");

    if (listError) throw new MarketplaceError(listError.message, 500);

    const list = (rows ?? []) as Array<{
      status: string;
      points_reward: number;
    }>;
    const openListings = list.filter((r) => r.status === "open").length;
    const acceptedListings = list.filter(
      (r) =>
        r.status === "accepted" || r.status === "awaiting_confirmation",
    ).length;
    const completedRows = list.filter((r) => r.status === "completed");
    const completedListings = completedRows.length;
    const totalPointsAwarded = completedRows.reduce(
      (sum, r) => sum + (Number(r.points_reward) || 0),
      0,
    );

    const response: OperatorDashboardSummary = {
      openListings,
      acceptedListings,
      completedListings,
      totalPointsAwarded,
      totalRedemptions: 0,
      demo: true,
    };
    return json(response);
  } catch (error) {
    return apiError(error);
  }
}
