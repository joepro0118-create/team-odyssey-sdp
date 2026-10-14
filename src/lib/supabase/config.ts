export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) return null;

  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (
      parsed.protocol !== "https:" &&
      !(local && parsed.protocol === "http:")
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, publishableKey };
}
