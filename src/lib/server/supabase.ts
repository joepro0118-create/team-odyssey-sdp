import "server-only";

import { createClient } from "@supabase/supabase-js";
import { MarketplaceError } from "../marketplace-service";

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new MarketplaceError("Supabase is not configured for this deployment.", 503);
  }
  return { url, key };
}

export async function requireSupabaseUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) throw new MarketplaceError("Please sign in to continue.", 401);

  const { url, key } = publicConfig();
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new MarketplaceError("Your session has expired. Please sign in again.", 401);
  }
  return { supabase, user: data.user };
}
