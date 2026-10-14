import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.has("error");
  // The destination is fixed; never use an untrusted `next` query parameter.
  // A relative Location also avoids leaking the server's internal hostname.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/", "Cache-Control": "private, no-store" },
  });

  function failed(reason: "not_configured" | "oauth_failed") {
    response.headers.set("Location", "/login?error=" + reason);
    return response;
  }

  if (!config) return failed("not_configured");
  if (!code || providerError) return failed("oauth_failed");

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? failed("oauth_failed") : response;
  } catch {
    return failed("oauth_failed");
  }
}
