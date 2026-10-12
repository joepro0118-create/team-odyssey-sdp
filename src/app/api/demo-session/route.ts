import { residentIds, type ResidentId } from "@/lib/types";
import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json, readBody, sessionCookie } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const body = (await readBody(request)) as { resident?: unknown } | null;
    const resident = body?.resident;
    if (!residentIds.includes(resident as ResidentId))
      throw new MarketplaceError("Choose a demo resident.");
    const response = json({ resident, demo: true });
    response.cookies.set(sessionCookie, resident as string, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 86400,
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
