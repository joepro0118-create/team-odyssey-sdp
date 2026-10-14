"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, errorMessage } from "@/lib/client-api";
import {
  type CompletionResult,
  type ConfirmationResult,
  type ListingDetail as Detail,
  typeLabels,
} from "@/lib/types";
import { Modal } from "./modal";
import { CategoryIcon } from "./listing-card";
import { QrScanner } from "./qr-scanner";

export function ListingDetail({
  id,
  onClose,
  onAccepted,
}: {
  id: string;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const [listing, setListing] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    api<Detail>(`/api/listings/${id}`, { signal: controller.signal })
      .then(setListing)
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      });
    return () => controller.abort();
  }, [id, reload]);

  async function accept() {
    setBusy(true);
    setError("");
    try {
      setListing(
        await api<Detail>(`/api/listings/${id}/accept`, {
          method: "POST",
          body: "{}",
        }),
      );
      setConfirming(false);
      onAccepted();
    } catch (error) {
      setError(errorMessage(error));
      setConfirming(false);
      onAccepted();
    } finally {
      setBusy(false);
    }
  }

  async function createQr() {
    if (!listing?.assignmentId) return;
    setBusy(true);
    setError("");
    try {
      setConfirmation(
        await api<ConfirmationResult>(
          `/api/tasks/${listing.assignmentId}/confirmation`,
          { method: "POST", body: "{}" },
        ),
      );
      setReload((value) => value + 1);
      onAccepted();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function completeTask() {
    setBusy(true);
    setError("");
    try {
      const result = await api<CompletionResult>("/api/tasks/confirm", {
        method: "POST",
        body: JSON.stringify({ qrToken: qrToken.trim() }),
      });
      setCompletion(result);
      setReload((value) => value + 1);
      onAccepted();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const receiveScan = useCallback((value: string) => setQrToken(value), []);

  return (
    <Modal
      title="A connection, closer to home"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="modal-content detail-content">
        {error && (
          <div role="alert" className="error-box">
            {error}
            <button
              className="text-button"
              onClick={() => setReload((value) => value + 1)}
            >
              Refresh details
            </button>
          </div>
        )}
        {!listing && !error && (
          <p role="status" className="loading-state">
            Finding your neighbour’s listing…
          </p>
        )}
        {listing && (
          <>
            <div className="detail-top">
              <div className={`category-icon ${listing.type}`}>
                <CategoryIcon category={listing.category} size={30} />
              </div>
              <span className={`type-badge ${listing.type}`}>
                {typeLabels[listing.type]}
              </span>
            </div>
            <span className="eyebrow">{listing.category}</span>
            <h3 className="detail-title">{listing.title}</h3>
            <div className="detail-meta">
              <span>
                <MapPin size={17} />
                {listing.area}
              </span>
              <span>
                <Clock3 size={17} />
                {listing.timing}
              </span>
            </div>
            <p className="detail-description">{listing.description}</p>
            {listing.status === "cancelled" ? (
              <div className="info-panel">
                <ShieldCheck size={22} />
                <p>This listing was cancelled and can no longer be accepted.</p>
              </div>
            ) : listing.status !== "open" ? (
              <>
                <div className="success-panel">
                  <CheckCircle2 size={24} />
                  <div>
                    <h4>
                      {listing.status === "completed"
                        ? "Task completed"
                        : listing.isParticipant
                        ? "You’re connected"
                        : "A neighbour has stepped in"}
                    </h4>
                    <p>
                      {listing.status === "completed"
                        ? "The handover was confirmed and points were awarded."
                        : listing.isParticipant
                        ? "Arrange the details together before meeting."
                        : "This listing has already been accepted."}
                    </p>
                  </div>
                </div>
                {listing.contact && (
                  <section className="contact-panel">
                    <span className="eyebrow">
                      Only visible to participants · fictional details
                    </span>
                    <h4>
                      <Users size={19} />
                      {listing.contact.name}
                    </h4>
                    <p>{listing.contact.meetingNote}</p>
                    <hr />
                    <p className="muted">
                      Confirm the handover in person. Accepting alone does not
                      award points.
                    </p>
                  </section>
                )}
                {listing.isParticipant && listing.assignmentId && listing.status !== "completed" && (
                  <section className="confirmation-panel">
                    <span className="eyebrow"><QrCode size={16} /> IN-PERSON CONFIRMATION</span>
                    {listing.viewerRole === "helper" ? (
                      <>
                        <p>Generate a temporary QR code for the requester to scan at handover.</p>
                        <button className="primary-button" disabled={busy} onClick={() => void createQr()}>
                          {busy ? "Generating…" : confirmation ? "Generate a new QR" : "Generate QR"}
                        </button>
                        {confirmation && (
                          <div className="generated-qr">
                            <QRCodeSVG value={confirmation.qrToken} size={220} level="M" />
                            <p>Expires {new Date(confirmation.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        )}
                      </>
                    ) : listing.status === "awaiting_confirmation" ? (
                      <>
                        <p>Scan the helper’s QR code. Completion awards {listing.pointsReward} points to the helper.</p>
                        <QrScanner onScan={receiveScan} />
                        <label className="field">QR token
                          <input value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Scan or paste the QR token" />
                        </label>
                        <button className="primary-button full-width" disabled={busy || qrToken.trim().length < 16} onClick={() => void completeTask()}>
                          {busy ? "Confirming…" : "Confirm completion"}
                        </button>
                      </>
                    ) : (
                      <p>The helper will generate a QR code when you meet.</p>
                    )}
                  </section>
                )}
                {completion && <div className="notice" role="status">Completed successfully. {completion.pointsAwarded} points were awarded.</div>}
              </>
            ) : listing.isOwner ? (
              <div className="info-panel">
                <ShieldCheck size={22} />
                <p>
                  This is your listing. Sign in with another fictional demo
                  account on a second browser or phone to test acceptance.
                </p>
              </div>
            ) : (
              <>
                <div className="info-panel">
                  <ShieldCheck size={22} />
                  <p>
                    Your identity stays private until you accept. Only you and
                    the other resident will see the fictional meeting details.
                  </p>
                </div>
                {confirming ? (
                  <div className="confirm-panel">
                    <h4>Ready to connect?</h4>
                    <p>
                      Accept only if the timing works for you. You can agree on
                      the details together afterward.
                    </p>
                    <div className="form-actions">
                      <button
                        className="secondary-button"
                        disabled={busy}
                        onClick={() => setConfirming(false)}
                      >
                        Go back
                      </button>
                      <button
                        className="primary-button"
                        disabled={busy}
                        onClick={accept}
                      >
                        {busy ? "Connecting…" : "Confirm acceptance"}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="primary-button full-width"
                    onClick={() => setConfirming(true)}
                  >
                    {listing.type === "request"
                      ? "I can lend a hand"
                      : listing.type === "offer"
                        ? "Accept this offer"
                        : "Ask to borrow"}
                    <ArrowRight size={18} />
                  </button>
                )}
              </>
            )}
            <p className="fine-print">
              Demo content only. Tolong connects residents; it does not employ
              or insure them.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
