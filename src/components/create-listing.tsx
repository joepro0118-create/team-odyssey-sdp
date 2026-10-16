"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Lock,
  Mic,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  areas,
  categories,
  templates,
  typeLabels,
  type Listing,
  type ListingDetail,
  type ListingInput,
  type ListingType,
} from "@/lib/types";
import { api, errorMessage } from "@/lib/client-api";

export function CreateListing({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (listing: Listing) => void;
}) {
  const [form, setForm] = useState<ListingInput>({
    type: "request",
    category: "Food & groceries",
    title: "",
    description: "",
    area: "Precinct 3",
    timing: "Today, before 6 pm",
  });
  const [points, setPoints] = useState(20);
  const [preview, setPreview] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof ListingInput>(
    key: K,
    value: ListingInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  useEffect(() => {
    if (!areaOpen) return;
    function close(event: MouseEvent) {
      if (!areaRef.current?.contains(event.target as Node)) setAreaOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAreaOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [areaOpen]);

  async function publish() {
    setBusy(true);
    setError("");
    try {
      const created = await api<Listing>("/api/listings", {
        method: "POST",
        body: JSON.stringify({ ...form, pointsReward: points }),
      });
      // Automatically connect with neighbour Ben so Diagram 2 is immediately active
      try {
        await api<ListingDetail>(
          `/api/listings/${created.id}/simulate-accept`,
          { method: "POST", body: "{}" },
        );
      } catch {
        // ignore
      }
      onCreated(created);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // Quick categories matching design chips
  const designCategories = [
    { label: "Groceries", val: "Food & groceries" },
    { label: "Errands", val: "Errands" },
    { label: "Medicine", val: "Medicine (OTC)" },
    { label: "Carrying", val: "Carrying" },
    { label: "Tech help", val: "Skills & tech" },
    { label: "Company", val: "Company" },
  ];

  return (
    <div className="sdp-screen-view" role="region" aria-label="New Post">
      {/* Top red-gold gradient band */}
      <div className="sdp-screen-band post-band">
        <div className="sdp-band-header">
          <button
            onClick={onClose}
            className="sdp-back-btn"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="sdp-band-title">
            {preview ? "Review post" : "New post"}
          </h1>
        </div>
      </div>

      <div className="sdp-screen-body">
        {error && <div className="sdp-error-banner">{error}</div>}

        {preview ? (
          /* Step 2: Review & confirm */
          <div className="sdp-review-container">
            <div className="sdp-card">
              <div className="sdp-card-top">
                <span className="sdp-pill-tag bg-red-100 text-red-700">
                  {typeLabels[form.type]} · {form.category}
                </span>
                <span className="sdp-points-chip">+{points} pts</span>
              </div>
              <h2 className="sdp-detail-title">{form.title}</h2>
              <p className="sdp-detail-desc">{form.description}</p>
              <div className="sdp-detail-meta-rows">
                <div className="meta-row">
                  <span className="meta-label">WHEN</span>
                  <span className="meta-val">{form.timing}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">WHERE</span>
                  <span className="meta-val">{form.area}</span>
                </div>
              </div>
            </div>

            <div className="sdp-privacy-card">
              <Lock size={18} />
              <p>
                Your unit number stays private. It will only be revealed to the
                neighbour who accepts this task.
              </p>
            </div>
          </div>
        ) : (
          /* Step 1: Form */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Title is optional — fall back to the category name if blank
              if (!form.title.trim()) {
                setForm((prev) => ({ ...prev, title: prev.category }));
              }
              if (!form.description.trim() || form.description.length < 10) {
                // Auto-fill description if title is descriptive
                setForm((prev) => ({
                  ...prev,
                  description:
                    prev.description.length >= 10
                      ? prev.description
                      : `${prev.title}. Handover at ${prev.area}.`,
                }));
              }
              setPreview(true);
            }}
            className="sdp-post-form"
          >
            {/* Segmented type toggle */}
            <div className="sdp-segment-toggle">
              {(["request", "offer", "lend"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`sdp-segment-btn ${form.type === t ? "active" : ""}`}
                  onClick={() => update("type", t)}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Quick Templates bar */}
            <div className="sdp-template-chips-row">
              <span className="template-hint">
                <Sparkles size={14} /> Quick templates:
              </span>
              {templates
                .filter((tmpl) => tmpl.type === form.type)
                .slice(0, 3)
                .map((tmpl) => (
                  <button
                    type="button"
                    key={tmpl.label}
                    className="sdp-template-chip"
                    onClick={() => {
                      const { label: _l, ...vals } = tmpl;
                      setForm(vals);
                    }}
                  >
                    {tmpl.label}
                  </button>
                ))}
            </div>

            {/* Category selection */}
            <div className="sdp-card">
              <span className="sdp-section-label">WHAT IS IT ABOUT?</span>
              <div className="sdp-chip-grid">
                {designCategories.map((c) => (
                  <button
                    type="button"
                    key={c.label}
                    className={`sdp-category-chip ${
                      form.category === c.val ? "selected" : ""
                    }`}
                    onClick={() => update("category", c.val)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Details card */}
            <div className="sdp-card">
              <label className="sdp-section-label" htmlFor="post-title">
                Title <span style={{ fontWeight: 500, opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                id="post-title"
                aria-label="Title (optional)"
                maxLength={80}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Need eggs and bread from shop"
                className="sdp-input-box"
              />
              <div className="sdp-describe-row">
                <input
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Type or say extra details (optional)"
                  className="sdp-describe-input"
                />
                <button
                  type="button"
                  className="sdp-mic-btn"
                  aria-label="Speak"
                  onClick={() => {
                    if (!form.description) {
                      update(
                        "description",
                        "Looking for a neighbour nearby to help out.",
                      );
                    }
                  }}
                >
                  <Mic size={18} />
                </button>
              </div>
            </div>

            {/* When & Where card */}
            <div className="sdp-card p-0 area-card">
              <div className="sdp-row-item">
                <div className="flex-1">
                  <div className="sdp-meta-tiny">WHEN</div>
                  <input
                    value={form.timing}
                    onChange={(e) => update("timing", e.target.value)}
                    className="sdp-inline-input"
                    placeholder="e.g. Today, before 6 pm"
                  />
                </div>
                <ChevronRight size={18} className="text-stone-400" />
              </div>
              <div className="sdp-row-item border-t border-stone-200 area-row" ref={areaRef}>
                <div className="flex-1">
                  <div className="sdp-meta-tiny">WHERE</div>
                  <button
                    type="button"
                    className="area-trigger"
                    aria-expanded={areaOpen}
                    aria-haspopup="listbox"
                    onClick={() => setAreaOpen((open) => !open)}
                  >
                    {form.area}
                  </button>
                </div>
                <ChevronRight
                  size={18}
                  className={`area-chevron${areaOpen ? " open" : ""}`}
                />
                {areaOpen && (
                  <ul className="area-menu" role="listbox" aria-label="Where">
                    {areas.map((area) => (
                      <li key={area}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={form.area === area}
                          className={form.area === area ? "is-selected" : ""}
                          onClick={() => {
                            update("area", area);
                            setAreaOpen(false);
                          }}
                        >
                          {area}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Points stepper */}
            <div className="sdp-card sdp-points-stepper-card">
              <span className="font-bold text-sm">Points for the helper</span>
              <div className="stepper-controls">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setPoints((p) => Math.max(10, p - 10))}
                  aria-label="Fewer points"
                >
                  −
                </button>
                <span className="stepper-val">+{points} pts</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setPoints((p) => Math.min(100, p + 10))}
                  aria-label="More points"
                >
                  +
                </button>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="sdp-privacy-hint">
              <Lock size={15} className="text-red-600 flex-none" />
              <span>
                Your unit number stays private. It is only shared with the
                neighbour who accepts.
              </span>
            </div>

            {/* Submit / Review button */}
            <button
              type="submit"
              className="sdp-btn-yellow full-width"
            >
              Review needs a hand listing
            </button>
          </form>
        )}
      </div>

      {preview && (
        <div className="sdp-bottom-sheet pinned-bottom-sheet review-actions-sheet">
          <div className="review-actions">
            <button
              className="sdp-btn-secondary"
              disabled={busy}
              onClick={() => setPreview(false)}
            >
              Edit details
            </button>
            <button
              className="sdp-btn-yellow"
              disabled={busy}
              onClick={() => void publish()}
            >
              {busy ? "Posting..." : "Post to neighbourhood"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
