import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FeedResponse,
  Listing,
  ListingDetail,
  ListingStatus,
  ListingType,
} from "../types";
import { MarketplaceError } from "../marketplace-service";

type ListingRow = {
  id: string;
  creator_id: string;
  listing_type: string;
  category: string;
  title: string;
  description: string;
  area_label: string;
  timing: string;
  points_reward: number;
  status: string;
  created_at: string;
};

type AssignmentRow = {
  id: string;
  listing_id: string;
  helper_id: string;
};

function isDeletedTestListing(row: Pick<ListingRow, "title" | "description">) {
  return /\blol{3,}/i.test(`${row.title} ${row.description}`);
}

function toListing(
  row: ListingRow,
  userId: string,
  assignment?: AssignmentRow,
): Listing {
  const isOwner = row.creator_id === userId;
  const isHelper = assignment?.helper_id === userId;
  return {
    id: row.id,
    type: row.listing_type as ListingType,
    category: row.category,
    title: row.title,
    description: row.description,
    area: row.area_label,
    timing: row.timing,
    pointsReward: row.points_reward,
    status: row.status as ListingStatus,
    createdAt: row.created_at,
    isOwner,
    isParticipant: isOwner || isHelper,
  };
}

export async function readFeed(
  supabase: SupabaseClient,
  userId: string,
): Promise<FeedResponse> {
  const [{ data: listingRows, error: listingError }, profileResult] =
    await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, creator_id, listing_type, category, title, description, area_label, timing, points_reward, status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("anonymous_label, area_label")
        .eq("id", userId)
        .single(),
    ]);
  if (listingError) throw new MarketplaceError(listingError.message, 500);
  if (profileResult.error)
    throw new MarketplaceError("Your resident profile could not be loaded.", 500);

  const allRows = (listingRows ?? []) as ListingRow[];
  for (const row of allRows) {
    if (
      isDeletedTestListing(row) &&
      row.creator_id === userId &&
      row.status === "open"
    ) {
      void supabase.rpc("cancel_listing", { p_listing_id: row.id });
    }
  }
  const visibleRows = allRows.filter((row) => !isDeletedTestListing(row));

  const { data: assignments, error: assignmentError } = await supabase
    .from("task_assignments")
    .select("id, listing_id, helper_id");
  if (assignmentError) throw new MarketplaceError(assignmentError.message, 500);
  const byListing = new Map(
    ((assignments ?? []) as AssignmentRow[]).map((item) => [item.listing_id, item]),
  );

  return {
    listings: visibleRows.map((row) =>
      toListing(row, userId, byListing.get(row.id)),
    ),
    resident: {
      id: userId,
      label: profileResult.data.anonymous_label,
      area: profileResult.data.area_label,
    },
    demo: true,
  };
}

export async function readListingDetail(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<ListingDetail> {
  const { data: row, error } = await supabase
    .from("listings")
    .select(
      "id, creator_id, listing_type, category, title, description, area_label, timing, points_reward, status, created_at",
    )
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw new MarketplaceError(error.message, 500);
  if (!row || isDeletedTestListing(row as ListingRow))
    throw new MarketplaceError("This listing could not be found.", 404);

  const assignmentResult = await supabase
    .from("task_assignments")
    .select("id, listing_id, helper_id")
    .eq("listing_id", listingId)
    .maybeSingle();
  if (assignmentResult.error)
    throw new MarketplaceError(assignmentResult.error.message, 500);
  const assignment = assignmentResult.data as AssignmentRow | null;
  const listing = toListing(row as ListingRow, userId, assignment ?? undefined);
  const viewerRole =
    (row as ListingRow).creator_id === userId
      ? "requester"
      : assignment?.helper_id === userId
        ? "helper"
        : "viewer";

  return {
    ...listing,
    assignmentId: assignment?.id,
    viewerRole,
    contact:
      assignment && viewerRole !== "viewer"
        ? {
            name: "Matched neighbour",
            meetingNote:
              "Use the in-app QR confirmation at handover. Do not share personal contact details in the public listing.",
          }
        : undefined,
  };
}
