"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Gift, Sparkles, Tag } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type { Redemption, RewardsResponse } from "@/lib/types";

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
  const [redeemed, setRedeemed] = useState<{
    title: string;
    code: string;
    points: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await api<RewardsResponse>("/api/rewards"));
      setError("");
    } catch (reason) {
      setError(errorMessage(reason));
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
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(null);
    }
  }

  const balance = data?.balance ?? 140;
  const estimatedRm = (balance * 0.1).toFixed(0);

  return (
    <div className="sdp-screen-view" role="region" aria-label="Township Rewards">
      {/* Top red-orange gradient band */}
      <div className="sdp-screen-band rewards-band">
        <div className="sdp-band-header">
          {onClose && (
            <button
              onClick={onClose}
              className="sdp-back-btn"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="sdp-band-title">Rewards</h1>
        </div>
      </div>

      <div className="sdp-screen-body">
        {error && <div className="sdp-error-banner">{error}</div>}

        {/* Voucher confirmation modal / card */}
        {redeemed && (
          <div className="sdp-card sdp-voucher-modal">
            <div className="voucher-header">
              <CheckCircle2 size={32} className="text-green-600" />
              <div>
                <h3 className="font-bold text-base">Voucher Redeemed!</h3>
                <p className="text-xs text-stone-500">
                  Present this at township merchant or management office.
                </p>
              </div>
            </div>
            <div className="voucher-code-box">
              <span className="voucher-title">{redeemed.title}</span>
              <span className="voucher-code">{redeemed.code}</span>
              <span className="voucher-sub">
                Spent {redeemed.points} demo points · Single use
              </span>
            </div>
            <button
              className="sdp-btn-gradient full-width"
              onClick={() => setRedeemed(null)}
            >
              Done
            </button>
          </div>
        )}

        {/* Balance Card matching 6_Points_and_rewards */}
        <div className="sdp-card sdp-balance-card">
          <div className="balance-label">Your community balance</div>
          <div className="balance-pts">{balance} pts</div>
          <div className="balance-rm">
            ≈ RM {estimatedRm} in local township vouchers
          </div>
        </div>

        {/* Available Perks section */}
        <div className="sdp-perks-section">
          <h2 className="sdp-perks-heading">Available perks</h2>

          {!data && !error && (
            <div className="sdp-loading-center">
              <div className="sdp-spinner" />
              <p>Loading township rewards...</p>
            </div>
          )}

          {data && data.rewards.length === 0 && (
            <p className="sdp-rewards-fineprint">
              No demo perks are available right now.
            </p>
          )}

          <div className="sdp-perks-list">
            {data?.rewards.map((reward) => (
              <div className="sdp-card sdp-perk-item" key={reward.id}>
                <div className="perk-details">
                  <h3 className="perk-title">{reward.title}</h3>
                  <p className="perk-sub">{reward.description}</p>
                </div>
                <div className="perk-action-col">
                  <span className="sdp-points-chip">
                    {reward.pointsCost} pts
                  </span>
                  <button
                    className="sdp-btn-redeem"
                    disabled={
                      busy !== null ||
                      reward.stock < 1 ||
                      balance < reward.pointsCost
                    }
                    onClick={() => void redeem(reward.id, reward.title)}
                  >
                    {busy === reward.id ? "Redeeming..." : "Redeem"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fine print */}
        <p className="sdp-rewards-fineprint">
          Demo township rewards. Points are simulated currency for the Sime
          Darby Property Hackathon and cannot be exchanged for real cash.
        </p>
      </div>
    </div>
  );
}
