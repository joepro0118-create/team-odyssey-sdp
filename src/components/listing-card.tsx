"use client";

import type { Listing, ListingType } from "@/lib/types";

function typeBadgeStyle(type: ListingType, category: string) {
  // Normalize display category name (e.g. "Food & groceries" -> "Groceries", "Skills & tech" -> "Tech help", "Borrow & lend" -> "Tools")
  let cat = category;
  if (category === "Food & groceries") cat = "Groceries";
  else if (category === "Skills & tech") cat = "Tech help";
  else if (category === "Borrow & lend") cat = "Tools";

  switch (type) {
    case "request":
      return { bg: "#FDE3E6", text: "#C8102E", label: `Request · ${cat}` };
    case "offer":
      return { bg: "#FFF1C2", text: "#1B1416", label: `Offer · ${cat}` };
    case "lend":
      return { bg: "#E3DEDC", text: "#1B1416", label: `Lend · ${cat}` };
  }
}

function formatPoints(type: ListingType, reward?: number) {
  if (type === "offer") return "Free";
  const pts = reward || 20;
  return `+${pts} pts`;
}

export function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: () => void;
}) {
  const badge = typeBadgeStyle(listing.type, listing.category);
  const pointsText = formatPoints(listing.type, listing.pointsReward);

  return (
    <article
      className="sdp-home-card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Top chips row */}
      <div className="sdp-card-top-chips">
        <span
          className="sdp-card-pill-tag"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
        <span className="sdp-card-points-badge">{pointsText}</span>
      </div>

      {/* Title */}
      <h3 className="sdp-card-title-text">
        <button
          className="sdp-card-title-interactive"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          {listing.title}
        </button>
      </h3>

      {/* Subtitle: Area & Timing */}
      <div className="sdp-card-subtitle-text">
        {listing.area} · {listing.timing}
      </div>
    </article>
  );
}
