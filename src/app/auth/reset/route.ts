import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

// Recovery links land here so the password form can open after the code is
// exchanged. The destination stays fixed; do not honour a `next` parameter.
export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.has("error");
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/login?recovery=1",
      "Cache-Control": "private, no-store",
    },
  });

  function failed() {
    response.headers.set("Location", "/login?error=reset_failed");
    return response;
  }

  if (!config || !code || providerError) return failed();

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
    return error ? failed() : response;
  } catch {
    return failed();
  }
}
