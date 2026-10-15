"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { FeedResponse } from "@/lib/types";

export function ProfilePanel({
  resident,
  onSignOut,
}: {
  resident?: FeedResponse["resident"];
  onSignOut: () => Promise<void>;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const name = resident?.label || "Resident";
  const area = resident?.area || "Demo Township · Precinct 3";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="sdp-screen-view" role="region" aria-label="Profile">
      {/* Top red-orange gradient band */}
      <div className="sdp-screen-band profile-band">
        <div className="sdp-band-header">
          <h1 className="sdp-band-title">Profile</h1>
        </div>
      </div>

      <div className="sdp-screen-body">
        {error && <div className="sdp-error-banner">{error}</div>}

        {/* Resident identity card */}
        <div className="sdp-card sdp-profile-card">
          <div className="profile-header-row">
            <div className="sdp-avatar-circle large">{initial}</div>
            <div className="profile-info-col">
              <h2 className="profile-name">{name}</h2>
              <div className="profile-area">
                <MapPin size={14} />
                <span>{area}</span>
              </div>
              <span className="profile-verified-badge">
                <Check size={13} strokeWidth={2.5} /> Verified Resident
              </span>
            </div>
          </div>
        </div>

        {/* Township safety & privacy */}
        <div className="sdp-card">
          <div className="flex items-center gap-2 mb-2 font-bold text-sm text-red-700">
            <ShieldCheck size={18} />
            <span>Privacy & Safety by Design</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Your identity and unit number are never shown publicly on the feed.
            Details are strictly exchanged between the two residents of an
            accepted task, and handovers are confirmed via one-time QR codes.
          </p>
        </div>

        {/* Community guidelines & Operator View link */}
        <div className="sdp-card p-0 overflow-hidden">
          <a
            href="/login"
            className="sdp-row-item hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-red-700" />
              <div>
                <div className="font-bold text-sm">Switch Demo Resident</div>
                <div className="text-xs text-stone-500">
                  Test two-phone flow with a different account
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400" />
          </a>
        </div>

        {/* Sign out button */}
        <div className="mt-4">
          <button
            className="sdp-btn-secondary full-width flex items-center justify-center gap-2"
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
            <LogOut size={16} />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        {/* Hackathon prototype label */}
        <div className="sdp-rewards-fineprint">
          Tolong Prototype · Sime Darby Property University Hackathon 2026.
          All residents and tasks are simulated demo data.
        </div>
      </div>
    </div>
  );
}
