"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type { Redemption, RewardsResponse } from "@/lib/types";
import { Modal } from "./modal";

export function RewardsPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      setData(await api<RewardsResponse>("/api/rewards"));
      setError("");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function redeem(rewardId: string) {
    setBusy(rewardId);
    setNotice("");
    try {
      const result = await api<Redemption>(`/api/rewards/${rewardId}/redeem`, {
        method: "POST",
        body: "{}",
      });
      setNotice(`Reward redeemed for ${result.pointsSpent} points.`);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal title="Neighbourhood rewards" onClose={onClose}>
      <div className="modal-content rewards-content">
        <div className="points-balance">
          <Sparkles size={24} />
          <div><span>Your points</span><strong>{data?.balance ?? "—"}</strong></div>
        </div>
        <p>Points are demo currency only and have no cash value.</p>
        {notice && <div className="notice" role="status">{notice}</div>}
        {error && <div className="error-box" role="alert">{error}</div>}
        {!data && !error && <p role="status">Loading rewards…</p>}
        <div className="reward-grid">
          {data?.rewards.map((reward) => (
            <article className="reward-card" key={reward.id}>
              <Gift size={24} />
              <span className="demo-tag">DEMO</span>
              <h3>{reward.title}</h3>
              <p>{reward.description}</p>
              <div><strong>{reward.pointsCost} points</strong><span>{reward.stock} left</span></div>
              <button
                className="primary-button full-width"
                disabled={busy !== null || reward.stock < 1 || (data?.balance ?? 0) < reward.pointsCost}
                onClick={() => void redeem(reward.id)}
              >
                {busy === reward.id ? "Redeeming…" : "Redeem reward"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </Modal>
  );
}
