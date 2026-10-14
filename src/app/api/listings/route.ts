import { MarketplaceError, validateListing } from "@/lib/marketplace-service";
import { apiError, json, readBody } from "@/lib/server/http";
import { readFeed } from "@/lib/server/listings";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireSupabaseUser(request);
    return json(await readFeed(supabase, user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = validateListing(await readBody(request));
    const { supabase, user } = await requireSupabaseUser(request);
    const { data, error } = await supabase.rpc("create_listing", {
      p_listing_type: input.type,
      p_category: input.category,
      p_title: input.title,
      p_description: input.description,
      p_area_label: input.area,
      p_timing: input.timing,
    });
    if (error) throw new MarketplaceError(error.message, 400);
    const createdRow = Array.isArray(data) ? data[0] : data;
    const createdId = (createdRow as { id?: string } | null)?.id;
    if (!createdId)
      throw new MarketplaceError("The new listing could not be created.", 500);
    const feed = await readFeed(supabase, user.id);
    const created = feed.listings.find((item) => item.id === createdId);
    if (!created)
      throw new MarketplaceError("The new listing could not be loaded.", 500);
    return json(created, 201);
  } catch (error) {
    return apiError(error);
  }
}
