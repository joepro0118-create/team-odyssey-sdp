import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserPreview } from "../src/lib/browser-preview";
import { templates, type Listing, type ListingDetail, type FeedResponse, type RewardsResponse, type Redemption } from "../src/lib/types";

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

test("preview validation and unsupported actions give useful errors", async () => {
  const api = createBrowserPreview();
  await assert.rejects(api("/api/demo-session", { method: "POST", body: JSON.stringify({ resident: "admin" }) }), /Choose a demo resident/);
  await assert.rejects(api("/api/listings", { method: "POST", body: "{}" }), /Choose a listing type/);
  await assert.rejects(api("/api/listings", { method: "POST", body: "{" }), /could not be read/);
  await assert.rejects(api("/api/listings/missing", { method: "DELETE" }), /unavailable/);
});
