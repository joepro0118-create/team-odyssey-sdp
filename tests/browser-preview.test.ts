import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserPreview } from "../src/lib/browser-preview";
import {
  templates,
  type Listing,
  type ListingDetail,
  type FeedResponse,
  type RewardsResponse,
  type Redemption,
  type ConfirmationResult,
  type CompletionResult,
  type TaskChatResponse,
  type TaskMessage,
  type OperatorDashboardSummary,
} from "../src/lib/types";

test("preview can post, switch residents, accept, and view activity within one tab", async () => {
  const api = createBrowserPreview();
  const listing = await api<Listing>("/api/listings", { method: "POST", body: JSON.stringify(templates[0]) });
  await assert.rejects(api(`/api/listings/${listing.id}/accept`, { method: "POST", body: "{}" }), /own listing/);
  await api("/api/demo-session", { method: "POST", body: JSON.stringify({ resident: "resident-b" }) });
  const accepted = await api<ListingDetail>(`/api/listings/${listing.id}/accept`, { method: "POST", body: "{}" });
  assert.equal(accepted.status, "accepted");
  assert.match(accepted.contact!.name, /Aina/);
  assert.equal((await api<FeedResponse>("/api/listings")).listings.find(item => item.id === listing.id)?.isParticipant, true);
  await api("/api/demo-session", { method: "POST", body: JSON.stringify({ resident: "resident-c" }) });
  assert.equal((await api<ListingDetail>(`/api/listings/${listing.id}`)).contact, undefined);
  await assert.rejects(api(`/api/listings/${listing.id}/accept`, { method: "POST", body: "{}" }), /already accepted/);
});

test("each preview tab and reload starts a separate fictional sandbox", async () => {
  const first = createBrowserPreview();
  const listing = await first<Listing>("/api/listings", { method: "POST", body: JSON.stringify(templates[2]) });
  const second = createBrowserPreview();
  const feed = await second<FeedResponse>("/api/listings");
  assert.equal(feed.listings.length, templates.length);
  assert.equal(feed.resident.id, "resident-a");
  await assert.rejects(second(`/api/listings/${listing.id}`), /could not be found/);
});

test("preview rewards can be listed and redeemed", async () => {
  const api = createBrowserPreview();
  const before = await api<RewardsResponse>("/api/rewards");
  assert.equal(before.balance, 140);
  assert.equal(before.rewards.length, 3);
  const drink = before.rewards[0];
  const redeemed = await api<Redemption>(`/api/rewards/${drink.id}/redeem`, {
    method: "POST",
    body: "{}",
  });
  assert.equal(redeemed.pointsSpent, drink.pointsCost);
  const after = await api<RewardsResponse>("/api/rewards");
  assert.equal(after.balance, 140 - drink.pointsCost);
  assert.equal(after.rewards[0].stock, drink.stock - 1);
});

test("preview rewards have valid points cost and active stock for all screens", async () => {
  const api = createBrowserPreview();
  const res = await api<RewardsResponse>("/api/rewards");
  assert.ok(res.rewards.length > 0);
  for (const reward of res.rewards) {
    assert.ok(reward.pointsCost > 0, "Reward points cost must be positive");
    assert.ok(reward.stock >= 0, "Reward stock must be non-negative");
    assert.ok(reward.title.length > 0, "Reward title must not be empty");
  }
});

test("preview task chat and QR handover confirmation update messages, lock state, and points balance", async () => {
  const api = createBrowserPreview();
  const listing = await api<Listing>("/api/listings", {
    method: "POST",
    body: JSON.stringify(templates[0]),
  });
  await api("/api/demo-session", {
    method: "POST",
    body: JSON.stringify({ resident: "resident-b" }),
  });
  const accepted = await api<ListingDetail>(
    `/api/listings/${listing.id}/accept`,
    { method: "POST", body: "{}" },
  );
  const assignmentId = accepted.assignmentId!;

  const sent = await api<TaskMessage>(`/api/tasks/${assignmentId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message: "I am on my way!" }),
  });
  assert.equal(sent.message, "I am on my way!");
  assert.equal(sent.isSelf, true);
  assert.equal(sent.senderLabel, "Helper");

  const chat = await api<TaskChatResponse>(
    `/api/tasks/${assignmentId}/messages`,
  );
  assert.equal(chat.isLocked, false);
  assert.equal(chat.messages.at(-1)?.message, "I am on my way!");

  const confirmation = await api<ConfirmationResult>(
    `/api/tasks/${assignmentId}/confirmation`,
    { method: "POST", body: "{}" },
  );
  const beforeRewards = await api<RewardsResponse>("/api/rewards");
  const completed = await api<CompletionResult>("/api/tasks/confirm", {
    method: "POST",
    body: JSON.stringify({ qrToken: confirmation.qrToken }),
  });
  assert.equal(completed.status, "completed");
  assert.equal(completed.pointsAwarded, 20);

  const afterRewards = await api<RewardsResponse>("/api/rewards");
  assert.equal(afterRewards.balance, beforeRewards.balance + 20);

  const lockedChat = await api<TaskChatResponse>(
    `/api/tasks/${assignmentId}/messages`,
  );
  assert.equal(lockedChat.isLocked, true);
});

test("preview validation and unsupported actions give useful errors", async () => {
  const api = createBrowserPreview();
  await assert.rejects(api("/api/demo-session", { method: "POST", body: JSON.stringify({ resident: "admin" }) }), /Choose a demo resident/);
  await assert.rejects(api("/api/listings", { method: "POST", body: "{}" }), /Choose a listing type/);
  await assert.rejects(api("/api/listings", { method: "POST", body: "{" }), /could not be read/);
  await assert.rejects(api("/api/listings/missing", { method: "DELETE" }), /unavailable/);
});

test("preview operator summary reflects open, accepted, and completed listing counts", async () => {
  const api = createBrowserPreview();
  const initial = await api<OperatorDashboardSummary>("/api/operator/summary");
  assert.equal(initial.openListings, templates.length);
  assert.equal(initial.acceptedListings, 0);
  assert.equal(initial.completedListings, 0);
  assert.equal(initial.demo, true);
});

