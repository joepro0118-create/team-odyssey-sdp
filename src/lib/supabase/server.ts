import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function getCurrentUser() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Pages only read sessions. src/proxy.ts writes refreshed cookies.
      setAll: () => {},
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}
