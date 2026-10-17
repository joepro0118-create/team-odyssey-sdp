import { DemoMarketplace, MarketplaceError } from "./marketplace-service";
import { residentIds, type ResidentId, type Reward } from "./types";
import {
  processAssistantRequest,
  type AssistantMessage,
  type LanguageChoice,
} from "./assistant-engine";

/** A fictional sandbox for one browser tab, never a shared or trusted backend. */
export function createBrowserPreview() {
  const store = new DemoMarketplace();
  let resident: ResidentId = "resident-a";
  let pointsBalance = 140;
  const demoRewards: Reward[] = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      title: "Community Café Drink",
      description:
        "Demo reward for one drink at the fictional community café.",
      pointsCost: 100,
      stock: 20,
      isDemo: true,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      title: "Sports Court Pass",
      description:
        "Demo reward for one fictional township sports court session.",
      pointsCost: 200,
      stock: 10,
      isDemo: true,
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      title: "Family Activity Pass",
      description: "Demo reward for one fictional township family activity.",
      pointsCost: 300,
      stock: 5,
      isDemo: true,
    },
  ];
  const messagesStore: Record<
    string,
    Array<{
      id: string;
      senderId: string;
      senderLabel: string;
      message: string;
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
    } else if (path === "/api/assistant" && method === "POST") {
      const msgs =
        (input as { messages?: AssistantMessage[] } | null)?.messages ?? [];
      const lang = (input as { language?: LanguageChoice } | null)?.language;
      result = await processAssistantRequest(msgs, lang);
    } else if (path === "/api/rewards" && method === "GET") {
      result = {
        balance: pointsBalance,
        rewards: demoRewards.map((reward) => ({ ...reward })),
      };
    } else if (method === "POST") {
      const redeemMatch = /^\/api\/rewards\/([^/]+)\/redeem$/.exec(path);
      if (redeemMatch) {
        const reward = demoRewards.find((item) => item.id === redeemMatch[1]);
        if (!reward) throw new MarketplaceError("Reward is unavailable.", 404);
        if (reward.stock < 1)
          throw new MarketplaceError("Reward is out of stock.", 409);
        if (pointsBalance < reward.pointsCost)
          throw new MarketplaceError("Insufficient points.", 409);
        reward.stock -= 1;
        pointsBalance -= reward.pointsCost;
        result = {
          id: `redemption-${Date.now()}`,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          status: "confirmed",
          createdAt: new Date().toISOString(),
        };
      }
    }
    if (result !== undefined) {
      return result as T;
    }
    if (path === "/api/tasks/confirm" && method === "POST") {
      const qrToken =
        (input as { qrToken?: string } | null)?.qrToken ?? "demo-token";
      const match = /tolong-qr-([^-]+)/.exec(qrToken);
      const taskId = match ? match[1] : qrToken;
      const completed = store.complete(taskId);
      pointsBalance += completed.pointsAwarded;
      result = completed;
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
          const cleanListingId = asgnId.replace(/^asgn-/, "");
          const relatedListing = store
            .list(resident)
            .find((l) => l.id === cleanListingId || l.id === asgnId);
          const isLocked =
            relatedListing?.status === "completed" ||
            relatedListing?.status === "cancelled";

          if (!messagesStore[asgnId]) {
            messagesStore[asgnId] = [
              {
                id: "msg-welcome",
                senderId: "partner",
                senderLabel: relatedListing?.isOwner ? "Helper" : "Requester",
                message:
                  "Hi! Thanks for connecting. Let's arrange our meeting at the precinct hub.",
                createdAt: new Date(Date.now() - 300000).toISOString(),
              },
            ];
          }
          if (method === "GET") {
            result = {
              messages: messagesStore[asgnId].map((m) => ({
                ...m,
                isSelf: m.senderId === resident,
              })),
              isLocked,
            };
          } else if (method === "POST") {
            if (isLocked) {
              throw new MarketplaceError(
                "Task is no longer active for messaging.",
                400,
              );
            }
            const body = input as { message?: string; content?: string } | null;
            const text = (body?.message ?? body?.content ?? "").trim();
            if (!text || text.length > 500) {
              throw new MarketplaceError(
                "Message must be between 1 and 500 characters.",
                400,
              );
            }
            const newMsg = {
              id: `msg-${Date.now()}`,
              senderId: resident,
              senderLabel: relatedListing?.isOwner ? "Requester" : "Helper",
              message: text,
              createdAt: new Date().toISOString(),
            };
            messagesStore[asgnId].push(newMsg);
            result = {
              ...newMsg,
              isSelf: true,
            };
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
