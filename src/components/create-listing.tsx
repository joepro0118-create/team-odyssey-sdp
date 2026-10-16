"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Lock,
  MapPin,
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
  // Local date strings (ensuring correct local time)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, "0")}-${String(tomorrowObj.getDate()).padStart(2, "0")}`;

  const todayLabel = now.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  const tomorrowLabel = tomorrowObj.toLocaleDateString("en-MY", { month: "short", day: "numeric" });

  const [form, setForm] = useState<ListingInput>({
    type: "request",
    category: "Food & groceries",
    title: "",
    description: "",
    area: "Precinct 3",
    timing: "Today, Evening (6pm)",
  });
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [showFullCal, setShowFullCal] = useState(false);

  const customDateLabel = useMemo(() => {
    if (selectedDate !== todayStr && selectedDate !== tomorrowStr) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
      }
      return selectedDate;
    }
    return "Pick date";
  }, [selectedDate, todayStr, tomorrowStr]);
  const isCustomDate = selectedDate !== todayStr && selectedDate !== tomorrowStr;

  function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr });
    }
    return days;
  }

  const [selectedHour, setSelectedHour] = useState(6);
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("PM");
  const [venue, setVenue] = useState("");
  const [points, setPoints] = useState(20);
  const [preview, setPreview] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** Build a human-readable timing string from the date + time state */
  function getFormattedTiming(
    dateStr: string,
    hour: number,
    minute: string,
    period: "AM" | "PM"
  ) {
    let dayLabel = "Today";
    if (dateStr === tomorrowStr) {
      dayLabel = "Tomorrow";
    } else if (dateStr !== todayStr) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dayLabel = d.toLocaleDateString("en-MY", { weekday: "short", month: "short", day: "numeric" });
      } else {
        dayLabel = dateStr;
      }
    }

    return `${dayLabel}, ${hour}:${minute} ${period}`;
  }

  const formattedTiming = getFormattedTiming(
    selectedDate,
    selectedHour,
    selectedMinute,
    selectedPeriod
  );

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
              // Compose timing from date + time pickers
              const timing = formattedTiming;
              // Compose area from area dropdown + optional venue
              const fullArea = venue.trim()
                ? `${form.area} · ${venue.trim()}`
                : form.area;
              // Title is optional — fall back to the category name if blank
              const title = form.title.trim() || form.category;
              // Description auto-fill if too short
              const description =
                form.description.trim().length >= 10
                  ? form.description.trim()
                  : `${title}. Handover at ${fullArea}.`;
              setForm((prev) => ({
                ...prev,
                title,
                description,
                timing,
                area: fullArea,
              }));
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
                      if (vals.timing?.toLowerCase().includes("tomorrow")) {
                        setSelectedDate(tomorrowStr);
                      } else {
                        setSelectedDate(todayStr);
                      }
                      if (vals.timing?.toLowerCase().includes("morning")) {
                        setSelectedHour(9);
                        setSelectedMinute("00");
                        setSelectedPeriod("AM");
                      } else if (vals.timing?.toLowerCase().includes("afternoon")) {
                        setSelectedHour(2);
                        setSelectedMinute("00");
                        setSelectedPeriod("PM");
                      } else if (vals.timing?.toLowerCase().includes("evening") || vals.timing?.toLowerCase().includes("6 pm")) {
                        setSelectedHour(6);
                        setSelectedMinute("00");
                        setSelectedPeriod("PM");
                      } else if (vals.timing?.toLowerCase().includes("weekend")) {
                        const sat = new Date(now);
                        sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
                        const satStr = `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, "0")}-${String(sat.getDate()).padStart(2, "0")}`;
                        setSelectedDate(satStr);
                        setSelectedHour(2);
                        setSelectedMinute("00");
                        setSelectedPeriod("PM");
                      }
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

            {/* Title & Details card (Single Line) */}
            <div className="sdp-card">
              <label className="sdp-section-label" htmlFor="post-title">
                Title <span style={{ fontWeight: 500, opacity: 0.6 }}>(optional)</span>
              </label>
              <div className="sdp-describe-row">
                <input
                  id="post-title"
                  aria-label="Title (optional)"
                  maxLength={80}
                  value={form.title}
                  onChange={(e) => {
                    update("title", e.target.value);
                    update("description", e.target.value);
                  }}
                  placeholder="e.g. Need eggs and bread from shop"
                  className="sdp-describe-input"
                />
                <button
                  type="button"
                  className="sdp-mic-btn"
                  aria-label="Speak"
                  onClick={() => {
                    if (!form.title) {
                      update("title", "Need eggs and bread from shop");
                      update("description", "Looking for a neighbour nearby to help out.");
                    }
                  }}
                >
                  <Mic size={18} />
                </button>
              </div>
            </div>

            {/* WHEN CARD */}
            <div className="sdp-card sdp-when-card">
              <div className="sdp-form-header-row">
                <div className="sdp-form-header-title">
                  <Calendar size={16} className="text-[#c8102e]" />
                  <span className="sdp-section-label">WHEN</span>
                </div>
                <span className="sdp-timing-preview-pill">
                  {formattedTiming}
                </span>
              </div>

              {/* Date Selection: 3 Quick Pills + Optional Calendar Drawer */}
              <div className="sdp-selector-block">
                <span className="sdp-selector-sublabel">CHOOSE DATE</span>
                
                <div className="sdp-date-pills-row">
                  {/* Today Pill */}
                  <button
                    type="button"
                    className={`sdp-date-pill ${selectedDate === todayStr && !isCustomDate ? "is-selected" : ""}`}
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setShowFullCal(false);
                    }}
                  >
                    <span className="sdp-date-pill-main">Today</span>
                    <span className="sdp-date-pill-sub">{todayLabel}</span>
                  </button>

                  {/* Tomorrow Pill */}
                  <button
                    type="button"
                    className={`sdp-date-pill ${selectedDate === tomorrowStr && !isCustomDate ? "is-selected" : ""}`}
                    onClick={() => {
                      setSelectedDate(tomorrowStr);
                      setShowFullCal(false);
                    }}
                  >
                    <span className="sdp-date-pill-main">Tomorrow</span>
                    <span className="sdp-date-pill-sub">{tomorrowLabel}</span>
                  </button>

                  {/* Pick Date / Custom Date Pill */}
                  <button
                    type="button"
                    className={`sdp-date-pill ${isCustomDate || showFullCal ? "is-selected" : ""}`}
                    onClick={() => setShowFullCal((v) => !v)}
                  >
                    <span className="sdp-date-pill-main">
                      <Calendar size={13} />
                      {isCustomDate ? customDateLabel : "Pick Date"}
                    </span>
                    <span className="sdp-date-pill-sub">
                      {showFullCal ? "Tap to close" : "More dates"}
                    </span>
                  </button>
                </div>

                {/* Inline Month Calendar (when Pick Date is tapped) */}
                {showFullCal && (
                  <div className="sdp-inline-calendar">
                    <div className="sdp-cal-header">
                      <button
                        type="button"
                        className="sdp-cal-nav-btn"
                        aria-label="Previous month"
                        onClick={() => {
                          if (calMonth === 0) {
                            setCalMonth(11);
                            setCalYear((y) => y - 1);
                          } else {
                            setCalMonth((m) => m - 1);
                          }
                        }}
                      >
                        ‹
                      </button>

                      {/* Month & Year Select Dropdowns */}
                      <div className="sdp-cal-selects">
                        <select
                          className="sdp-cal-select"
                          value={calMonth}
                          aria-label="Month"
                          onChange={(e) => setCalMonth(Number(e.target.value))}
                        >
                          {[
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ].map((name, idx) => (
                            <option key={name} value={idx}>{name}</option>
                          ))}
                        </select>

                        <select
                          className="sdp-cal-select"
                          value={calYear}
                          aria-label="Year"
                          onChange={(e) => setCalYear(Number(e.target.value))}
                        >
                          {[2026, 2027, 2028].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        className="sdp-cal-nav-btn"
                        aria-label="Next month"
                        onClick={() => {
                          if (calMonth === 11) {
                            setCalMonth(0);
                            setCalYear((y) => y + 1);
                          } else {
                            setCalMonth((m) => m + 1);
                          }
                        }}
                      >
                        ›
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-stone-400">
                        Tap a date to select
                      </span>
                      <button
                        type="button"
                        className="sdp-cal-today-btn"
                        onClick={() => {
                          setCalYear(now.getFullYear());
                          setCalMonth(now.getMonth());
                          setSelectedDate(todayStr);
                          setShowFullCal(false);
                        }}
                      >
                        Jump to Today
                      </button>
                    </div>

                    <div className="sdp-cal-grid">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
                        <div key={wd} className="sdp-cal-weekday">{wd}</div>
                      ))}
                      {getCalendarDays(calYear, calMonth).map((slot, idx) => {
                        if (!slot) {
                          return <div key={`empty-${idx}`} className="sdp-cal-day empty" />;
                        }
                        const isSelected = selectedDate === slot.dateStr;
                        const isPast = slot.dateStr < todayStr;
                        return (
                          <button
                            type="button"
                            key={slot.dateStr}
                            disabled={isPast}
                            className={`sdp-cal-day ${isSelected ? "is-selected" : ""}`}
                            onClick={() => {
                              setSelectedDate(slot.dateStr);
                              setShowFullCal(false);
                            }}
                          >
                            {slot.dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Time Selection: User selects their own time directly */}
              <div className="sdp-selector-block">
                <span className="sdp-selector-sublabel">CHOOSE TIME</span>

                <div className="sdp-custom-time-box">
                  <div className="sdp-time-dropdowns-row">
                    {/* Hour Dropdown */}
                    <div className="sdp-time-select-wrapper">
                      <label htmlFor="sdp-time-hour-select" className="sdp-time-select-label">Hour</label>
                      <select
                        id="sdp-time-hour-select"
                        className="sdp-time-select"
                        value={selectedHour}
                        aria-label="Select hour"
                        onChange={(e) => setSelectedHour(Number(e.target.value))}
                      >
                        {hours.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sdp-time-colon">:</div>

                    {/* Minute Dropdown */}
                    <div className="sdp-time-select-wrapper">
                      <label htmlFor="sdp-time-minute-select" className="sdp-time-select-label">Minute</label>
                      <select
                        id="sdp-time-minute-select"
                        className="sdp-time-select"
                        value={selectedMinute}
                        aria-label="Select minute"
                        onChange={(e) => setSelectedMinute(e.target.value)}
                      >
                        {minutes.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* AM / PM Segmented Control */}
                    <div className="sdp-time-select-wrapper">
                      <span className="sdp-time-select-label">Period</span>
                      <div className="sdp-period-toggle-group" role="radiogroup" aria-label="AM or PM">
                        {(["AM", "PM"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            role="radio"
                            aria-checked={selectedPeriod === p}
                            className={`sdp-period-btn ${selectedPeriod === p ? "is-selected" : ""}`}
                            onClick={() => setSelectedPeriod(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WHERE & VENUE CARD */}
            <div className="sdp-card sdp-where-card area-card">
              <div className="sdp-form-header-row">
                <div className="sdp-form-header-title">
                  <MapPin size={16} className="text-[#c8102e]" />
                  <span className="sdp-section-label">WHERE & VENUE</span>
                </div>
              </div>

              {/* Neighbourhood dropdown */}
              <div className="sdp-selector-block" ref={areaRef}>
                <span className="sdp-selector-sublabel">NEIGHBOURHOOD</span>
                <button
                  type="button"
                  className="sdp-neighbourhood-btn"
                  aria-expanded={areaOpen}
                  aria-haspopup="listbox"
                  onClick={() => setAreaOpen((open) => !open)}
                >
                  <div className="flex items-center gap-2">
                    <span className="sdp-area-dot"></span>
                    <span className="font-bold text-stone-900 text-sm">{form.area}</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-stone-400 transition-transform ${areaOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {areaOpen && (
                  <ul className="area-menu" role="listbox" aria-label="Neighbourhood">
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

              {/* Venue meeting spot & quick suggestions */}
              <div className="sdp-selector-block">
                <div className="flex items-center justify-between">
                  <span className="sdp-selector-sublabel">SPECIFIC MEETING SPOT</span>
                  <span className="text-[11px] font-semibold text-stone-400">Optional</span>
                </div>

                {/* Quick suggestions */}
                <div className="sdp-venue-chip-row">
                  {["Lobby", "Guardhouse", "Carpark", "Doorstep", "Lift"].map((spot) => (
                    <button
                      type="button"
                      key={spot}
                      className={`sdp-venue-suggestion-chip ${venue.toLowerCase().includes(spot.toLowerCase()) ? "active" : ""}`}
                      onClick={() => setVenue(spot)}
                    >
                      {spot}
                    </button>
                  ))}
                </div>

                {/* Custom venue input */}
                <div className="sdp-venue-input-container">
                  <MapPin size={15} className="text-stone-400 shrink-0" />
                  <input
                    type="text"
                    className="sdp-venue-text-input"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Block A lobby, Guardhouse 2..."
                    maxLength={60}
                    aria-label="Meeting spot"
                  />
                  {venue && (
                    <button
                      type="button"
                      className="sdp-venue-clear-btn"
                      onClick={() => setVenue("")}
                      aria-label="Clear meeting spot"
                    >
                      ×
                    </button>
                  )}
                </div>
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
