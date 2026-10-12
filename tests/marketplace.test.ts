import test from "node:test";
import assert from "node:assert/strict";
import {
  DemoMarketplace,
  MarketplaceError,
  validateListing,
} from "../src/lib/marketplace-service";
import { templates } from "../src/lib/types";

const input = templates[0];
const hasStatus = (status: number) => (error: unknown) =>
  error instanceof MarketplaceError && error.status === status;

test("all three listing types can be created with server-owned identity and status", () => {
  const store = new DemoMarketplace(false);
  for (const type of ["request", "offer", "lend"] as const) {
    const result = store.create(
      { ...input, type, ownerId: "resident-c", status: "accepted" },
      "resident-a",
    );
    assert.equal(result.status, "open");
    assert.equal(result.isOwner, true);
    assert.equal(result.type, type);
    assert.equal(
      store.list("resident-c").find((item) => item.id === result.id)?.isOwner,
      false,
    );
  }
});

test("public feed and nonparticipant detail never expose private identity", () => {
  const store = new DemoMarketplace(false);
  const listing = store.create(input, "resident-a");
  assert.equal(store.detail(listing.id, "resident-b").contact, undefined);
  const accepted = store.accept(listing.id, "resident-b");
  assert.match(accepted.contact!.name, /Aina/);
  assert.match(store.detail(listing.id, "resident-a").contact!.name, /Ben/);
  assert.equal(store.detail(listing.id, "resident-c").contact, undefined);
  const publicData = JSON.stringify(store.list("resident-c"));
  assert.doesNotMatch(
    publicData,
    /ownerId|acceptedBy|contact|Aina|Ben|meetingNote/,
  );
});

test("own-listing and duplicate acceptance fail without changing participants", () => {
  const store = new DemoMarketplace(false);
  const listing = store.create(input, "resident-a");
  assert.throws(() => store.accept(listing.id, "resident-a"), hasStatus(403));
  store.accept(listing.id, "resident-b");
  assert.throws(() => store.accept(listing.id, "resident-c"), hasStatus(409));
  assert.equal(store.detail(listing.id, "resident-c").isParticipant, false);
  assert.match(store.detail(listing.id, "resident-a").contact!.name, /Ben/);
});

test("malformed data and unknown categories are rejected", () => {
  for (const invalid of [
    null,
    [],
    "text",
    {},
    { ...input, category: "unknown" },
    { ...input, type: "sell" },
    { ...input, area: "Real street" },
    { ...input, title: "     " },
    { ...input, description: "short" },
    { ...input, title: "a".repeat(81) },
  ]) {
    assert.throws(() => validateListing(invalid), hasStatus(400));
  }
});

test("demo guardrails reject prescription requests, obvious contact details, and sales", () => {
  for (const description of [
    "Please collect prescription medicine for me.",
    "Saya perlukan antibiotik dari kedai berhampiran.",
    "Please collect insulin from the pharmacy today.",
    "Contact me at test@example.com to arrange the collection.",
    "Please call 012-345-6789 to arrange a handover.",
    "Collect the items from unit 123 after lunch please.",
    "This item is for sale at RM 50 today.",
  ]) {
    assert.throws(
      () => validateListing({ ...input, description }),
      hasStatus(400),
    );
  }
  assert.doesNotThrow(() =>
    validateListing({
      ...input,
      description:
        "Please help collect over-the-counter plasters with my groceries.",
    }),
  );
});

test("missing listings return 404 and results cannot mutate stored data", () => {
  const store = new DemoMarketplace(false);
  assert.throws(() => store.detail("missing", "resident-a"), hasStatus(404));
  assert.throws(() => store.accept("missing", "resident-a"), hasStatus(404));
  const listing = store.create(input, "resident-a");
  listing.title = "Tampered title";
  assert.equal(store.detail(listing.id, "resident-a").title, input.title);
});
