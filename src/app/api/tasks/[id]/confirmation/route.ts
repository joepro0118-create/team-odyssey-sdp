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
    const { data, error } = await supabase.rpc("create_confirmation", {
      p_assignment_id: (await context.params).id,
    });
    if (error) throw new MarketplaceError(error.message, 403);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new MarketplaceError("A QR token could not be created.", 500);
    return json({ qrToken: result.qr_token, expiresAt: result.expires_at });
  } catch (error) {
    return apiError(error);
  }
}
