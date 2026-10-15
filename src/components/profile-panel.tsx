"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { api } from "@/lib/client-api";
import type { FeedResponse, Listing, RewardsResponse } from "@/lib/types";

function profileName(label: string) {
  const trimmed = label.replace(/\s*·\s*demo$/i, "").trim();
  if (!trimmed || trimmed.includes("@")) return "Resident";
  const parts = trimmed.split(/\s+/);
  // "Alex Tan" is a full name. Labels such as "Resident 104" stay whole.
  if (parts.length >= 2 && parts.every((part) => /^[A-Z][a-z'-]+$/.test(part))) {
    return parts[0];
  }
  return trimmed;
}

function safeArea(area: string) {
  const trimmed = area.trim();
  if (!trimmed) return "";
  if (/\b(?:unit|apartment|flat)\b|#\s*\d/i.test(trimmed)) return "";
  return trimmed;
}

export function ProfilePanel({
  resident,
  listings,
  onSignOut,
}: {
  resident?: FeedResponse["resident"];
  listings?: Listing[];
  onSignOut: () => Promise<void>;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void api<RewardsResponse>("/api/rewards")
      .then((data) => {
        if (active && Number.isFinite(data.balance)) setPoints(data.balance);
      })
      .catch(() => {
        if (active) setPoints(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const name = profileName(resident?.label || "Resident");
  const area = safeArea(resident?.area || "");
  const posts = listings ? listings.filter((item) => item.isOwner).length : null;
  const helped = listings
    ? listings.filter(
        (item) => item.isParticipant && !item.isOwner && item.status === "completed",
      ).length
    : null;
  const stats = [
    points !== null ? { value: String(points), label: "points" } : null,
    helped !== null ? { value: String(helped), label: "neighbours helped" } : null,
    posts !== null ? { value: String(posts), label: "posts" } : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return (
    <div className="sdp-screen-view profile-view" role="region" aria-label="Profile">
      <div className="profile-band-bg" aria-hidden="true" />
      <div className="sdp-screen-body profile-body">
        <h1 className="profile-title">Profile</h1>
        {error && <div className="sdp-error-banner">{error}</div>}

        <div className="sdp-card sdp-profile-card">
          <div className="profile-header-row">
            <span className="profile-avatar" aria-hidden="true">
              <svg width="61" height="61" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="9" r="4.5" />
                <path d="M3 24a9 9 0 0 1 18 0z" />
              </svg>
            </span>
            <div className="profile-info-col">
              <div className="profile-name-row">
                <h2 className="profile-name">{name}</h2>
                <span className="profile-edit" aria-disabled="true">
                  Edit
                </span>
              </div>
              {area && <div className="profile-area">{area}</div>}
              {resident && (
                <span className="profile-verified-badge">
                  <Check size={12} strokeWidth={2.5} /> Verified resident
                </span>
              )}
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="profile-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="profile-stat-value">{stat.value}</div>
                <div className="profile-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="profile-settings">
          <div className="profile-row">
            <div className="profile-row-title">Notifications</div>
            <ChevronRight size={18} aria-hidden="true" />
          </div>
          <div className="profile-row">
            <div>
              <div className="profile-row-title">Privacy</div>
              <div className="profile-row-sub">What neighbours can see</div>
            </div>
            <ChevronRight size={18} aria-hidden="true" />
          </div>
          <div className="profile-row">
            <div>
              <div className="profile-row-title">Easy mode</div>
              <div className="profile-row-sub">Larger text and simpler screens</div>
            </div>
            <span className="profile-switch is-on" aria-hidden="true">
              <span />
            </span>
          </div>
          <div className="profile-row">
            <div className="profile-row-title">Help and support</div>
            <ChevronRight size={18} aria-hidden="true" />
          </div>
          <button
            className="profile-row profile-logout"
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await onSignOut();
              } catch {
                setError("Could not sign out. Please try again.");
                setSigningOut(false);
              }
            }}
          >
            {signingOut ? "Signing out..." : "Log out"}
          </button>
        </div>

        <p className="profile-privacy-note">
          Your unit number is only shared with the neighbour who accepts your
          request.
        </p>
      </div>
    </div>
  );
}
