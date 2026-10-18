"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Coffee,
  Copy,
  Gift,
  HelpCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type { Redemption, Reward, RewardsResponse } from "@/lib/types";

function getRewardCategory(title: string, desc: string): {
  id: string;
  label: string;
  icon: "coffee" | "trophy" | "users" | "gift";
} {
  const text = `${title} ${desc}`.toLowerCase();
  if (/café|coffee|drink|tea|beverage|food|meal|snack/i.test(text)) {
    return { id: "food", label: "Food & Drink", icon: "coffee" };
  }
  if (/sport|court|fitness|gym|game|tennis|badminton/i.test(text)) {
    return { id: "sports", label: "Sports & Fitness", icon: "trophy" };
  }
  if (/family|activity|park|community|workshop|event/i.test(text)) {
    return { id: "community", label: "Community", icon: "users" };
  }
  return { id: "perk", label: "Township Perk", icon: "gift" };
}

export function RewardsPanel({
  onClose,
  isScreen = false,
}: {
  onClose?: () => void;
  isScreen?: boolean;
}) {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showEarnGuide, setShowEarnGuide] = useState(false);
  const [redeemed, setRedeemed] = useState<{
    title: string;
    code: string;
    points: number;
  } | null>(null);

  const refresh = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api<RewardsResponse>("/api/rewards");
      setData(res);
      setError("");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function redeem(rewardId: string, title: string) {
    setBusy(rewardId);
    setError("");
    try {
      const result = await api<Redemption>(`/api/rewards/${rewardId}/redeem`, {
        method: "POST",
        body: "{}",
      });
      setRedeemed({
        title,
        code: `SDP-${Math.floor(100000 + Math.random() * 900000)}`,
        points: result.pointsSpent,
      });
      setCopiedCode(false);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(null);
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const isLoading = !data && !error;
  const balance = data?.balance;

  // Filter rewards by search and category
  const filteredRewards = useMemo(() => {
    if (!data?.rewards) return [];
    return data.rewards.filter((reward) => {
      const cat = getRewardCategory(reward.title, reward.description);
      if (selectedCategory !== "all" && cat.id !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = reward.title.toLowerCase().includes(q);
        const matchesDesc = reward.description.toLowerCase().includes(q);
        const matchesCat = cat.label.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [data?.rewards, selectedCategory, searchQuery]);

  // Contributor tier calculation for mobile phones
  const currentPts = balance ?? 0;
  const tierInfo = useMemo(() => {
    if (currentPts >= 250) {
      return {
        name: "Champion",
        badgeColor: "bg-yellow-400 text-stone-950 font-extrabold",
        progress: 100,
        nextTier: "Top tier reached!",
      };
    }
    if (currentPts >= 100) {
      return {
        name: "Silver",
        badgeColor: "bg-amber-100 text-amber-900 border border-amber-200",
        progress: Math.min(100, Math.round(((currentPts - 100) / 150) * 100)),
        nextTier: `${250 - currentPts} pts to Champion`,
      };
    }
    return {
      name: "Helper",
      badgeColor: "bg-stone-200 text-stone-800",
      progress: Math.min(100, Math.round((currentPts / 100) * 100)),
      nextTier: `${100 - currentPts} pts to Silver`,
    };
  }, [currentPts]);

  return (
    <div
      className="sdp-screen-view rewards-view"
      role="region"
      aria-label="Township Rewards"
    >
      {/* Mobile Header Band — adapts smoothly from 320px to 440px phone widths */}
      <div className="sdp-screen-band rewards-band">
        <div className="rewards-band-header">
          <div className="flex items-center gap-2.5 min-w-0">
            {onClose && (
              <button
                onClick={onClose}
                className="sdp-back-btn"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="sdp-band-title">Rewards</h1>
                <span className="rewards-sdp-badge">Sime Darby</span>
              </div>
              <p className="rewards-band-sub">
                Redeem verified township perks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refresh(true)}
            className="rewards-refresh-btn"
            title="Refresh points"
            aria-label="Refresh points balance"
            disabled={refreshing}
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="sdp-screen-body rewards-screen-body">
        {error && <div className="sdp-error-banner">{error}</div>}

        {/* Mobile Voucher Confirmation Card / Modal */}
        {redeemed && (
          <div
            className="sdp-voucher-backdrop"
            onClick={() => setRedeemed(null)}
          >
            <div
              className="sdp-card sdp-voucher-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="voucher-header">
                <CheckCircle2 size={32} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-stone-900 leading-tight">
                    Voucher Redeemed!
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Present at township merchant or management office.
                  </p>
                </div>
              </div>

              <div className="voucher-code-box">
                <span className="voucher-title">{redeemed.title}</span>
                <span className="voucher-code">{redeemed.code}</span>
                <button
                  type="button"
                  className="voucher-copy-btn"
                  onClick={() => void handleCopyCode(redeemed.code)}
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <span className="voucher-sub">
                  Spent {redeemed.points} demo points · Single use
                </span>
              </div>

              <button
                className="sdp-btn-gradient full-width mt-1"
                onClick={() => setRedeemed(null)}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Mobile Balance Card — scales cleanly on 320px, 375px, 390px, 428px */}
        <div className="sdp-card sdp-balance-card rewards-mobile-balance">
          <div className="balance-top-row">
            <span className="balance-label flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              Community balance
            </span>
            <span className={`rewards-tier-badge ${tierInfo.badgeColor}`}>
              {tierInfo.name}
            </span>
          </div>

          <div className="balance-pts-row">
            <div className="balance-pts">
              {isLoading ? (
                <span className="opacity-40 animate-pulse">··· pts</span>
              ) : (
                `${balance ?? 0} pts`
              )}
            </div>
            <span className="balance-equiv-tag">
              ≈ RM {Math.round((currentPts / 10) * 10) / 10}
            </span>
          </div>

          {/* Progress bar towards next tier */}
          <div className="balance-progress-track" aria-hidden="true">
            <div
              className="balance-progress-fill"
              style={{ width: `${tierInfo.progress}%` }}
            />
          </div>
          <div className="balance-next-info">
            <span>{tierInfo.nextTier}</span>
            <button
              type="button"
              className="balance-info-link"
              onClick={() => setShowEarnGuide((v) => !v)}
            >
              <HelpCircle size={11} className="inline mr-1" />
              {showEarnGuide ? "Hide tips" : "How to earn"}
            </button>
          </div>

          {/* Collapsible Mobile Earning Tips */}
          {showEarnGuide && (
            <div className="mobile-earn-tips">
              <div className="earn-tip-item">
                <span className="tip-bullet" />
                <span>Help a neighbour with groceries or repairs: <strong>+20 to +50 pts</strong></span>
              </div>
              <div className="earn-tip-item">
                <span className="tip-bullet" />
                <span>Safe in-person confirmation via QR code handover</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Category Scroll & Search Bar */}
        <div className="rewards-mobile-controls">
          <div className="rewards-category-scroll">
            <button
              type="button"
              className={`rewards-cat-btn ${
                selectedCategory === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`rewards-cat-btn ${
                selectedCategory === "food" ? "active" : ""
              }`}
              onClick={() => setSelectedCategory("food")}
            >
              <Coffee size={12} />
              <span>Café & Food</span>
            </button>
            <button
              type="button"
              className={`rewards-cat-btn ${
                selectedCategory === "sports" ? "active" : ""
              }`}
              onClick={() => setSelectedCategory("sports")}
            >
              <Trophy size={12} />
              <span>Sports</span>
            </button>
            <button
              type="button"
              className={`rewards-cat-btn ${
                selectedCategory === "community" ? "active" : ""
              }`}
              onClick={() => setSelectedCategory("community")}
            >
              <Users size={12} />
              <span>Community</span>
            </button>
          </div>

          {/* Search box formatted for mobile phones */}
          <div className="rewards-search-box">
            <Search size={14} className="text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search perks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rewards-search-input"
              aria-label="Search available perks"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rewards-search-clear"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Available Perks section */}
        <div className="sdp-perks-section">
          <div className="perks-heading-row">
            <h2 className="sdp-perks-heading">Available perks</h2>
            {data && (
              <span className="perks-count-badge">
                {filteredRewards.length} available
              </span>
            )}
          </div>

          {!data && !error && (
            <div className="sdp-loading-center">
              <div className="sdp-spinner" />
              <p>Loading township rewards...</p>
            </div>
          )}

          {data && filteredRewards.length === 0 && (
            <div className="rewards-empty-state">
              <Gift size={32} className="text-stone-400 mb-2" />
              <p className="font-bold text-stone-700 text-sm">No perks found</p>
              <p className="text-xs text-stone-500 mt-1">
                Try selecting "All" or clearing search keywords.
              </p>
              {(selectedCategory !== "all" || searchQuery) && (
                <button
                  type="button"
                  className="rewards-reset-btn"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          )}

          {/* Mobile Perk Cards List — 1 column mobile cards tailored for all phone widths */}
          <div className="mobile-perks-list">
            {filteredRewards.map((reward) => {
              const cat = getRewardCategory(reward.title, reward.description);
              const canAfford =
                balance !== undefined && balance >= reward.pointsCost;
              const isOutOfStock = reward.stock < 1;
              const pointsNeeded =
                balance !== undefined && !canAfford
                  ? reward.pointsCost - balance
                  : 0;

              return (
                <div
                  className={`sdp-card sdp-perk-card ${
                    !canAfford ? "perk-card-locked" : ""
                  }`}
                  key={reward.id}
                >
                  <div className="perk-card-header">
                    <span className="perk-category-tag">
                      {cat.icon === "coffee" && <Coffee size={11} />}
                      {cat.icon === "trophy" && <Trophy size={11} />}
                      {cat.icon === "users" && <Users size={11} />}
                      {cat.icon === "gift" && <Gift size={11} />}
                      <span>{cat.label}</span>
                    </span>

                    <span
                      className={`perk-stock-tag ${
                        isOutOfStock ? "stock-out" : "stock-ok"
                      }`}
                    >
                      {isOutOfStock
                        ? "Out of stock"
                        : `${reward.stock} left`}
                    </span>
                  </div>

                  <div className="perk-card-body">
                    <h3 className="perk-title">{reward.title}</h3>
                    <p className="perk-sub">{reward.description}</p>
                  </div>

                  <div className="perk-card-footer">
                    <div className="perk-cost-group">
                      <span className="sdp-points-chip">
                        <Sparkles size={11} className="inline mr-1" />
                        {reward.pointsCost} pts
                      </span>
                      {!canAfford && balance !== undefined && (
                        <span className="perk-need-hint">
                          Need {pointsNeeded} more
                        </span>
                      )}
                    </div>

                    <button
                      className={`sdp-btn-redeem ${
                        !canAfford || isOutOfStock ? "is-disabled" : ""
                      }`}
                      disabled={
                        busy !== null ||
                        isOutOfStock ||
                        balance === undefined ||
                        !canAfford
                      }
                      onClick={() => void redeem(reward.id, reward.title)}
                      aria-label={`Redeem ${reward.title} for ${reward.pointsCost} points`}
                    >
                      {busy === reward.id ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="sdp-btn-spinner" />
                          Redeeming...
                        </span>
                      ) : isOutOfStock ? (
                        "Sold out"
                      ) : !canAfford ? (
                        "Not enough pts"
                      ) : (
                        "Redeem"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fine print demo notice for hackathon */}
        <div className="sdp-rewards-fineprint-card">
          <p className="sdp-rewards-fineprint">
            <strong>Demo Rewards</strong> · Points are simulated currency for the
            Sime Darby Property Hackathon. Vouchers are demo items for
            township facilities.
          </p>
        </div>
      </div>
    </div>
  );
}
