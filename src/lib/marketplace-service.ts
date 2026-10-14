import {
  areas,
  categories,
  listingTypes,
  templates,
  type Listing,
  type ListingDetail,
  type ListingInput,
  type ResidentId,
} from "./types";

export class MarketplaceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type StoredListing = ListingInput & {
  id: string;
  createdAt: string;
  status: "open" | "accepted";
  ownerId: ResidentId;
  acceptedBy: ResidentId | null;
};

const demoContacts: Record<ResidentId, { name: string; meetingNote: string }> =
  {
    "resident-a": {
      name: "Aina (fictional resident A)",
      meetingNote:
        "Meet by the community hub noticeboard. Demo meeting note only.",
    },
    "resident-b": {
      name: "Ben (fictional resident B)",
      meetingNote:
        "Meet at the community hub reception. Demo meeting note only.",
    },
    "resident-c": {
      name: "Chandra (fictional resident C)",
      meetingNote:
        "Meet by the community garden entrance. Demo meeting note only.",
    },
  };

function boundedText(value: unknown, field: string, min: number, max: number) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  ) {
    throw new MarketplaceError(`${field} must be ${min}–${max} characters.`);
  }
  return value.trim();
}

export function validateListing(value: unknown): ListingInput {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new MarketplaceError("Please provide a listing.");
  const input = value as Record<string, unknown>;
  if (!listingTypes.includes(input.type as never))
    throw new MarketplaceError("Choose a listing type.");
  if (!categories.includes(input.category as never))
    throw new MarketplaceError("Choose a category.");
  if (!areas.includes(input.area as never))
    throw new MarketplaceError("Choose a demo area.");
  const title = boundedText(input.title, "Title", 6, 80);
  const description = boundedText(input.description, "Description", 20, 600);
  const timing = boundedText(input.timing, "When", 3, 80);
  const publicText = `${title} ${description} ${timing}`;
  if (
    /\b(prescription|prescribed|preskripsi|ubat terkawal|antibiotic\w*|antibiotik\w*|insulin|amoxicillin|amoxicilin|amoksisilin|warfarin|tramadol|diazepam)\b/i.test(
      publicText,
    )
  ) {
    throw new MarketplaceError(
      "Prescription medicine requests are not supported. Choose a different request.",
    );
  }
  if (
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]*){8,}|\b(?:unit|apartment|flat)\s*(?:no\.?\s*)?#?\s*\d/i.test(
      publicText,
    )
  ) {
    throw new MarketplaceError(
      "Keep phone numbers, emails, and unit numbers out of public listings.",
    );
  }
  if (
    /\b(?:rm\s*\d|myr\s*\d|for sale|price|paid service|cash payment)\b|\$\s*\d/i.test(
      publicText,
    )
  ) {
    throw new MarketplaceError(
      "Tolong is for neighbourly help and lending. Payments and sales are not supported.",
    );
  }
  return {
    type: input.type as ListingInput["type"],
    category: input.category as ListingInput["category"],
    area: input.area as ListingInput["area"],
    title,
    description,
    timing,
  };
}

/** Demo-only service. Real shared activity needs Member 4's server adapter. */
export class DemoMarketplace {
  private listings: StoredListing[];

  constructor(seed = true) {
    this.listings = seed
      ? templates.map((template, index) => {
          const { label: _label, ...listing } = template;
          return {
            ...listing,
            id: `demo-${index + 1}`,
            createdAt: new Date(
              Date.now() - (index + 1) * 1_800_000,
            ).toISOString(),
            status: "open",
            ownerId: index % 2 === 0 ? "resident-b" : "resident-c",
            acceptedBy: null,
          };
        })
      : [];
  }

  private find(id: string) {
    const listing = this.listings.find((item) => item.id === id);
    if (!listing)
      throw new MarketplaceError("This listing could not be found.", 404);
    return listing;
  }

  private publicView(item: StoredListing, resident: ResidentId): Listing {
    // Explicit allowlist prevents owner identities leaking through the public API.
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      category: item.category,
      area: item.area,
      timing: item.timing,
      createdAt: item.createdAt,
      status: item.status,
      pointsReward: 50,
      isOwner: item.ownerId === resident,
      isParticipant: item.ownerId === resident || item.acceptedBy === resident,
    };
  }

  list(resident: ResidentId): Listing[] {
    return this.listings.map((item) => this.publicView(item, resident));
  }

  detail(id: string, resident: ResidentId): ListingDetail {
    const item = this.find(id);
    const view: ListingDetail = {
      ...this.publicView(item, resident),
      viewerRole:
        item.ownerId === resident
          ? "requester"
          : item.acceptedBy === resident
            ? "helper"
            : "viewer",
    };
    if (item.status === "accepted" && view.isParticipant) {
      const other = item.ownerId === resident ? item.acceptedBy! : item.ownerId;
      view.contact = { ...demoContacts[other] };
    }
    return view;
  }

  create(input: unknown, resident: ResidentId): Listing {
    const listing = validateListing(input);
    const item: StoredListing = {
      ...listing,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "open",
      ownerId: resident,
      acceptedBy: null,
    };
    this.listings.unshift(item);
    return this.publicView(item, resident);
  }

  accept(id: string, resident: ResidentId): ListingDetail {
    const item = this.find(id);
    if (item.ownerId === resident)
      throw new MarketplaceError("You cannot accept your own listing.", 403);
    if (item.status !== "open")
      throw new MarketplaceError(
        "A neighbour has already accepted this listing.",
        409,
      );
    // No await between checking and updating: atomic within this single demo process.
    item.status = "accepted";
    item.acceptedBy = resident;
    return this.detail(id, resident);
  }
}
