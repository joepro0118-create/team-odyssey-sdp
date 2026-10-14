import { apiError, json } from "@/lib/server/http";
import { readListingDetail } from "@/lib/server/listings";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, user } = await requireSupabaseUser(request);
    return json(await readListingDetail(supabase, user.id, (await context.params).id));
  } catch (error) {
    return apiError(error);
  }
}
