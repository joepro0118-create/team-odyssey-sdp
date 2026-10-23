"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, X } from "lucide-react";
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
  onSelectListing,
  onSignOut,
}: {
  resident?: FeedResponse["resident"];
  listings?: Listing[];
  onSelectListing?: (id: string) => void;
  onSignOut: () => Promise<void>;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  // "coming soon" toast for stub rows
  const [toast, setToast] = useState("");

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

  // Auto-dismiss toast after 2.5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const name = profileName(resident?.label || "Resident");
  const area = safeArea(resident?.area || "");
  const posts = listings
    ? listings.filter((item) => item.isOwner && item.status !== "cancelled").length
    : null;
  const helped = listings
    ? listings.filter(
        (item) => item.isParticipant && !item.isOwner && item.status === "completed",
      ).length
    : null;
  const historyListings = (listings ?? []).filter(
    (item) => item.isParticipant && item.status === "completed",
  );
  const stats = [
    points !== null ? { value: String(points), label: "points" } : null,
    helped !== null ? { value: String(helped), label: "neighbours helped" } : null,
    posts !== null ? { value: String(posts), label: "posts" } : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  function showComingSoon(feature: string) {
    setToast(`${feature} — coming soon`);
  }

  if (showHistory) {
    return (
      <div
        className="sdp-feed-view"
        role="region"
        aria-label="History"
      >
        <header className="sdp-screen-band activity-band">
          <div className="sdp-band-header">
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="sdp-back-btn"
              aria-label="Back to profile"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="sdp-band-title">History</h1>
          </div>
        </header>

        <main className="sdp-feed-body">
          <div className="sdp-activity-section">
            <h2 className="sdp-section-heading">Completed listings</h2>
            {historyListings.length === 0 ? (
              <div className="sdp-card text-center py-6 text-stone-500 text-xs">
                No completed listings in your history yet.
              </div>
            ) : (
              historyListings.map((item) => (
                <div
                  key={item.id}
                  className="sdp-card cursor-pointer"
                  onClick={() => onSelectListing?.(item.id)}
                >
                  <div className="sdp-card-top">
                    <span
                      className={`sdp-pill-tag ${
                        item.isOwner
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-stone-900"
                      }`}
                    >
                      {item.isOwner ? "My request" : "Helped with"} ·{" "}
                      {item.category}
                    </span>
                    <span className="sdp-pill-tag bg-green-100 text-green-800 font-bold">
                      Completed
                    </span>
                  </div>
                  <h3 className="sdp-card-title mt-2">{item.title}</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {item.isOwner
                      ? `${item.area} · Handover completed`
                      : `${item.timing} · +${item.pointsReward} pts earned`}
                  </p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sdp-screen-view profile-view" role="region" aria-label="Profile">
      <div className="profile-band-bg" aria-hidden="true" />

      {/* Coming-soon toast */}
      {toast && (
        <div
          className="sdp-notice-banner"
          role="status"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            zIndex: 50,
          }}
        >
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

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
                <button
                  type="button"
                  className="profile-edit"
                  onClick={() => showComingSoon("Edit profile")}
                >
                  Edit
                </button>
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
          <button
            type="button"
            className="profile-row"
            onClick={() => setShowHistory(true)}
          >
            <div className="profile-row-title">History</div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="profile-row"
            onClick={() => showComingSoon("Notifications")}
          >
            <div className="profile-row-title">Notifications</div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="profile-row"
            onClick={() => showComingSoon("Privacy")}
          >
            <div>
              <div className="profile-row-title">Privacy</div>
              <div className="profile-row-sub">What neighbours can see</div>
            </div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="profile-row"
            onClick={() => showComingSoon("Help and support")}
          >
            <div className="profile-row-title">Help and support</div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>

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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            marginTop: "20px",
            paddingBottom: "12px",
          }}
        >
          <SimeHelpLogo variant="primary" width={120} height={30} ariaLabel="SimeHelp" />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#6B6063" }}>
            SimeHelp v1.0 · Sime Darby Property Hackathon
          </span>
        </div>
      </div>
    </div>
  );
}
