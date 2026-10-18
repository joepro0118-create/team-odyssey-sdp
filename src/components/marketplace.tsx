"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import {
  type FeedResponse,
  type ListingType,
} from "@/lib/types";
import { CreateListing } from "./create-listing";
import { ListingDetail } from "./listing-detail";
import { ListingCard } from "./listing-card";
import { RewardsPanel } from "./rewards-panel";
import { ProfilePanel } from "./profile-panel";
import { TolongAssistant } from "./tolong-assistant";

type Tab = "home" | "activity" | "rewards" | "profile";
type FilterType = "all" | ListingType;

export function Marketplace({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [filter, setFilter] = useState<FilterType>("all");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedQrMode, setSelectedQrMode] = useState<"show" | "scan" | null>(
    null,
  );
  const sequence = useRef(0);
  // Assistant sheet is opened from the Home prompt bar (or the Post form link).
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantSeed, setAssistantSeed] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const handleFeedScroll = (e: React.UIEvent<HTMLElement>) => {
    if (tab !== "home") return;
    const current = e.currentTarget.scrollTop;
    const diff = current - lastScrollTop.current;

    // At or near top, always keep tab bar visible
    if (current <= 15) {
      setIsTabBarVisible(true);
    } else if (diff > 8) {
      // User slides/scrolls downward -> tab bar slides below and stays hidden
      setIsTabBarVisible(false);
    } else if (diff < -8) {
      // User slides/scrolls up -> tab bar reappears sliding up
      setIsTabBarVisible(true);
    }
    lastScrollTop.current = current;
  };

  useEffect(() => {
    setIsTabBarVisible(true);
  }, [tab, filter]);

  function openAssistant(seed = "") {
    setAssistantSeed(seed.trim());
    setAssistantOpen(true);
  }

  const refresh = useCallback(async () => {
    const reqNum = ++sequence.current;
    try {
      const data = await api<FeedResponse>("/api/listings");
      if (reqNum === sequence.current) {
        setFeed(data);
        setError("");
      }
    } catch (err) {
      if (reqNum === sequence.current) setError(errorMessage(err));
    } finally {
      if (reqNum === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 6000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      sequence.current++;
    };
  }, [refresh]);

  const listings = feed?.listings ?? [];
  const myRequests = listings.filter((l) => l.isOwner);
  const myTasks = listings.filter((l) => l.isParticipant && !l.isOwner);

  const filteredFeed = listings.filter((item) => {
    // Hide own requests from Home feed — Home feed is exclusively for helping neighbours
    if (item.isOwner) return false;
    if (filter !== "all" && item.type !== filter) return false;
    return true;
  });

  return (
    <div className="sdp-phone-canvas">
      {/* Skip link for accessibility */}
      <a href="#main-home" className="skip-link">
        Skip to feed
      </a>

      {/* Screen: New Post */}
      {creating && (
        <CreateListing
          onClose={() => setCreating(false)}
          onAskAssistant={() => {
            setCreating(false);
            openAssistant();
          }}
          onCreated={(newListing) => {
            setCreating(false);
            setNotice("Your listing is live in the township.");
            setTab("activity");
            void refresh();
            setSelectedId(newListing.id);
            setSelectedQrMode("scan");
          }}
        />
      )}

      {/* Screen: Listing Details */}
      {selectedId && !creating && (
        <ListingDetail
          id={selectedId}
          initialQrMode={selectedQrMode}
          onClose={() => {
            setSelectedId(null);
            setSelectedQrMode(null);
          }}
          onAccepted={() => {
            void refresh();
          }}
        />
      )}

      {/* Main Flow Pages (Tab-based) */}
      {!creating && !selectedId && (
        <div className="sdp-screen-container">
          {/* TAB 1: EXACT CLAUDE DESIGN HOMEPAGE */}
          {tab === "home" && (
            <div className="sdp-homepage-view" id="main-home">
              {/* Sime Darby Top Gradient Backing */}
              <div className="sdp-home-header-bg" />

              {/* Main Feed Content Area */}
              <div className="sdp-home-layout">
                {/* Header Group */}
                <header className="sdp-header-titles">
                  <h1 className="sdp-h1-title">Help a neighbour</h1>
                  {/* Accessible heading for E2E tests */}
                  <h2 className="sr-only">Around the neighbourhood</h2>
                  <div className="sdp-precinct-subtitle">
                    {feed?.resident.area || "Demo Township · Precinct 3"}
                  </div>
                </header>

                {/* Ryt-style prompt bar: type a need here, or tap to open the assistant */}
                <form
                  className="sdp-prompt-bar"
                  role="search"
                  aria-label="Ask the Tolong Assistant"
                  onSubmit={(e) => {
                    e.preventDefault();
                    openAssistant(promptText);
                    setPromptText("");
                  }}
                >
                  <span className="sdp-prompt-bar-icon" aria-hidden="true">
                    <Sparkles size={18} />
                  </span>
                  <div className="sdp-prompt-bar-field">
                    {!promptText && (
                      <span className="sdp-prompt-bar-flow" aria-hidden="true">
                        Perlukan bantuan? / Need help? Type here…
                      </span>
                    )}
                    <input
                      id="home-assistant-prompt"
                      className="sdp-prompt-bar-input"
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder=""
                      aria-label="Describe what you need"
                      enterKeyHint="send"
                    />
                  </div>
                  <button
                    type="submit"
                    id="home-assistant-open"
                    className="sdp-prompt-bar-send"
                    aria-label="Open Tolong Assistant"
                  >
                    <ArrowUp size={18} strokeWidth={2.6} />
                  </button>
                </form>
                {/* Filter Pills Row */}
                <div
                  className="sdp-filter-pills-container"
                  role="group"
                  aria-label="Filter by type"
                >
                  {(
                    [
                      ["all", "All"],
                      ["request", "Requests"],
                      ["offer", "Offers"],
                      ["lend", "Lend"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      aria-pressed={filter === val}
                      className={`sdp-pill-button ${
                        filter === val ? "selected" : ""
                      }`}
                      onClick={() => setFilter(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Optional notification toast */}
                {notice && (
                  <div className="sdp-notice-banner" role="status">
                    <span>{notice}</span>
                    <button onClick={() => setNotice("")} aria-label="Dismiss">
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* Loading Skeleton State */}
                {loading && (
                  <div
                    className="sdp-feed-cards-stack"
                    role="status"
                    aria-busy="true"
                    onScroll={handleFeedScroll}
                  >
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="sdp-home-card skeleton-card">
                        <div className="sk-row">
                          <div className="sk sk-chip" />
                          <div className="sk sk-badge" />
                        </div>
                        <div className="sk sk-title" />
                        <div className="sk sk-meta" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {!loading && error && (
                  <div className="sdp-error-screen" role="alert">
                    <h2 className="sdp-state-title">Couldn’t load posts</h2>
                    <p className="sdp-state-sub">Check your connection and try again.</p>
                    <button
                      className="sdp-btn-gradient"
                      onClick={() => void refresh()}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredFeed.length === 0 && (
                  <div className="sdp-empty-screen">
                    <h2 className="sdp-state-title">No posts nearby yet</h2>
                    <p className="sdp-state-sub">
                      Be the first to ask for help or offer something to your neighbours.
                    </p>
                    <button
                      className="sdp-btn-gradient"
                      onClick={() => setCreating(true)}
                    >
                      Post something
                    </button>
                  </div>
                )}

                {/* Feed Cards List (Exact match to screenshot) */}
                {!loading && !error && filteredFeed.length > 0 && (
                  <main
                    className="sdp-feed-cards-stack"
                    onScroll={handleFeedScroll}
                  >
                    {filteredFeed.map((item) => (
                      <ListingCard
                        key={item.id}
                        listing={item}
                        onOpen={() => setSelectedId(item.id)}
                      />
                    ))}
                  </main>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY ACTIVITY */}
          {tab === "activity" && (
            <div className="sdp-feed-view" role="region" aria-label="My Activity">
              <header className="sdp-screen-band activity-band">
                <div className="sdp-band-header">
                  <h1 className="sdp-band-title">My activity</h1>
                </div>
              </header>

              <main className="sdp-feed-body">
                {/* Section 1: My Requests */}
                <div className="sdp-activity-section">
                  <h2 className="sdp-section-heading">My requests</h2>
                  {myRequests.length === 0 ? (
                    <div className="sdp-card text-center py-6 text-stone-500 text-xs">
                      You haven’t posted any requests yet.
                    </div>
                  ) : (
                    myRequests.map((req) => (
                      <div
                        key={req.id}
                        className="sdp-card cursor-pointer"
                        onClick={async () => {
                          if (req.status === "open") {
                            try {
                              await api<unknown>(
                                `/api/listings/${req.id}/simulate-accept`,
                                { method: "POST", body: "{}" },
                              );
                              void refresh();
                            } catch {
                              // ignore
                            }
                          }
                          setSelectedId(req.id);
                          setSelectedQrMode("scan");
                        }}
                      >
                        <div className="sdp-card-top">
                          <span className="sdp-pill-tag bg-red-100 text-red-700">
                            Request · {req.category}
                          </span>
                          <span className="sdp-pill-tag bg-yellow-400 text-stone-900 font-bold">
                            {req.status === "completed"
                              ? "Completed"
                              : req.status === "open"
                                ? "Open"
                                : "Accepted"}
                          </span>
                        </div>
                        <h3 className="sdp-card-title mt-2">{req.title}</h3>
                        <p className="text-xs text-stone-500 mt-1">
                          {req.status === "completed"
                            ? "Handover completed"
                            : req.status === "open"
                              ? `${req.area} · Waiting for a neighbour to accept`
                              : "Neighbour connected · Handover pending"}
                        </p>
                        {req.status !== "completed" && (
                          <div className="flex gap-2 mt-3">
                            <button
                              className="sdp-btn-yellow text-xs flex-1 justify-center py-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(req.id);
                                setSelectedQrMode(
                                  req.status === "open" ? null : "scan",
                                );
                              }}
                            >
                              {req.status === "open"
                                ? "View listing"
                                : "Scan helper’s QR"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Section 2: My Tasks */}
                <div className="sdp-activity-section mt-6">
                  <h2 className="sdp-section-heading">My tasks</h2>
                  {myTasks.length === 0 ? (
                    <div className="sdp-card text-center py-6 text-stone-500 text-xs">
                      You haven’t accepted any neighbour tasks yet.
                    </div>
                  ) : (
                    myTasks.map((task) => (
                      <div
                        key={task.id}
                        className="sdp-card cursor-pointer"
                        onClick={() => {
                          setSelectedId(task.id);
                          setSelectedQrMode(
                            task.status === "completed" ? null : "show",
                          );
                        }}
                      >
                        <div className="sdp-card-top">
                          <span className="sdp-pill-tag bg-yellow-100 text-stone-900">
                            Helping with · {task.category}
                          </span>
                          <span className="sdp-pill-tag bg-yellow-400 text-stone-900 font-bold">
                            {task.status === "completed"
                              ? "Done"
                              : "In progress"}
                          </span>
                        </div>
                        <h3 className="sdp-card-title mt-2">{task.title}</h3>
                        <p className="text-xs text-stone-500 mt-1">
                          {task.timing} · +{task.pointsReward} pts
                        </p>
                        {task.status !== "completed" && (
                          <div className="flex gap-2 mt-3">
                            <button
                              className="sdp-btn-dark-pill text-xs px-4 py-2 flex-1 justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(task.id);
                                setSelectedQrMode("show");
                              }}
                            >
                              Show QR
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </main>
            </div>
          )}

          {/* TAB 3: REWARDS */}
          {tab === "rewards" && <RewardsPanel isScreen={true} />}

          {/* TAB 4: PROFILE */}
          {tab === "profile" && (
            <ProfilePanel
              resident={feed?.resident}
              listings={feed ? feed.listings : undefined}
              onSignOut={onSignOut}
            />
          )}

          {/* Bottom Frosted Blur Shield (Keeps content under tab bar blurred and impossible to see through) */}
          <div
            className={`sdp-bottom-blur-scrim ${
              !isTabBarVisible ? "is-hidden" : ""
            }`}
            aria-hidden="true"
          />

          {/* FLOATING CURVED BOTTOM TAB BAR (Exact Match to Claude Design) */}
          <nav
            className={`sdp-bottom-nav-bar ${
              !isTabBarVisible ? "is-hidden" : ""
            }`}
            aria-label="Mobile navigation"
          >
            {/* 1. Home */}
            <button
              className={`sdp-nav-item ${tab === "home" ? "active" : ""}`}
              onClick={() => setTab("home")}
              aria-current={tab === "home" ? "page" : undefined}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
              </svg>
              <span>Home</span>
            </button>

            {/* 2. Activity */}
            <button
              className={`sdp-nav-item ${tab === "activity" ? "active" : ""}`}
              onClick={() => setTab("activity")}
              aria-current={tab === "activity" ? "page" : undefined}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span>Activity</span>
            </button>

            {/* 3. Center Raised Yellow Post Button */}
            <button
              className="sdp-nav-post-button"
              onClick={() => setCreating(true)}
              aria-label="Post to your neighbourhood"
            >
              <span className="sdp-post-circle-icon">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="sdp-post-text">Post</span>
            </button>

            {/* 4. Rewards */}
            <button
              className={`sdp-nav-item ${tab === "rewards" ? "active" : ""}`}
              onClick={() => setTab("rewards")}
              aria-current={tab === "rewards" ? "page" : undefined}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />
              </svg>
              <span>Rewards</span>
            </button>

            {/* 5. Profile */}
            <button
              className={`sdp-nav-item ${tab === "profile" ? "active" : ""}`}
              onClick={() => setTab("profile")}
              aria-current={tab === "profile" ? "page" : undefined}
            >
              <span className="sdp-profile-circle-silhouette">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="9" r="4.5" />
                  <path d="M3 24a9 9 0 0 1 18 0z" />
                </svg>
              </span>
              <span>Profile</span>
            </button>
          </nav>

          {/* Bilingual AI Assistant for Seniors & Residents */}
          <TolongAssistant
            isOpen={assistantOpen}
            initialMessage={assistantSeed}
            onClose={() => {
              setAssistantOpen(false);
              setAssistantSeed("");
            }}
            onListingCreated={async () => {
              await refresh();
              setNotice("Permintaan bantuan berjaya disiarkan!");
              window.setTimeout(() => setNotice(""), 4000);
            }}
          />
        </div>
      )}
    </div>
  );
}
