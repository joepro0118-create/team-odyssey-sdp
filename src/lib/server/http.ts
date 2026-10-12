import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MarketplaceError } from "../marketplace-service";
import { residentIds, type ResidentId } from "../types";

export const sessionCookie = "tolong-demo-resident";

export async function getResident(): Promise<ResidentId> {
  const value = (await cookies()).get(sessionCookie)?.value;
  return residentIds.includes(value as ResidentId)
    ? (value as ResidentId)
    : "resident-a";
}

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store, private", Vary: "Cookie" },
  });
}

export async function readBody(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
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
