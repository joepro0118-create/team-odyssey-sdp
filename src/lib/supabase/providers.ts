import "server-only";
import { getSupabaseConfig } from "./config";

export async function isGoogleSignInEnabled() {
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const response = await fetch(new URL("/auth/v1/settings", config.url), {
      headers: { apikey: config.publishableKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const settings = await response.json();
    return settings.external?.google === true;
  } catch {
    // Email login remains usable when provider discovery is unavailable.
    return false;
  }
}
