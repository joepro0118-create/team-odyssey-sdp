import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json, readBody } from "@/lib/server/http";
import { readListingDetail } from "@/lib/server/listings";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await readBody(request);
    const id = (await context.params).id;
    const { supabase, user } = await requireSupabaseUser(request);
    const { error } = await supabase.rpc("cancel_listing", { p_listing_id: id });
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      throw new MarketplaceError(error.message, status);
    }
    return json(await readListingDetail(supabase, user.id, id));
  } catch (error) {
    return apiError(error);
  }
}
