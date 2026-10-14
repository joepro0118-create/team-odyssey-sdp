import { getSupabaseBrowserClient } from "./supabase-browser";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: sessionData } =
    await getSupabaseBrowserClient().auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Please sign in to continue.");
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  let responseData: { error?: string } | T;
  try {
    responseData = (await response.json()) as { error?: string } | T;
  } catch {
    throw new Error("The server could not be reached. Please try again.");
  }
  if (!response.ok)
    throw new Error(
      (responseData as { error?: string }).error ||
        "Something went wrong. Please try again.",
    );
  return responseData as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
