"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Keyboard,
  Lock,
  MessageSquare,
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
  onBack,
  onCompleted,
}: {
  listing: ListingDetail;
  onBack: () => void;
  onCompleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [qrToken, setQrToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(listing.status === "completed");
  const [chatOpen, setChatOpen] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(
    listing.pointsReward || 20,
  );
  const [manualCodeOpen, setManualCodeOpen] = useState(false);

  const isHelper = listing.viewerRole === "helper";
  const isRequester = listing.viewerRole === "requester";
  const partnerName =
    listing.contact?.name ||
    (listing.isOwner ? "Matched neighbour" : "Neighbour");

  const createQr = useCallback(async () => {
    if (!listing.assignmentId) {
      setError("The handover code is available after a neighbour accepts.");
      return;
    }
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const res = await api<ConfirmationResult>(
        `/api/tasks/${listing.assignmentId}/confirmation`,
        { method: "POST", body: "{}" },
      );
      setConfirmation(res);
    } catch (err) {
      setConfirmation(null);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [listing.assignmentId]);

  // Requester automatically generates the handover QR code
  useEffect(() => {
    if (!isRequester || listing.status === "completed") return;
    void createQr();
  }, [createQr, isRequester, listing.status]);

  const completeTask = useCallback(
    async (tokenToUse?: string) => {
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
    },
    [busy, listing.pointsReward, onCompleted, qrToken],
  );

  const handleScan = useCallback(
    (scannedText: string) => {
      setQrToken(scannedText);
      void completeTask(scannedText);
    },
    [completeTask],
  );

  async function handleCopyToken() {
    if (!confirmation?.qrToken) return;
    try {
      await navigator.clipboard.writeText(confirmation.qrToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }

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
              {isRequester
                ? `${partnerName} is on it`
                : `Helping ${partnerName}`}
            </h1>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="sdp-progress-steps">
          <span className="step-badge active">1</span>
          <span className="step-label">Posted</span>
          <span className="step-connector active flowing" />
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

        <div className="sdp-qr-main-card">
          {isRequester ? (
            <div className="qr-helper-box">
              {confirmation?.qrToken ? (
                <div className="generated-qr">
                  <QRCodeSVG
                    value={confirmation.qrToken}
                    size={190}
                    level="M"
                    aria-label="Handover verification QR code"
                  />
                  <div className="qr-expiry-tag">
                    <Clock size={14} />
                    <span>
                      Expires{" "}
                      {new Date(confirmation.expiresAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="qr-instruction">
                  {busy
                    ? "Creating the handover code…"
                    : "The handover code will appear here."}
                </p>
              )}

              <p className="qr-instruction">
                Show this QR code to the neighbour helping you. They scan it to
                confirm the handover and earn their points.
              </p>

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  className="sdp-btn-secondary flex-1 text-xs font-semibold"
                  disabled={busy}
                  onClick={() => void createQr()}
                >
                  {busy ? "Refreshing..." : "Refresh QR Code"}
                </button>
                {confirmation?.qrToken && (
                  <button
                    type="button"
                    className="sdp-btn-secondary flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
                    onClick={() => void handleCopyToken()}
                  >
                    <Copy size={13} />
                    {copied ? "Copied!" : "Copy token"}
                  </button>
                )}
              </div>
            </div>
          ) : isHelper ? (
            <div className="qr-requester-box">
              <QrScanner onScan={handleScan} />

              {/* Phone-friendly expandable manual code toggle */}
              <div className="sdp-manual-code-section">
                <button
                  type="button"
                  className="sdp-manual-code-toggle"
                  onClick={() => setManualCodeOpen((v) => !v)}
                >
                  <Keyboard size={14} />
                  <span>
                    {manualCodeOpen
                      ? "Hide manual code entry"
                      : "Can't scan? Enter code manually"}
                  </span>
                </button>

                {manualCodeOpen && (
                  <div className="qr-token-input-row">
                    <input
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                      placeholder="Paste requester's QR token"
                      className="sdp-text-input"
                    />
                    <button
                      className="sdp-btn-gradient"
                      disabled={busy || qrToken.trim().length < 16}
                      onClick={() => void completeTask()}
                    >
                      {busy ? "Confirming..." : "Confirm"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="qr-instruction">
              The requester shows the QR code, and the helper scans it.
            </p>
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
