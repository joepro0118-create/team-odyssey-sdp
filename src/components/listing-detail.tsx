"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Lock,
  MapPin,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type { ListingDetail as Detail, ListingType } from "@/lib/types";
import { ProgressScreen } from "./progress-screen";
import { TaskChat } from "./task-chat";

function typeLabel(type: ListingType) {
  switch (type) {
    case "request":
      return "Request";
    case "offer":
      return "Offer";
    case "lend":
      return "Lend";
  }
}

export function ListingDetail({
  id,
  initialQrMode,
  onClose,
  onAccepted,
  onCompleted,
  onDeleted,
}: {
  id: string;
  initialQrMode?: "show" | "scan" | null;
  onClose: () => void;
  onAccepted: () => void;
  onCompleted?: () => void;
  onDeleted?: () => void;
}) {
  const [listing, setListing] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, setConfirming] = useState(false);
  const [showProgress, setShowProgress] = useState(Boolean(initialQrMode));
  const [chatOpen, setChatOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (initialQrMode) setShowProgress(true);
  }, [initialQrMode]);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    api<Detail>(`/api/listings/${id}`, { signal: controller.signal })
      .then((data) => {
        setListing(data);
        if (data.isOwner) {
          if (data.status === "open") {
            api<Detail>(`/api/listings/${id}/simulate-accept`, {
              method: "POST",
              body: "{}",
            })
              .then((updated) => {
                setListing(updated);
                if (updated.status !== "open") setShowProgress(true);
              })
              .catch(() => {});
          } else if (data.status !== "completed" && data.status !== "cancelled") {
            setShowProgress(true);
          }
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      });
    return () => controller.abort();
  }, [id, reload]);

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const endpoint = listing?.isOwner
        ? `/api/listings/${id}/simulate-accept`
        : `/api/listings/${id}/accept`;
      const updated = await api<Detail>(endpoint, {
        method: "POST",
        body: "{}",
      });
      setListing(updated);
      setConfirming(false);
      onAccepted();
      if (updated.status !== "open") setShowProgress(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteListing() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await api<Detail>(`/api/listings/${id}/cancel`, {
        method: "POST",
        body: "{}",
      });
      if (onDeleted) {
        onDeleted();
      } else {
        onClose();
      }
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
      throw err;
    }
  }

  if (
    listing &&
    showProgress &&
    listing.status !== "open" &&
    listing.status !== "cancelled"
  ) {
    return (
      <ProgressScreen
        listing={listing}
        onBack={() => {
          if (listing.isOwner || listing.status === "completed") {
            onClose();
          } else {
            setShowProgress(false);
            setReload((v) => v + 1);
          }
        }}
        onCompleted={() => {
          setListing((prev) =>
            prev ? { ...prev, status: "completed" } : prev,
          );
          if (onCompleted) {
            onCompleted();
          } else {
            onAccepted();
          }
        }}
        onDelete={listing.isOwner ? deleteListing : undefined}
      />
    );
  }

  const isAccepted =
    listing && listing.status !== "open" && listing.status !== "cancelled";
  const pointsText =
    listing?.type === "offer" ? "Free" : `+${listing?.pointsReward || 20} pts`;
  const posterLabel = listing?.contact?.name || "Resident";
  const partnerInitial = posterLabel.slice(0, 1).toUpperCase();

  return (
    <div className="sdp-screen-view" role="region" aria-label="Listing Details">
      {/* Top band */}
      <div className="sdp-screen-band detail-band">
        <div className="sdp-band-header">
          <button
            onClick={onClose}
            className="sdp-back-btn"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="sdp-band-title">
            {listing ? typeLabel(listing.type) : "Details"}
          </h1>
        </div>
      </div>

      <div className="sdp-screen-body">
        {error && <div className="sdp-error-banner">{error}</div>}

        {!listing && !error && (
          <div className="sdp-loading-center">
            <div className="sdp-spinner" />
            <p>Finding your neighbour’s listing…</p>
          </div>
        )}

        {listing && (
          <>
            {/* Main detail card */}
            <div className="sdp-card detail-main-card">
              <div className="sdp-card-top">
                <span
                  className="sdp-pill-tag"
                  style={{
                    backgroundColor:
                      listing.type === "request"
                        ? "#FDE3E6"
                        : listing.type === "offer"
                        ? "#FFF1C2"
                        : "#E3DEDC",
                    color: listing.type === "request" ? "#C8102E" : "#1B1416",
                  }}
                >
                  {typeLabel(listing.type)} · {listing.category}
                </span>
                <span className="sdp-points-chip">{pointsText}</span>
              </div>

              <h2 className="sdp-detail-title">{listing.title}</h2>

              <p className="sdp-detail-desc">{listing.description}</p>

              {/* Timing & Location rows */}
              <div className="sdp-detail-meta-rows">
                <div className="meta-row">
                  <Clock size={18} className="meta-icon" />
                  <div className="meta-text">
                    <span className="meta-label">WHEN</span>
                    <span className="meta-val">{listing.timing}</span>
                  </div>
                </div>
                <div className="meta-row">
                  <MapPin size={18} className="meta-icon" />
                  <div className="meta-text">
                    <span className="meta-label">WHERE</span>
                    <span className="meta-val">{listing.area}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Poster info card */}
            <div className="sdp-partner-card">
              <div className="sdp-avatar-circle">{partnerInitial}</div>
              <div className="sdp-partner-info">
                <div className="sdp-partner-name">{posterLabel}</div>
                <div className="sdp-partner-sub">
                  Posted by a resident ·{" "}
                  <span className="sdp-verified-text">
                    <Check size={13} strokeWidth={2.5} /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* 3-step guide if not completed */}
            {listing.status !== "completed" && (
              <div className="sdp-card sdp-steps-card">
                <div className="step-col">
                  <span className="step-num">1</span>
                  <span className="step-txt">Accept the request</span>
                </div>
                <div className="step-col">
                  <span className="step-num">2</span>
                  <span className="step-txt">Meet & scan requester’s QR</span>
                </div>
                <div className="step-col">
                  <span className="step-num">3</span>
                  <span className="step-txt">Earn {pointsText}</span>
                </div>
              </div>
            )}

            {/* If task is completed */}
            {listing.status === "completed" && (
              <div className="sdp-card sdp-completed-info">
                <ShieldCheck size={28} className="text-green-600" />
                <div>
                  <h3 className="font-bold">Task Completed</h3>
                  <p className="text-xs text-stone-500">
                    Handover was confirmed in person and points were awarded.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom action panel - PINNED at bottom of screen */}
      {listing && (
        <div className="sdp-bottom-sheet pinned-bottom-sheet">
          {listing.status === "cancelled" ? (
            <p className="text-center text-xs text-stone-500">
              This listing was deleted.
            </p>
          ) : listing.status === "completed" ? (
            <div className="accept-action-box">
              <div className="accepted-btns-row">
                <button
                  className="sdp-btn-secondary flex-1"
                  onClick={onClose}
                >
                  Back
                </button>
                {listing.assignmentId && (
                  <button
                    className="sdp-btn-dark-pill"
                    onClick={() => setChatOpen(true)}
                    aria-label="Chat message"
                  >
                    <MessageSquare size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : isAccepted ? (
            <div className="accepted-actions">
              <div className="accepted-privacy-notice">
                <Lock size={14} />
                <span>
                  Unit & contact details shared for this task only.
                </span>
              </div>

              <div className="accepted-btns-row">
                {listing.viewerRole === "requester" && (
                  <button
                    className="sdp-btn-yellow flex-1"
                    onClick={() => setShowProgress(true)}
                  >
                    <QrCode size={16} />
                    Show handover QR
                  </button>
                )}

                {listing.viewerRole === "helper" && (
                  <button
                    className="sdp-btn-gradient flex-1"
                    onClick={() => setShowProgress(true)}
                  >
                    <QrCode size={16} />
                    Scan requester’s QR
                  </button>
                )}

                <button
                  className="sdp-btn-dark-pill"
                  onClick={() => setChatOpen(true)}
                  aria-label="Chat message"
                >
                  <MessageSquare size={16} />
                </button>
              </div>

              {listing.isOwner && (
                <button
                  type="button"
                  className="sdp-btn-secondary full-width mt-2 text-red-700 border-red-200 flex items-center justify-center gap-2"
                  disabled={deleting || busy}
                  onClick={() => void deleteListing().catch(() => {})}
                >
                  <Trash2 size={15} />
                  {deleting ? "Deleting..." : "Delete listing"}
                </button>
              )}

              {!listing.isParticipant && (
                <button
                  className="sdp-btn-gradient full-width mt-2"
                  disabled={busy}
                  onClick={() => void accept()}
                >
                  Accept & help neighbour
                </button>
              )}

              {/* Keep accessible heading for E2E tests */}
              <h4 className="sr-only">You’re connected</h4>
            </div>
          ) : listing.isOwner ? (
            <div className="accept-action-box">
              <div className="privacy-hint">
                This is your listing. Waiting for a neighbour to accept.
              </div>
              <div className="flex gap-2 w-full">
                <button
                  className="sdp-btn-secondary flex-1"
                  onClick={onClose}
                >
                  Back to activity
                </button>
                <button
                  type="button"
                  className="sdp-btn-secondary flex-1 text-red-700 border-red-200 flex items-center justify-center gap-1.5"
                  disabled={deleting || busy}
                  onClick={() => void deleteListing().catch(() => {})}
                >
                  <Trash2 size={15} />
                  {deleting ? "Deleting..." : "Delete listing"}
                </button>
              </div>
            </div>
          ) : (
            <div className="accept-action-box">
              <div className="privacy-hint">
                Their unit number is shared with you after you accept.
              </div>
              <button
                className="sdp-btn-gradient full-width"
                disabled={busy}
                onClick={() => void accept()}
              >
                {busy
                  ? "Connecting..."
                  : listing.type === "request"
                  ? "Accept request"
                  : listing.type === "offer"
                  ? "Accept offer"
                  : "Ask to borrow"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Coordination Chat */}
      {chatOpen && listing?.assignmentId && (
        <TaskChat
          assignmentId={listing.assignmentId}
          partnerName={posterLabel}
          listingTitle={listing.title}
          isCompleted={listing.status === "completed"}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
