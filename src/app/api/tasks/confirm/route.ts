import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json, readBody } from "@/lib/server/http";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await readBody(request)) as { qrToken?: unknown } | null;
    if (typeof body?.qrToken !== "string" || body.qrToken.length < 16) {
      throw new MarketplaceError("Scan or enter a valid QR token.");
    }
    const { supabase } = await requireSupabaseUser(request);
    const { data, error } = await supabase.rpc("confirm_completion", {
      p_qr_token: body.qrToken,
    });
    if (error) throw new MarketplaceError(error.message, 400);
    return json(data);
  } catch (error) {
    return apiError(error);
  }
}
