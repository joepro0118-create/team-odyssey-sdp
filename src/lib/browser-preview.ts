import { DemoMarketplace, MarketplaceError } from "./marketplace-service";
import { residentIds, type ResidentId } from "./types";

/** A fictional sandbox for one browser tab, never a shared or trusted backend. */
export function createBrowserPreview() {
  const store = new DemoMarketplace();
  let resident: ResidentId = "resident-a";
  const messagesStore: Record<
    string,
    Array<{
      id: string;
      senderRole: string;
      content: string;
      createdAt: string;
    }>
  > = {};

  return async function request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    if (options?.signal?.aborted)
      throw new DOMException("Aborted", "AbortError");
    const method = options?.method ?? "GET";
    let input: unknown;
    if (method === "POST") {
      try {
        input = JSON.parse(String(options?.body ?? "{}"));
      } catch {
        throw new MarketplaceError("The request could not be read.");
      }
    }

    let result: unknown;
    if (path === "/api/demo-session" && method === "POST") {
      const value = (input as { resident?: unknown } | null)?.resident;
      if (!residentIds.includes(value as ResidentId))
        throw new MarketplaceError("Choose a demo resident.");
      resident = value as ResidentId;
      result = { resident, demo: true };
    } else if (path === "/api/listings" && method === "GET") {
      result = {
        listings: store.list(resident),
        resident: {
          id: resident,
          label: `Resident ${resident.slice(-1).toUpperCase()} · demo`,
          area: "Demo Township · Precinct 3",
        },
        demo: true,
      };
    } else if (path === "/api/listings" && method === "POST") {
      result = store.create(input, resident);
    } else if (path === "/api/tasks/confirm" && method === "POST") {
      const qrToken =
        (input as { qrToken?: string } | null)?.qrToken ?? "demo-token";
      const match = /tolong-qr-([^-]+)/.exec(qrToken);
      const taskId = match ? match[1] : qrToken;
      result = store.complete(taskId);
    } else {
      const confirmationMatch =
        /^\/api\/tasks\/([^/]+)\/confirmation$/.exec(path);
      if (confirmationMatch && method === "POST") {
        const asgnId = confirmationMatch[1];
        result = {
          qrToken: `tolong-qr-${asgnId}-${Date.now().toString(36)}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };
      } else {
        const messagesMatch = /^\/api\/tasks\/([^/]+)\/messages$/.exec(path);
        if (messagesMatch) {
          const asgnId = messagesMatch[1];
          if (!messagesStore[asgnId]) {
            messagesStore[asgnId] = [
              {
                id: "msg-welcome",
                senderRole: "partner",
                content:
                  "Hi! Thanks for connecting. Let's arrange our meeting at the precinct hub.",
                createdAt: new Date(Date.now() - 300000).toISOString(),
              },
            ];
          }
          if (method === "GET") {
            result = { messages: messagesStore[asgnId] };
          } else if (method === "POST") {
            const body = input as { content?: string };
            const newMsg = {
              id: `msg-${Date.now()}`,
              senderRole: "user",
              content: body.content || "",
              createdAt: new Date().toISOString(),
            };
            messagesStore[asgnId].push(newMsg);
            result = newMsg;
          }
        } else {
          const simAcceptMatch =
            /^\/api\/listings\/([^/]+)\/simulate-accept$/.exec(path);
          if (simAcceptMatch && method === "POST") {
            result = store.simulateAccept(simAcceptMatch[1], resident);
          } else {
            const match = /^\/api\/listings\/([^/]+)(\/accept)?$/.exec(path);
            if (!match || (match[2] ? method !== "POST" : method !== "GET"))
              throw new MarketplaceError(
                "This preview action is unavailable.",
                404,
              );
            result = match[2]
              ? store.accept(match[1], resident)
              : store.detail(match[1], resident);
          }
        }
      }
    }
    return result as T;
  };
}

// Module memory deliberately resets on reload. Every tab gets its own demo.
export const previewApi = createBrowserPreview();
