"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  HandHeart,
  HeartHandshake,
  LayoutGrid,
  Leaf,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import { isBrowserPreview } from "@/lib/demo-mode";
import {
  categories,
  type FeedResponse,
  type ListingType,
  type ResidentId,
} from "@/lib/types";
import { CreateListing } from "./create-listing";
import { ListingDetail } from "./listing-detail";
import { ListingCard } from "./listing-card";

type Filter = "all" | ListingType;

export function Marketplace() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [currentResident, setCurrentResident] = useState<ResidentId>("resident-a");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"feed" | "activity">("feed");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [showAccepted, setShowAccepted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const sequence = useRef(0);
  const switchInFlight = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (switchInFlight.current && !force) return;
    const requestNumber = ++sequence.current;
    try {
      const data = await api<FeedResponse>("/api/listings");
      if (requestNumber === sequence.current) {
        setFeed(data);
        setCurrentResident(data.resident);
        setError("");
      }
    } catch (error) {
      if (requestNumber === sequence.current) setError(errorMessage(error));
    } finally {
      if (requestNumber === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 6000);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      sequence.current++;
    };
  }, [refresh]);

  async function changeResident(resident: ResidentId) {
    switchInFlight.current = true;
    sequence.current++;
    setSwitching(true);
    setSelected(null);
    setCreating(false);
    setNotice("");
    try {
      await api("/api/demo-session", {
        method: "POST",
        body: JSON.stringify({ resident }),
      });
      setCurrentResident(resident);
      setFeed(null);
      setLoading(true);
      await refresh(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      switchInFlight.current = false;
      setSwitching(false);
    }
  }

  const listings = feed?.listings ?? [];
  const activeCount = listings.filter((item) => item.status === "open").length;
  const myCount = listings.filter((item) => item.isParticipant).length;
  const filtered = listings.filter((item) => {
    if (tab === "activity" && !item.isParticipant) return false;
    if (tab === "feed" && !showAccepted && item.status !== "open") return false;
    if (filter !== "all" && item.type !== filter) return false;
    if (category !== "all" && item.category !== category) return false;
    return `${item.title} ${item.description} ${item.category} ${item.area}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  function changeTab(value: typeof tab) {
    setTab(value);
    setQuery("");
    setFilter("all");
    setCategory("all");
  }

  return (
    <>
      <a href="#marketplace" className="skip-link">
        Skip to marketplace
      </a>
      <div className="demo-bar">
        <span>
          <i />A neighbourhood of possibilities. A prototype with fictional
          data.
        </span>
        <span className="demo-tag">DEMO</span>
      </div>
      {isBrowserPreview && <div className="preview-notice" role="note"><strong>Interactive preview · this tab only.</strong> Switch demo residents to try posting and accepting. Refreshing resets the demo. Shared listings across phones are coming with Supabase.</div>}
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Tolong home">
            <span className="brand-symbol">
              <HeartHandshake size={25} strokeWidth={1.7} />
            </span>
            <span>
              tolong<span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <button
              onClick={() => changeTab("feed")}
              aria-current={tab === "feed" ? "page" : undefined}
            >
              Neighbourhood
            </button>
            <button
              onClick={() => changeTab("activity")}
              aria-current={tab === "activity" ? "page" : undefined}
            >
              My activity
              {myCount > 0 && <span className="nav-count">{myCount}</span>}
            </button>
          </nav>
          <div className="header-right">
            <span className="area-label">
              <MapPin size={16} />
              Demo neighbourhood
            </span>
            <label className="resident-picker">
              <span className="resident-avatar" aria-hidden="true">
                {currentResident.slice(-1).toUpperCase()}
              </span>
              <span className="sr-only">Demo resident</span>
              <select
                aria-label="Demo resident"
                value={currentResident}
                onChange={(event) =>
                  void changeResident(event.target.value as ResidentId)
                }
                disabled={switching}
              >
                <option value="resident-a">Resident A · demo</option>
                <option value="resident-b">Resident B · demo</option>
                <option value="resident-c">Resident C · demo</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span />
              GOOD NEIGHBOURS. EVERYDAY POSSIBILITIES.
            </p>
            <h1 id="hero-title">
              A little help.
              <br />A better <em>neighbourhood.</em>
            </h1>
            <p>
              Someone nearby could use a hand.
              <br className="mobile-break" /> Yours might be just the one.
            </p>
            <button
              className="primary-button hero-button"
              onClick={() => setCreating(true)}
              disabled={switching}
            >
              <Plus size={19} />
              Post to your neighbourhood
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-note note-top">
              <span className="note-icon peach">
                <HandHeart size={23} />
              </span>
              <span>
                A small favour.
                <br />
                <b>A big difference.</b>
              </span>
              <Sparkles size={17} />
            </div>
            <div className="house-group">
              <div className="tree tree-left">
                <div />
                <i />
              </div>
              <div className="house house-back">
                <i className="roof" />
                <div className="house-window" />
                <div className="house-door" />
              </div>
              <div className="house house-front">
                <i className="roof" />
                <div className="house-window" />
                <div className="house-window second" />
                <div className="house-door" />
              </div>
              <div className="tree tree-right">
                <div />
                <i />
              </div>
              <div className="ground" />
            </div>
            <div className="art-note note-bottom">
              <span className="note-icon sage">
                <Users size={22} />
              </span>
              <span>
                Closer to home.
                <br />
                <b>Closer to each other.</b>
              </span>
              <span className="little-heart">♡</span>
            </div>
          </div>
        </section>

        <div className="content-layout">
          <aside className="sidebar">
            <div className="sidebar-nav">
              <span className="eyebrow">YOUR LITTLE CORNER</span>
              <button
                className={tab === "feed" ? "active" : ""}
                onClick={() => changeTab("feed")}
              >
                <LayoutGrid size={19} />
                Neighbourhood<span>{activeCount}</span>
              </button>
              <button
                className={tab === "activity" ? "active" : ""}
                onClick={() => changeTab("activity")}
              >
                <HeartHandshake size={19} />
                My activity{myCount > 0 && <span>{myCount}</span>}
              </button>
            </div>
            <div className="kindness-card">
              <div className="line-art">
                <Leaf size={34} strokeWidth={1.1} />
                <Sparkles size={19} strokeWidth={1.2} />
              </div>
              <h3>
                It starts with
                <br />a little kindness.
              </h3>
              <p>An extra pair of hands. A tool to borrow. A skill to share.</p>
              <button
                className="text-button"
                onClick={() => setCreating(true)}
                disabled={switching}
              >
                What can you offer?
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="how-it-works">
              <h3>
                <CircleHelp size={16} />
                How it works
              </h3>
              <ol>
                <li>
                  <span>1</span>Post a need or an offer
                </li>
                <li>
                  <span>2</span>Connect with a neighbour
                </li>
                <li>
                  <span>3</span>Meet and lend a hand
                </li>
              </ol>
              <p>
                Confirmation & rewards will follow in the next team integration.
              </p>
            </div>
            <div className="privacy-aside">
              <ShieldCheck size={18} />
              <p>
                Private by design.
                <br />
                Your identity stays off the feed.
              </p>
            </div>
          </aside>

          <section
            id="marketplace"
            className="feed-section"
            aria-labelledby="feed-heading"
            tabIndex={-1}
          >
            <div className="feed-heading">
              <div>
                <span className="eyebrow">
                  {tab === "feed"
                    ? "SMALL ACTS, SHARED EVERY DAY"
                    : "YOUR NEIGHBOURLY CONNECTIONS"}
                </span>
                <h2 id="feed-heading">
                  {tab === "feed" ? "Around the neighbourhood" : "My activity"}
                  <span>{tab === "feed" ? activeCount : myCount}</span>
                </h2>
              </div>
              <span className="live-label">
                <i />
                {isBrowserPreview ? "Preview feed" : "Demo feed"}
              </span>
            </div>
            <p className="feed-subtitle">
              {tab === "feed"
                ? "Find a way to help, or the helping hand you need."
                : "The listings you posted and the connections you made."}
            </p>
            <div className="filter-tabs" role="group" aria-label="Listing type">
              {(
                [
                  ["all", "Everything"],
                  ["request", "Needs a hand"],
                  ["offer", "Offering help"],
                  ["lend", "To borrow"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={filter === value}
                  className={filter === value ? "active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="search-row">
              <label className="search-box">
                <Search size={18} />
                <span className="sr-only">Search listings</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try groceries, gardening, a helping hand…"
                />
              </label>
              <label className="category-select">
                <span className="sr-only">Filter by category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
            <div className="results-row">
              <span>
                {loading
                  ? "Finding nearby possibilities…"
                  : `${filtered.length} ${filtered.length === 1 ? "listing" : "listings"}${tab === "activity" ? " in your activity" : " to explore"}`}
              </span>
              {tab === "feed" && (
                <label>
                  <input
                    type="checkbox"
                    checked={showAccepted}
                    onChange={(event) => setShowAccepted(event.target.checked)}
                  />
                  Include accepted
                </label>
              )}
            </div>
            {notice && (
              <div className="notice" role="status">
                <Check size={18} />
                {notice}
                <button
                  className="icon-button"
                  onClick={() => setNotice("")}
                  aria-label="Dismiss notification"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {error && (
              <div className="error-box" role="alert">
                {error}
                <button className="text-button" onClick={() => void refresh()}>
                  Try again
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
            {loading || switching ? (
              <div
                className="card-grid"
                aria-busy="true"
                aria-label="Loading listings"
              >
                {[1, 2, 3, 4].map((value) => (
                  <div key={value} className="skeleton-card">
                    <div />
                    <div />
                    <div />
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="card-grid">
                {filtered.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onOpen={() => setSelected(listing.id)}
                  />
                ))}
              </div>
            ) : (
              !error && (
                <div className="empty-state">
                  <span>
                    <HandHeart size={34} strokeWidth={1.3} />
                  </span>
                  <h3>
                    {tab === "activity" && myCount === 0
                      ? "Your first connection starts here"
                      : "A little quiet in this corner"}
                  </h3>
                  <p>
                    {tab === "activity" && myCount === 0
                      ? "Post a listing or accept a neighbour’s offer to see it here."
                      : "Try another search or category, or start a listing of your own."}
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (query || filter !== "all" || category !== "all") {
                        setQuery("");
                        setFilter("all");
                        setCategory("all");
                      } else setCreating(true);
                    }}
                  >
                    {query || filter !== "all" || category !== "all"
                      ? "Clear filters"
                      : "Create a listing"}
                    <ArrowRight size={17} />
                  </button>
                </div>
              )
            )}
            <div className="feed-footer">
              <span>✳</span>
              <p>Good things grow when neighbours lend a hand.</p>
            </div>
          </section>
        </div>
        <footer className="site-footer">
          <span className="footer-brand">tolong.</span>
          <p>
            A university hackathon prototype. All residents, listings, and
            places are fictional.
            <br />
            {isBrowserPreview ? "This tab’s demo resets on refresh and does not sync across phones." : "Demo data resets when the server restarts."} Tolong connects
            residents; it does not employ or insure them.
          </p>
          <span className="footer-note">
            Made for a little more togetherness.
          </span>
        </footer>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          aria-current={tab === "feed" ? "page" : undefined}
          onClick={() => changeTab("feed")}
        >
          <LayoutGrid size={20} />
          Neighbourhood
        </button>
        <button
          className="mobile-post"
          disabled={switching}
          onClick={() => setCreating(true)}
        >
          <Plus size={24} />
          <span>Post</span>
        </button>
        <button
          aria-current={tab === "activity" ? "page" : undefined}
          onClick={() => changeTab("activity")}
        >
          <HeartHandshake size={20} />
          My activity
        </button>
      </nav>
      {creating && (
        <CreateListing
          onClose={() => setCreating(false)}
          onCreated={(listing) => {
            setCreating(false);
            changeTab("activity");
            setNotice("Your listing is live in the demo neighbourhood.");
            void refresh();
            setSelected(listing.id);
          }}
        />
      )}
      {selected && (
        <ListingDetail
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
          onAccepted={() => {
            void refresh();
          }}
        />
      )}
    </>
  );
}
