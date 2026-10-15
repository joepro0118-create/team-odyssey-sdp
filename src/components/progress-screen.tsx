"use client";

import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, errorMessage } from "@/lib/client-api";
import type {
  CompletionResult,
  ConfirmationResult,
  ListingDetail,
} from "@/lib/types";
import { QrScanner } from "./qr-scanner";
import { TaskChat } from "./task-chat";

export function ProgressScreen({
  listing,
  initialMode,
  onBack,
  onCompleted,
}: {
  listing: ListingDetail;
  initialMode?: "show" | "scan";
  onBack: () => void;
  onCompleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"show" | "scan">(
    initialMode || "show",
  );
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [qrToken, setQrToken] = useState("");
  const [completed, setCompleted] = useState(listing.status === "completed");
  const [chatOpen, setChatOpen] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(
    listing.pointsReward || 20,
  );

  const isHelper = listing.viewerRole === "helper";
  const partnerName =
    listing.contact?.name ||
    (listing.isOwner ? "Ben (fictional resident B)" : "Neighbour");

  async function createQr() {
    const taskId = listing.assignmentId || listing.id;
    setBusy(true);
    setError("");
    try {
      const res = await api<ConfirmationResult>(
        `/api/tasks/${taskId}/confirmation`,
        { method: "POST", body: "{}" },
      );
      setConfirmation(res);
    } catch {
      // Fallback demo token so QR code always renders immediately
      setConfirmation({
        qrToken: `tolong-qr-${taskId}-${Date.now().toString(36)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    } finally {
      setBusy(false);
    }
  }

  // Automatically generate QR code on mount
  useState(() => {
    void createQr();
  });

  async function completeTask(tokenToUse?: string) {
    const token = (tokenToUse || qrToken).trim();
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<CompletionResult>("/api/tasks/confirm", {
        method: "POST",
        body: JSON.stringify({ qrToken: token }),
      });
      setPointsAwarded(result.pointsAwarded || listing.pointsReward || 20);
      setCompleted(true);
      onCompleted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const handleScan = useCallback((scannedText: string) => {
    setQrToken(scannedText);
    void completeTask(scannedText);
  }, []);

  // Handover Confirmed screen (Screen 06 in design)
  if (completed) {
    return (
      <div className="sdp-confirmed-screen">
        <div className="sdp-confirmed-content">
          <svg
            width="220"
            height="200"
            viewBox="0 0 220 200"
            aria-hidden="true"
            className="confirmed-illustration"
          >
            <circle cx="110" cy="100" r="58" fill="#FFC72C" />
            <circle cx="110" cy="100" r="44" fill="#FFB800" />
            <path
              d="M88 102l16 16 30-36"
              fill="none"
              stroke="#1B1416"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="38" cy="52" r="6" fill="#C8102E" />
            <circle cx="182" cy="42" r="5" fill="#E8602A" />
            <circle cx="198" cy="124" r="7" fill="#C8102E" />
            <circle cx="22" cy="128" r="5" fill="#FFC72C" />
            <circle cx="152" cy="176" r="5" fill="#C8102E" />
            <circle cx="64" cy="180" r="6" fill="#E8602A" />
            <rect
              x="168"
              y="82"
              width="16"
              height="6"
              rx="3"
              fill="#FFC72C"
              transform="rotate(-30 176 85)"
            />
            <rect
              x="30"
              y="86"
              width="16"
              height="6"
              rx="3"
              fill="#C8102E"
              transform="rotate(35 38 89)"
            />
            <rect
              x="150"
              y="16"
              width="14"
              height="6"
              rx="3"
              fill="#E8602A"
              transform="rotate(50 157 19)"
            />
            <rect
              x="78"
              y="14"
              width="14"
              height="6"
              rx="3"
              fill="#FFC72C"
              transform="rotate(-40 85 17)"
            />
            <path
              d="M110 30v-14M52 62l-8-8M168 62l8-8"
              stroke="#E8602A"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          <h1 className="confirmed-title">
            {isHelper
              ? `You've earned ${pointsAwarded} points!`
              : "Handover confirmed!"}
          </h1>

          <p className="confirmed-subtitle">
            {isHelper
              ? "Handover confirmed. Thanks for helping a neighbour. Your points have been added to your balance."
              : "Handover confirmed. Points were awarded to your helper."}
          </p>

          <button
            className="sdp-btn-gradient full-width"
            onClick={onBack}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Active Progress screen (Screen 05 in design)
  return (
    <div className="sdp-screen-view">
      {/* Top gradient band */}
      <div className="sdp-screen-band progress-band">
        <div className="sdp-band-header">
          <button
            onClick={onBack}
            className="sdp-back-btn"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="sdp-band-titles">
            <span className="sdp-band-subtitle">{listing.title}</span>
            <h1 className="sdp-band-title">
              {partnerName} is on it
            </h1>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="sdp-progress-steps">
          <span className="step-badge active">1</span>
          <span className="step-label">Posted</span>
          <span className="step-connector active" />
          <span className="step-badge active">2</span>
          <span className="step-label">Accepted</span>
          <span className="step-connector pending" />
          <span className="step-badge pending">3</span>
          <span className="step-label pending">Handover</span>
        </div>
      </div>

      <div className="sdp-screen-body">
        {/* Error notification */}
        {error && <div className="sdp-error-banner">{error}</div>}

        {/* QR Mode Switcher: Show QR or Scan QR */}
        <div className="sdp-qr-toggle-bar">
          <button
            className={`sdp-qr-toggle-btn ${mode === "show" ? "active" : ""}`}
            onClick={() => setMode("show")}
          >
            <QrCode size={16} />
            Show QR Code
          </button>
          <button
            className={`sdp-qr-toggle-btn ${mode === "scan" ? "active" : ""}`}
            onClick={() => setMode("scan")}
          >
            <CheckCircle2 size={16} />
            Scan QR Code
          </button>
        </div>

        {/* Big QR verification card */}
        <div className="sdp-qr-main-card">
          {mode === "show" ? (
            /* Show QR Code view */
            <div className="qr-helper-box">
              <div className="generated-qr">
                <QRCodeSVG
                  value={
                    confirmation?.qrToken ||
                    `tolong-qr-${listing.id}-${Date.now()}`
                  }
                  size={190}
                  level="M"
                  aria-label="Handover verification QR code"
                />
                <div className="qr-expiry-tag">
                  <Clock size={14} />
                  <span>
                    Expires{" "}
                    {confirmation
                      ? new Date(confirmation.expiresAt).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )
                      : "in 15 mins"}
                  </span>
                </div>
              </div>

              <p className="qr-instruction">
                Scan this together at handover to confirm it happened.
              </p>

              <button
                className="sdp-btn-secondary full-width text-xs font-semibold"
                disabled={busy}
                onClick={() => void createQr()}
              >
                {busy ? "Refreshing..." : "Refresh QR Code"}
              </button>
            </div>
          ) : (
            /* Scan QR Code view */
            <div className="qr-requester-box">
              <QrScanner onScan={handleScan} />

              <div className="qr-token-input-row">
                <input
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="Or paste QR token here"
                  className="sdp-text-input"
                />
                <button
                  className="sdp-btn-gradient"
                  disabled={busy || qrToken.trim().length < 8}
                  onClick={() => void completeTask()}
                >
                  {busy ? "Confirming..." : "Confirm"}
                </button>
              </div>

              {/* One-tap Instant Demo Handover confirmation */}
              <button
                className="sdp-btn-yellow full-width mt-2"
                disabled={busy}
                onClick={() =>
                  void completeTask(confirmation?.qrToken || "demo-confirmed")
                }
              >
                <CheckCircle2 size={16} />
                {busy ? "Confirming..." : "Confirm Handover (One-tap Demo)"}
              </button>

              <p className="qr-instruction">
                Scan your neighbour’s QR code or tap above to confirm handover.
              </p>
            </div>
          )}
        </div>

        {/* Partner contact card */}
        <div className="sdp-partner-card">
          <div className="sdp-avatar-circle">
            {partnerName.slice(0, 1).toUpperCase()}
          </div>
          <div className="sdp-partner-info">
            <div className="sdp-partner-name">{partnerName}</div>
            <div className="sdp-partner-sub">
              {listing.area} ·{" "}
              <span className="sdp-verified-text">
                <Check size={13} strokeWidth={2.5} /> Verified resident
              </span>
            </div>
          </div>
          <button
            className="sdp-btn-dark-pill"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare size={16} />
            Message
          </button>
        </div>

        {/* Unit privacy card */}
        <div className="sdp-privacy-card">
          <span className="privacy-icon">
            <Lock size={18} />
          </span>
          <p>
            Your unit number is now shared with {partnerName} only, for this
            request.
          </p>
        </div>
      </div>

      {/* Task Coordination Chat Modal / Drawer */}
      {chatOpen && listing.assignmentId && (
        <TaskChat
          assignmentId={listing.assignmentId}
          partnerName={partnerName}
          listingTitle={listing.title}
          isCompleted={completed}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
