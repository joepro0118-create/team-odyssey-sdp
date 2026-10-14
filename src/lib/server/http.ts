import "server-only";
import { NextResponse } from "next/server";
import { MarketplaceError } from "../marketplace-service";

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store, private", Vary: "Authorization" },
  });
}

export async function readBody(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  let originMatchesHost = true;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      const forwardedHost = request.headers
        .get("x-forwarded-host")
        ?.split(",")[0]
        .trim();
      const requestHost =
        forwardedHost ||
        request.headers.get("host") ||
        new URL(request.url).host;
      const forwardedProtocol = request.headers
        .get("x-forwarded-proto")
        ?.split(",")[0]
        .trim();

      originMatchesHost =
        originUrl.host === requestHost &&
        (!forwardedProtocol || originUrl.protocol === `${forwardedProtocol}:`);
    } catch {
      originMatchesHost = false;
    }
  }

  if (!originMatchesHost || fetchSite === "cross-site") {
    throw new MarketplaceError("Please submit from the Tolong app.", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new MarketplaceError("JSON is required.", 415);
  const body = await request.text();
  if (body.length > 16_000)
    throw new MarketplaceError("This request is too large.", 413);
  try {
    return JSON.parse(body);
  } catch {
    throw new MarketplaceError("The request could not be read.");
  }
}

export function apiError(error: unknown) {
  if (error instanceof MarketplaceError)
    return json({ error: error.message }, error.status);
  console.error("Marketplace request failed", error);
  return json({ error: "Something went wrong. Please try again." }, 500);
}
