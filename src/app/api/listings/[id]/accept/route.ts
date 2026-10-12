import { marketplace } from "@/lib/server/store";
import { apiError, getResident, json, readBody } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await readBody(request);
    return json(
      marketplace.accept((await context.params).id, await getResident()),
    );
  } catch (error) {
    return apiError(error);
  }
}
