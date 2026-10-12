import { marketplace } from "@/lib/server/store";
import { apiError, getResident, json, readBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resident = await getResident();
    return json({ listings: marketplace.list(resident), resident, demo: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return json(
      marketplace.create(await readBody(request), await getResident()),
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
