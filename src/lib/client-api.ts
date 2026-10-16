import { getSupabaseBrowserClient } from "./supabase-browser";
import { previewApi } from "./browser-preview";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let token: string | undefined;
  try {
    const { data: sessionData } =
      await getSupabaseBrowserClient().auth.getSession();
    token = sessionData.session?.access_token;
  } catch {
    token = undefined;
  }

  // Preview is only for a signed-out tab. A signed-in call must keep the
  // server's role checks, including who may show or scan a handover QR.
  if (!token) return previewApi<T>(path, options);

  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (response.ok) return (await response.json()) as T;

  let message = "Something went wrong. Please try again.";
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) message = body.error;
  } catch {
    // Keep the generic message when the server body is not JSON.
  }
  throw new Error(message);
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
