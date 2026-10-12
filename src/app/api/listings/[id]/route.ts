import { marketplace } from "@/lib/server/store";
import { apiError, getResident, json } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return json(
      marketplace.detail((await context.params).id, await getResident()),
    );
  } catch (error) {
    return apiError(error);
  }
}
