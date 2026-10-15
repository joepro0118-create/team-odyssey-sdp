import { getSupabaseBrowserClient } from "./supabase-browser";
import { previewApi } from "./browser-preview";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const { data: sessionData } =
      await getSupabaseBrowserClient().auth.getSession();
    const token = sessionData.session?.access_token;
    if (token) {
      const response = await fetch(path, {
        ...options,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options?.headers,
        },
      });
      if (response.ok) {
        return (await response.json()) as T;
      }
    }
  } catch {
    // If Supabase network or session fails, fall back to simulated preview
  }

  // Gracefully fall back to local simulated browser preview
  return previewApi<T>(path, options);
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
