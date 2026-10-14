import {
  ArrowUpRight,
  Clock3,
  HandHeart,
  MapPin,
  PackageOpen,
  Sprout,
  Wrench,
  ShoppingBasket,
  Laptop,
  Check,
} from "lucide-react";
import { type Listing, type Category, typeLabels } from "@/lib/types";

export function CategoryIcon({
  category,
  size = 24,
}: {
  category: Category;
  size?: number;
}) {
  const Icon =
    {
      Errands: HandHeart,
      "Food & groceries": ShoppingBasket,
      "Skills & tech": Laptop,
      "Home & garden": Sprout,
      "Borrow & lend": Wrench,
    }[category] || PackageOpen;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

export function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: () => void;
}) {
  const statusLabel = {
    open: "Open to neighbours",
    accepted: "Accepted",
    awaiting_confirmation: "Awaiting QR confirmation",
    completed: "Completed",
    cancelled: "Cancelled",
  }[listing.status];
  return (
    <article
      className={`listing-card ${listing.status !== "open" ? "is-accepted" : ""}`}
    >
      <div className="card-top">
        <div className={`category-icon ${listing.type}`}>
          <CategoryIcon category={listing.category} />
        </div>
        <span className={`type-badge ${listing.type}`}>
          {typeLabels[listing.type]}
        </span>
      </div>
      <span className="eyebrow card-category">{listing.category}</span>
      <h3>
        <button className="card-title-button" onClick={onOpen}>
          {listing.title}
        </button>
      </h3>
      <p className="card-description">{listing.description}</p>
      <div className="card-meta">
        <span>
          <MapPin size={14} />
          {listing.area}
        </span>
        <span>
          <Clock3 size={14} />
          {listing.timing}
        </span>
      </div>
      <div className="card-bottom">
        <span
          className={
            listing.status !== "open" ? "status matched" : "status"
          }
        >
          {listing.status !== "open" ? (
            <>
              <Check size={13} />
              {statusLabel}
            </>
          ) : (
            <>
              <i />
              {statusLabel}
            </>
          )}
        </span>
        <button className="text-button" onClick={onOpen}>
          {listing.isOwner ? "Your listing" : "View details"}
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}
