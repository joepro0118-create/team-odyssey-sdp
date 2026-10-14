"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HandHeart,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  areas,
  categories,
  templates,
  typeLabels,
  type Listing,
  type ListingInput,
  type ListingType,
} from "@/lib/types";
import { api, errorMessage } from "@/lib/client-api";
import { Modal } from "./modal";
import { ListingCard } from "./listing-card";

export function CreateListing({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (listing: Listing) => void;
}) {
  const [form, setForm] = useState<ListingInput>({
    type: "request",
    category: "Errands",
    title: "",
    description: "",
    area: "Community hub",
    timing: "",
  });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function update<K extends keyof ListingInput>(
    key: K,
    value: ListingInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function publish() {
    setBusy(true);
    setError("");
    try {
      onCreated(
        await api<Listing>("/api/listings", {
          method: "POST",
          body: JSON.stringify(form),
        }),
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={preview ? "One last look" : "A little help starts here"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="modal-content">
        <p className="modal-intro">
          {preview
            ? "This is what your neighbours will see. Your identity stays private."
            : "Ask for a hand, share a skill, or lend something useful."}
        </p>
        <div className="form-steps">
          <span className={!preview ? "active" : ""}>
            01 <b>Your listing</b>
          </span>
          <div />
          <span className={preview ? "active" : ""}>
            02 <b>Review & post</b>
          </span>
        </div>
        {preview ? (
          <>
            <ListingCard
              listing={{
                ...form,
                id: "preview",
                createdAt: "",
                status: "open",
                pointsReward: 50,
                isOwner: true,
                isParticipant: true,
              }}
              onOpen={() => setPreview(false)}
            />
            <p className="privacy-note">
              <ShieldCheck size={19} />
              Only participants see the fictional meeting details after
              acceptance.
            </p>
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => setPreview(false)}
              >
                <ArrowLeft size={17} />
                Edit listing
              </button>
              <button
                className="primary-button"
                disabled={busy}
                onClick={publish}
              >
                {busy ? "Posting…" : "Post to neighbourhood"}
                {!busy && <Check size={18} />}
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              setPreview(true);
            }}
          >
            <fieldset className="type-picker">
              <legend>What would you like to do?</legend>
              {(
                [
                  ["request", "Ask for help", HandHeart],
                  ["offer", "Offer help", HeartHandshake],
                  ["lend", "Lend an item", Wrench],
                ] as const
              ).map(([value, label, Icon]) => (
                <label
                  key={value}
                  className={form.type === value ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="listing-type"
                    value={value}
                    checked={form.type === value}
                    onChange={() => update("type", value as ListingType)}
                  />
                  <Icon size={22} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <div className="template-section">
              <span className="field-label">
                <Sparkles size={15} />
                Start with a template
              </span>
              <div className="template-options">
                {templates
                  .filter((item) => item.type === form.type)
                  .map((template) => (
                    <button
                      type="button"
                      key={template.label}
                      onClick={() => {
                        const { label: _label, ...values } = template;
                        setForm(values);
                        setError("");
                      }}
                    >
                      {template.label}
                      <ArrowUpSmall />
                    </button>
                  ))}
              </div>
            </div>
            <label className="field">
              Give it a clear title
              <input
                required
                minLength={6}
                maxLength={80}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="e.g. A hand collecting a few groceries"
              />
            </label>
            <label className="field">
              A few helpful details
              <textarea
                required
                rows={4}
                minLength={20}
                maxLength={600}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="What do you need or offer? Keep names and contact details private."
              />
              <span className="field-hint">
                Use fictional details only. No names, phone numbers, or unit
                numbers.
              </span>
            </label>
            <div className="field-row">
              <label className="field">
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    update(
                      "category",
                      event.target.value as ListingInput["category"],
                    )
                  }
                >
                  {categories.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Demo area
                <select
                  value={form.area}
                  onChange={(event) =>
                    update("area", event.target.value as ListingInput["area"])
                  }
                >
                  {areas.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              When works for you?
              <input
                required
                minLength={3}
                maxLength={80}
                value={form.timing}
                onChange={(event) => update("timing", event.target.value)}
                placeholder="e.g. Tomorrow, after 5 pm"
              />
            </label>
            <p className="privacy-note">
              <ShieldCheck size={19} />
              Neighbourly help only. No payments, sales, or prescription
              medicine requests.
            </p>
            <button className="primary-button full-width" type="submit">
              Review {typeLabels[form.type].toLowerCase()} listing
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

function ArrowUpSmall() {
  return <ArrowRight size={13} />;
}
