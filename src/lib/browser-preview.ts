import { DemoMarketplace, MarketplaceError } from "./marketplace-service";
import { residentIds, type ResidentId } from "./types";

/** A fictional sandbox for one browser tab, never a shared or trusted backend. */
export function createBrowserPreview() {
  const store = new DemoMarketplace();
  let resident: ResidentId = "resident-a";

  return async function request<T>(path: string, options?: RequestInit): Promise<T> {
    if (options?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const method = options?.method ?? "GET";
    let input: unknown;
    if (method === "POST") {
      try { input = JSON.parse(String(options?.body ?? "{}")); }
      catch { throw new MarketplaceError("The request could not be read."); }
    }

    let result: unknown;
    if (path === "/api/demo-session" && method === "POST") {
      const value = (input as { resident?: unknown } | null)?.resident;
      if (!residentIds.includes(value as ResidentId)) throw new MarketplaceError("Choose a demo resident.");
      resident = value as ResidentId;
      result = { resident, demo: true };
    } else if (path === "/api/listings" && method === "GET") {
      result = { listings: store.list(resident), resident, demo: true };
    } else if (path === "/api/listings" && method === "POST") {
      result = store.create(input, resident);
    } else {
      const match = /^\/api\/listings\/([^/]+)(\/accept)?$/.exec(path);
      if (!match || (match[2] ? method !== "POST" : method !== "GET")) throw new MarketplaceError("This preview action is unavailable.", 404);
      result = match[2] ? store.accept(match[1], resident) : store.detail(match[1], resident);
    }
    return result as T;
  };
}

// Module memory deliberately resets on reload. Every tab gets its own demo.
export const previewApi = createBrowserPreview();
