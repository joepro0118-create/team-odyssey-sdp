import type { Metadata } from "next";
import { RewardsPanel } from "@/components/rewards-panel";

export const metadata: Metadata = {
  title: "Awards & Community Perks · Tolong",
  description:
    "Redeem your community points for verified township perks and local merchant vouchers.",
};

export default function AwardPage() {
  return (
    <div className="sdp-phone-canvas">
      <div className="sdp-screen-container">
        <RewardsPanel />
      </div>
    </div>
  );
}
