import { isBrowserPreview } from "./demo-mode";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  if (isBrowserPreview) {
    const { previewApi } = await import("./browser-preview");
    return previewApi<T>(path, options);
  }
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server could not be reached. Please try again.");
  }
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
