"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import {
  clearStaffSession,
  getStaffSession,
  type StaffSession,
} from "@/lib/staff-session";
import type { OperatorDashboardSummary } from "@/lib/types";

type RangeKey = "week" | "month";
type TabKey = "overview" | "requests" | "points" | "settings";
type FilterKey = "open" | "waiting" | "done";
type LangKey = "en" | "bm";

type KpiItem = {
  label: string;
  value: string;
  delta: string;
  ref: string;
  target?: string;
  series: number[];
  warn?: boolean;
};

type PeriodData = {
  kpis: KpiItem[];
  cats: [string, number][];
  catNote: string;
  heroSummary: string;
  labels: string[];
  posted: number[];
  done: number[];
  step: number;
  ledger: [string, string][];
  safety: [string, string, boolean][];
};

const DASHBOARD_DATA: Record<RangeKey, PeriodData> = {
  week: {
    kpis: [
      {
        label: "Time to first help",
        value: "1.6 h",
        delta: "▼ 0.8 h faster",
        ref: "vs 2.4 h last week",
        target: "Target: under 2 h. On track.",
        series: [3.5, 3.3, 3.1, 2.9, 2.8, 2.4, 2.4, 1.6],
      },
      {
        label: "Neighbours who helped",
        value: "26",
        delta: "▲ 4 more",
        ref: "vs 22 last week",
        series: [14, 16, 17, 19, 20, 22, 22, 26],
      },
      {
        label: "Easy mode requests answered",
        value: "14",
        delta: "▲ 1 more",
        ref: "vs 13 last week",
        series: [9, 10, 11, 11, 12, 13, 13, 14],
      },
      {
        label: "Completed and confirmed by QR",
        value: "38",
        delta: "▼ 2 fewer",
        ref: "vs 40 last week",
        series: [26, 28, 31, 35, 30, 34, 40, 38],
      },
      {
        label: "Unmet over 24 hours",
        value: "4",
        delta: "▲ 2 more",
        ref: "vs 2 last week",
        series: [1, 2, 1, 2, 3, 2, 2, 4],
        warn: true,
      },
    ],
    cats: [
      ["Groceries", 18],
      ["Tech help", 11],
      ["Carry and fix", 11],
      ["Errands", 8],
      ["Borrow a tool", 5],
    ],
    catNote: "53 requests posted this week.",
    heroSummary: "53 posted · 38 completed",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    posted: [6, 8, 7, 9, 12, 8, 3],
    done: [4, 5, 5, 6, 9, 6, 3],
    step: 4,
    ledger: [
      ["Issued", "760"],
      ["Redeemed", "240"],
      ["Still held by residents", "2,180"],
    ],
    safety: [
      ["Prescription-medicine posts blocked", "3", false],
      ["Posts held for staff review", "2", true],
      ["Reports from residents", "1", true],
      ["QR handovers confirmed", "38 of 41", false],
    ],
  },
  month: {
    kpis: [
      {
        label: "Time to first help",
        value: "2.3 h",
        delta: "▼ 0.9 h faster",
        ref: "vs 3.2 h in the previous 4 weeks",
        target: "Target: under 2 h. Getting closer.",
        series: [3.5, 3.3, 3.1, 2.9, 2.8, 2.4, 2.4, 1.6],
      },
      {
        label: "Neighbours who helped",
        value: "71",
        delta: "▲ 13 more",
        ref: "vs 58 in the previous 4 weeks",
        series: [14, 16, 17, 19, 20, 22, 22, 26],
      },
      {
        label: "Easy mode requests answered",
        value: "52",
        delta: "▲ 11 more",
        ref: "vs 41 in the previous 4 weeks",
        series: [9, 10, 11, 11, 12, 13, 13, 14],
      },
      {
        label: "Completed and confirmed by QR",
        value: "142",
        delta: "▲ 22 more",
        ref: "vs 120 in the previous 4 weeks",
        series: [26, 28, 31, 35, 30, 34, 40, 38],
      },
      {
        label: "Unmet over 24 hours",
        value: "4",
        delta: "▲ 2 more",
        ref: "vs 2 four weeks ago",
        series: [1, 2, 1, 2, 3, 2, 2, 4],
        warn: true,
      },
    ],
    cats: [
      ["Groceries", 64],
      ["Tech help", 41],
      ["Carry and fix", 38],
      ["Errands", 29],
      ["Borrow a tool", 17],
    ],
    catNote: "189 requests posted in the last 4 weeks.",
    heroSummary: "189 posted · 142 completed",
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    posted: [41, 46, 49, 53],
    done: [30, 34, 40, 38],
    step: 20,
    ledger: [
      ["Issued", "2,840"],
      ["Redeemed", "900"],
      ["Still held by residents", "2,180"],
    ],
    safety: [
      ["Prescription-medicine posts blocked", "11", false],
      ["Posts held for staff review", "7", true],
      ["Reports from residents", "3", true],
      ["QR handovers confirmed", "142 of 151", false],
    ],
  },
};

const PRECINCT_DATA: [string, number][] = [
  ["Precinct 1", 2],
  ["Precinct 2", 1],
  ["Precinct 3", 4],
  ["Precinct 4", 1],
  ["Precinct 5", 4],
];

type RequestQueueItem = {
  id: string;
  cat: string;
  precinct: string;
  time: string;
  status: "waiting" | "open" | "done";
};

const INITIAL_REQUESTS: RequestQueueItem[] = [
  { id: "a", cat: "Groceries", precinct: "Precinct 3", time: "Waiting 30 h", status: "waiting" },
  { id: "b", cat: "Tech help", precinct: "Precinct 5", time: "Waiting 27 h", status: "waiting" },
  { id: "c", cat: "Groceries", precinct: "Precinct 3", time: "Waiting 26 h", status: "waiting" },
  { id: "d", cat: "Tech help", precinct: "Precinct 5", time: "Waiting 25 h", status: "waiting" },
  { id: "e", cat: "Groceries", precinct: "Precinct 1", time: "Posted 18 h ago", status: "open" },
  { id: "f", cat: "Carry and fix", precinct: "Precinct 5", time: "Posted 12 h ago", status: "open" },
  { id: "g", cat: "Errands", precinct: "Precinct 5", time: "Posted 9 h ago", status: "open" },
  { id: "h", cat: "Tech help", precinct: "Precinct 3", time: "Posted 8 h ago", status: "open" },
  { id: "i", cat: "Carry and fix", precinct: "Precinct 3", time: "Posted 6 h ago", status: "open" },
  { id: "j", cat: "Errands", precinct: "Precinct 2", time: "Posted 5 h ago", status: "open" },
  { id: "k", cat: "Groceries", precinct: "Precinct 1", time: "Posted 3 h ago", status: "open" },
  { id: "l", cat: "Borrow a tool", precinct: "Precinct 4", time: "Posted 2 h ago", status: "open" },
  { id: "m", cat: "Groceries", precinct: "Precinct 2", time: "Done 2 h ago", status: "done" },
  { id: "n", cat: "Errands", precinct: "Precinct 3", time: "Done 4 h ago", status: "done" },
  { id: "o", cat: "Tech help", precinct: "Precinct 4", time: "Done 6 h ago", status: "done" },
];

const RECENT_ACTIVITY = [
  { what: "Post held for staff review", meta: "Precinct 5 · 35 min ago", warn: true },
  { what: "Handover confirmed by QR", meta: "Groceries · Precinct 2 · 2 h ago", warn: false },
  { what: "Request completed", meta: "Errands · Precinct 3 · 4 h ago", warn: false },
  { what: "Prescription-medicine post blocked", meta: "Precinct 1 · 5 h ago", warn: false },
  { what: "Easy mode request answered", meta: "Tech help · Precinct 4 · 6 h ago", warn: false },
];

function buildSparkPoints(vals: number[]): string {
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  return vals
    .map(
      (v, i) =>
        `${((i * 100) / (vals.length - 1)).toFixed(1)},${(
          25 -
          ((v - mn) / rng) * 22
        ).toFixed(1)}`,
    )
    .join(" ");
}

export default function ManagementDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [, setLiveSummary] = useState<OperatorDashboardSummary | null>(null);

  const [range, setRange] = useState<RangeKey>("week");
  const [tab, setTab] = useState<TabKey>("overview");
  const [filter, setFilter] = useState<FilterKey>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [alerts, setAlerts] = useState({
    over24: true,
    daily: true,
    weekly: false,
  });
  const [catOn, setCatOn] = useState<Record<string, boolean>>({
    g: true,
    t: true,
    c: true,
    e: true,
    b: true,
  });
  const [pts, setPts] = useState(20);
  const [lang, setLang] = useState<LangKey>("en");
  const [hoverIdx, setHoverIdx] = useState(-1);

  useEffect(() => {
    const activeSession = getStaffSession();
    if (!activeSession) {
      router.replace("/dashboard/login");
      return;
    }
    setSession(activeSession);
    setCheckingAuth(false);

    // Optionally fetch live operator summary from the backend / preview store
    void api<OperatorDashboardSummary>("/api/operator/summary")
      .then((summary) => setLiveSummary(summary))
      .catch(() => {
        // Keep base simulated dataset if unauthenticated or offline
      });
  }, [router]);

  function handleLogout() {
    clearStaffSession();
    router.push("/dashboard/login");
  }

  if (checkingAuth || !session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EFEDEB",
          color: "#6B6063",
          fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
          fontSize: "15px",
          fontWeight: 700,
        }}
      >
        Checking staff session…
      </div>
    );
  }

  const week = range === "week";
  const d = week ? DASHBOARD_DATA.week : DASHBOARD_DATA.month;

  const NEUTRAL = "#3B3235";
  const GRAD =
    "linear-gradient(115deg,#C8102E 0%,#C8102E 45%,#E8602A 72%,#FFC72C 100%)";
  const BAR = "linear-gradient(90deg,#C8102E,#E8602A)";

  // Chart geometry
  const n = d.posted.length;
  const maxV = Math.max(...d.posted);
  const yMax = (Math.floor(maxV / d.step) + 1) * d.step;
  const px = (i: number) => (20 + (i * 560) / (n - 1)).toFixed(1);
  const py = (v: number) => (10 + (1 - v / yMax) * 200).toFixed(1);
  const ptsStr = (arr: number[]) =>
    arr.map((v, i) => `${px(i)},${py(v)}`).join(" ");
  const postedPts = ptsStr(d.posted);
  const donePts = ptsStr(d.done);
  const areaPts = `${postedPts} ${px(n - 1)},210 ${px(0)},210`;

  const hv = hoverIdx >= 0 && hoverIdx < n ? hoverIdx : -1;
  const colW = (560 / (n - 1) / 600) * 100;
  const tipLeft = hv >= 0 ? (Number(px(hv)) / 600) * 100 : 0;
  const yTicks = [yMax, yMax / 2, 0];

  // Category breakdown
  const totalCats = d.cats.reduce((acc, c) => acc + c[1], 0);
  const maxCat = Math.max(...d.cats.map((c) => c[1]));

  // Follow-up state
  const followNow = (id: string) => {
    setFollowed((prev) => ({ ...prev, [id]: true }));
  };
  const waitingReqs = INITIAL_REQUESTS.filter((r) => r.status === "waiting");
  const followCount = waitingReqs.filter((r) => !followed[r.id]).length;
  const hasFollowUps = followCount > 0;
  const allCaughtUp = followCount === 0;

  // Filtered rows for Requests tab
  const q = searchQuery.trim().toLowerCase();
  const filteredRows = INITIAL_REQUESTS.filter((r) =>
    filter === "open"
      ? r.status !== "done"
      : filter === "waiting"
        ? r.status === "waiting"
        : r.status === "done",
  ).filter(
    (r) => !q || `${r.cat} ${r.precinct}`.toLowerCase().includes(q),
  );

  const titles: Record<TabKey, [string, string]> = {
    overview: [
      "Overview",
      week
        ? "This week in Demo Township, compared with last week"
        : "The last 4 weeks in Demo Township, compared with the 4 before",
    ],
    requests: [
      "Requests",
      'Anonymous queue. "Follow up" asks nearby verified volunteers to step in (demo).',
    ],
    points: [
      "Points and safety",
      "Rewards activity and the checks that keep Tolong safe",
    ],
    settings: [
      "Settings",
      "Township preferences, alerts and your staff account",
    ],
  };

  const [pageTitle, pageSub] = titles[tab];
  const showRange = tab === "overview" || tab === "points";
  const showSearchBtn = tab !== "requests";

  const navButtonStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minHeight: "52px",
    padding: "0 14px",
    border: 0,
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: 800,
    background: active ? "#C8102E" : "transparent",
    color: active ? "#fff" : "#3B3235",
    cursor: "pointer",
  });

  const switchTrackStyle = (on: boolean): React.CSSProperties => ({
    flex: "none",
    width: "56px",
    height: "32px",
    boxSizing: "border-box",
    padding: "4px",
    border: 0,
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: on ? "flex-end" : "flex-start",
    background: on ? "#C8102E" : "#C9C2C0",
    cursor: "pointer",
  });

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "20px",
    boxShadow:
      "0 1px 2px rgba(27,20,22,0.06),0 8px 24px rgba(27,20,22,0.05)",
    border: 0,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        minHeight: "900px",
        boxSizing: "border-box",
        display: "flex",
        background: "#EFEDEB",
        color: "#1B1416",
        fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Left Sidebar Navigation */}
      <nav
        aria-label="Dashboard"
        style={{
          width: "248px",
          flex: "none",
          boxSizing: "border-box",
          background: "#fff",
          color: "#1B1416",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: "4px 0 24px rgba(27,20,22,0.06)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 8px 20px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "#C8102E",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1.1 }}>
              Tolong
            </div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#6B6063" }}>
              Township staff
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#6B6063",
            padding: "0 12px 4px",
          }}
        >
          MENU
        </div>

        <button
          type="button"
          onClick={() => setTab("overview")}
          style={navButtonStyle(tab === "overview")}
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
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span style={{ flex: 1, textAlign: "left" }}>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("requests")}
          style={navButtonStyle(tab === "requests")}
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
            <path d="M9 6h11M9 12h11M9 18h11" />
            <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
          </svg>
          <span style={{ flex: 1, textAlign: "left" }}>Requests</span>
          {hasFollowUps && (
            <span
              aria-label="Requests needing follow-up"
              style={{
                background: "#FFC72C",
                color: "#1B1416",
                fontSize: "12px",
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: "999px",
              }}
            >
              {followCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("points")}
          style={navButtonStyle(tab === "points")}
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
            <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span style={{ flex: 1, textAlign: "left" }}>Points and safety</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("settings")}
          style={navButtonStyle(tab === "settings")}
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
          <span style={{ flex: 1, textAlign: "left" }}>Settings</span>
        </button>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              background: "#EFEDEB",
              borderRadius: "16px",
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 800 }}>
              Demo Township
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#6B6063",
                marginTop: "2px",
              }}
            >
              Precincts 1 to 5
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              minHeight: "48px",
              borderRadius: "999px",
              border: "2px solid #E3DEDB",
              background: "#fff",
              boxSizing: "border-box",
              color: "#1B1416",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: "84px",
            flex: "none",
            boxSizing: "border-box",
            background: GRAD,
            color: "#fff",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 800,
                textTransform: "uppercase",
                lineHeight: 1.15,
              }}
            >
              {pageTitle}
            </h1>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#fff",
                opacity: 0.92,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {pageSub}
            </div>
          </div>

          {showSearchBtn && (
            <button
              type="button"
              onClick={() => setTab("requests")}
              aria-label="Search requests"
              style={{
                width: "230px",
                minHeight: "44px",
                boxSizing: "border-box",
                border: 0,
                borderRadius: "999px",
                background: "#fff",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#6B6063",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <span style={{ flex: 1, textAlign: "left" }}>
                Search requests
              </span>
            </button>
          )}

          {showRange && (
            <div
              style={{
                background: "#fff",
                borderRadius: "999px",
                padding: "4px",
                display: "flex",
                gap: "4px",
              }}
            >
              {(
                [
                  ["week", "This week"],
                  ["month", "Last 4 weeks"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRange(key);
                    setHoverIdx(-1);
                  }}
                  style={{
                    background: range === key ? "#C8102E" : "transparent",
                    color: range === key ? "#fff" : "#1B1416",
                    minHeight: "36px",
                    padding: "0 16px",
                    border: 0,
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <span
            style={{
              background: "#FFC72C",
              color: "#1B1416",
              fontSize: "12px",
              fontWeight: 800,
              padding: "8px 12px",
              borderRadius: "999px",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            DEMO DATA
          </span>

          <button
            type="button"
            onClick={() => setTab("settings")}
            aria-label="Open settings, signed in as township staff"
            style={{
              width: "44px",
              height: "44px",
              border: 0,
              borderRadius: "50%",
              background: "#fff",
              color: "#C8102E",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            TS
          </button>
        </header>

        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "24px 32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && (
            <>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "grid",
                  gridTemplateColumns: "1.5fr repeat(4, minmax(0, 1fr))",
                  gap: "16px",
                }}
              >
                {d.kpis.map((k, i) => {
                  const primary = i === 0;
                  const warn = Boolean(k.warn);
                  return (
                    <li
                      key={k.label}
                      style={{
                        ...cardStyle,
                        boxSizing: "border-box",
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        minHeight: "182px",
                        ...(primary
                          ? {
                              background: GRAD,
                              color: "#fff",
                              boxShadow: "0 8px 24px rgba(200,16,46,0.28)",
                            }
                          : warn
                            ? {
                                background: "#FFF1BF",
                                border: "2px solid #FFC72C",
                              }
                            : {}),
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: primary ? "#fff" : "#3B3235",
                            ...(primary ? {} : { minHeight: "34px" }),
                          }}
                        >
                          {k.label}
                        </div>
                        {warn && (
                          <span
                            aria-hidden="true"
                            style={{
                              width: "20px",
                              height: "20px",
                              flex: "none",
                              borderRadius: "50%",
                              background: "#C8102E",
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            !
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 800,
                          lineHeight: 1.1,
                          marginTop: "2px",
                          color: primary
                            ? "#fff"
                            : warn
                              ? "#C8102E"
                              : "#1B1416",
                          fontSize: primary ? "56px" : "38px",
                        }}
                      >
                        {k.value}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: primary
                            ? "#fff"
                            : warn
                              ? "#C8102E"
                              : "#1B1416",
                        }}
                      >
                        {k.delta}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.35,
                          fontWeight: 500,
                          color: primary ? "#fff" : "#6B6063",
                        }}
                      >
                        {k.ref}
                      </div>
                      {primary && k.target && (
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#fff",
                            marginTop: "2px",
                          }}
                        >
                          {k.target}
                        </div>
                      )}
                      <svg
                        viewBox="0 0 100 28"
                        preserveAspectRatio="none"
                        style={{
                          width: "100%",
                          height: "30px",
                          display: "block",
                          marginTop: "auto",
                          paddingTop: "8px",
                        }}
                        aria-hidden="true"
                      >
                        <polyline
                          points={buildSparkPoints(k.series)}
                          fill="none"
                          stroke={primary ? "#fff" : "#C8102E"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </li>
                  );
                })}
              </ul>

              {/* Middle Row: Chart + Needs Attention */}
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  gridTemplateColumns: alerts.over24
                    ? "minmax(0, 1.9fr) minmax(0, 1fr)"
                    : "minmax(0, 1fr)",
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#3B3235",
                      }}
                    >
                      Requests posted and completed
                    </div>
                    <div
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#6B6063",
                      }}
                    >
                      {d.heroSummary}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      height: "270px",
                      marginTop: "6px",
                    }}
                  >
                    <ul
                      style={{
                        listStyle: "none",
                        margin: 0,
                        width: "28px",
                        flex: "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "5px 0",
                        textAlign: "right",
                        fontSize: "12px",
                        lineHeight: "14px",
                        fontWeight: 600,
                        color: "#6B6063",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {yTicks.map((val) => (
                        <li key={val}>{val}</li>
                      ))}
                    </ul>

                    <div
                      style={{
                        position: "relative",
                        flex: 1,
                        minWidth: 0,
                        height: "270px",
                      }}
                      onMouseLeave={() => setHoverIdx(-1)}
                    >
                      <svg
                        viewBox="0 0 600 220"
                        preserveAspectRatio="none"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: "100%",
                          height: "270px",
                          display: "block",
                        }}
                        role="img"
                        aria-label={`Line chart of requests posted and completed. ${d.heroSummary}.`}
                      >
                        <line
                          x1="0"
                          x2="600"
                          y1="10"
                          y2="10"
                          stroke="#E3DEDB"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                        <line
                          x1="0"
                          x2="600"
                          y1="110"
                          y2="110"
                          stroke="#E3DEDB"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                        <line
                          x1="0"
                          x2="600"
                          y1="210"
                          y2="210"
                          stroke="#C9C2C0"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                        <polygon
                          points={areaPts}
                          fill="#C8102E"
                          fillOpacity="0.08"
                        />
                        <polyline
                          points={donePts}
                          fill="none"
                          stroke="#1B1416"
                          strokeWidth="3"
                          strokeDasharray="7 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                        <polyline
                          points={postedPts}
                          fill="none"
                          stroke="#C8102E"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      {d.labels.map((lab, i) => (
                        <button
                          key={lab}
                          type="button"
                          aria-label={`${lab}: ${d.posted[i]} posted, ${d.done[i]} completed`}
                          onMouseEnter={() => setHoverIdx(i)}
                          onFocus={() => setHoverIdx(i)}
                          onBlur={() => setHoverIdx(-1)}
                          style={{
                            position: "absolute",
                            top: 0,
                            height: "270px",
                            padding: 0,
                            border: 0,
                            background: "transparent",
                            transform: "translateX(-50%)",
                            left: `${((Number(px(i)) / 600) * 100).toFixed(2)}%`,
                            width: `${colW.toFixed(2)}%`,
                            cursor: "pointer",
                          }}
                        />
                      ))}

                      {hv >= 0 && (
                        <>
                          <div
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              width: "1px",
                              background: "#C9C2C0",
                              pointerEvents: "none",
                              left: `${tipLeft.toFixed(2)}%`,
                            }}
                          />
                          <div
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              width: "12px",
                              height: "12px",
                              margin: "-6px 0 0 -6px",
                              borderRadius: "50%",
                              background: "#C8102E",
                              border: "2px solid #fff",
                              boxSizing: "border-box",
                              pointerEvents: "none",
                              left: `${tipLeft.toFixed(2)}%`,
                              top: `${((Number(py(d.posted[hv])) / 220) * 100).toFixed(2)}%`,
                            }}
                          />
                          <div
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              width: "12px",
                              height: "12px",
                              margin: "-6px 0 0 -6px",
                              borderRadius: "50%",
                              background: "#1B1416",
                              border: "2px solid #fff",
                              boxSizing: "border-box",
                              pointerEvents: "none",
                              left: `${tipLeft.toFixed(2)}%`,
                              top: `${((Number(py(d.done[hv])) / 220) * 100).toFixed(2)}%`,
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              top: "-40px",
                              minWidth: "150px",
                              boxSizing: "border-box",
                              padding: "10px 12px",
                              borderRadius: "12px",
                              background: "#fff",
                              boxShadow: "0 6px 20px rgba(27,20,22,0.18)",
                              pointerEvents: "none",
                              zIndex: 3,
                              left: `${tipLeft.toFixed(2)}%`,
                              transform: `translateX(${
                                hv === 0
                                  ? "-12%"
                                  : hv === n - 1
                                    ? "-88%"
                                    : "-50%"
                              })`,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#6B6063",
                                marginBottom: "4px",
                              }}
                            >
                              {d.labels[hv]}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px",
                                fontWeight: 800,
                              }}
                            >
                              <span
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  background: "#C8102E",
                                }}
                              />
                              Posted{" "}
                              <b
                                style={{
                                  marginLeft: "auto",
                                  paddingLeft: "14px",
                                }}
                              >
                                {d.posted[hv]}
                              </b>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px",
                                fontWeight: 800,
                                marginTop: "2px",
                              }}
                            >
                              <span
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  background: "#1B1416",
                                }}
                              />
                              Completed{" "}
                              <b
                                style={{
                                  marginLeft: "auto",
                                  paddingLeft: "14px",
                                }}
                              >
                                {d.done[hv]}
                              </b>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0 3.3333%",
                      marginLeft: "36px",
                    }}
                  >
                    {d.labels.map((lab) => (
                      <li
                        key={lab}
                        style={{
                          width: 0,
                          display: "flex",
                          justifyContent: "center",
                          whiteSpace: "nowrap",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#3B3235",
                        }}
                      >
                        {lab}
                      </li>
                    ))}
                  </ul>

                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#3B3235",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg width="28" height="8" aria-hidden="true">
                        <line
                          x1="1"
                          y1="4"
                          x2="27"
                          y2="4"
                          stroke="#C8102E"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Posted
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg width="28" height="8" aria-hidden="true">
                        <line
                          x1="1"
                          y1="4"
                          x2="27"
                          y2="4"
                          stroke="#1B1416"
                          strokeWidth="3"
                          strokeDasharray="6 5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Completed and confirmed by QR
                    </span>
                  </div>
                </div>

                {alerts.over24 && (
                  <div
                    style={{
                      ...cardStyle,
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#3B3235",
                        }}
                      >
                        Needs attention
                        {hasFollowUps && (
                          <span
                            style={{
                              background: "#C8102E",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              letterSpacing: 0,
                            }}
                          >
                            {followCount}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTab("requests");
                          setFilter("waiting");
                          setSearchQuery("");
                        }}
                        style={{
                          minHeight: "36px",
                          padding: "0 4px",
                          border: 0,
                          background: "transparent",
                          color: "#C8102E",
                          fontSize: "13px",
                          fontWeight: 800,
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        View all
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#6B6063",
                      }}
                    >
                      Waiting over 24 hours, longest first.
                    </div>

                    <ul
                      style={{
                        listStyle: "none",
                        margin: "6px 0 0",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {waitingReqs.map((qItem) => {
                        const isFollowed = Boolean(followed[qItem.id]);
                        return (
                          <li
                            key={qItem.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "12px 0",
                              borderTop: "1px solid #EFEDEB",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: "10px",
                                height: "10px",
                                flex: "none",
                                borderRadius: "50%",
                                ...(isFollowed
                                  ? {
                                      background: "#fff",
                                      border: "2px solid #1B1416",
                                      boxSizing: "border-box",
                                    }
                                  : { background: "#C8102E" }),
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{ fontSize: "15px", fontWeight: 800 }}
                              >
                                {qItem.cat}
                              </div>
                              <div
                                style={{
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  color: "#6B6063",
                                }}
                              >
                                {qItem.precinct} · {qItem.time}
                              </div>
                            </div>
                            {!isFollowed ? (
                              <button
                                type="button"
                                onClick={() => followNow(qItem.id)}
                                style={{
                                  minHeight: "44px",
                                  padding: "0 16px",
                                  border: 0,
                                  borderRadius: "999px",
                                  background: "#C8102E",
                                  color: "#fff",
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                Follow up
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  border: "2px solid #1B1416",
                                  borderRadius: "999px",
                                  padding: "4px 10px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Following up
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {allCaughtUp && (
                      <div
                        style={{
                          marginTop: "6px",
                          padding: "20px 12px",
                          textAlign: "center",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          fontWeight: 700,
                          color: "#3B3235",
                          background: "#EFEDEB",
                          borderRadius: "14px",
                        }}
                      >
                        All caught up. Staff are following up on every request
                        that waited over 24 hours.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: Categories, Precincts, Recent Activity */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    What neighbours asked for
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "2px 0 0",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {d.cats.map(([catName, count]) => {
                      const share = `${Math.round((count / totalCats) * 100)}%`;
                      const barWidth = `${Math.round((count / maxCat) * 100)}%`;
                      return (
                        <li key={catName}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              fontSize: "14px",
                              fontWeight: 700,
                              marginBottom: "6px",
                            }}
                          >
                            <span>{catName}</span>
                            <span
                              style={{
                                fontVariantNumeric: "tabular-nums",
                                fontSize: "15px",
                                fontWeight: 800,
                              }}
                            >
                              {count}{" "}
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#6B6063",
                                }}
                              >
                                · {share}
                              </span>
                            </span>
                          </div>
                          <div
                            style={{
                              height: "10px",
                              borderRadius: "5px",
                              background: "#E3DEDB",
                            }}
                          >
                            <div
                              style={{
                                height: "10px",
                                borderRadius: "5px",
                                background: BAR,
                                width: barWidth,
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6063",
                      marginTop: "auto",
                    }}
                  >
                    {d.catNote}
                  </div>
                </div>

                <div
                  style={{
                    ...cardStyle,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    Open requests by precinct
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "2px 0 0",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {PRECINCT_DATA.map(([pName, count]) => {
                      const hasFlag = count >= 2;
                      const flagText = count >= 4 ? "High" : "Watch";
                      return (
                        <li key={pName}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              fontSize: "14px",
                              fontWeight: 700,
                              marginBottom: "6px",
                            }}
                          >
                            <span>{pName}</span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {hasFlag && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    borderRadius: "999px",
                                    padding: "2px 8px",
                                    ...(count >= 4
                                      ? { background: "#C8102E", color: "#fff" }
                                      : {
                                          background: "#FFC72C",
                                          color: "#1B1416",
                                        }),
                                  }}
                                >
                                  {flagText}
                                </span>
                              )}
                              <span
                                style={{
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: "15px",
                                  fontWeight: 800,
                                }}
                              >
                                {count}
                              </span>
                            </span>
                          </div>
                          <div
                            style={{
                              height: "10px",
                              borderRadius: "5px",
                              background: "#E3DEDB",
                            }}
                          >
                            <div
                              style={{
                                height: "10px",
                                borderRadius: "5px",
                                background:
                                  count >= 4
                                    ? "#C8102E"
                                    : count >= 2
                                      ? "#FFC72C"
                                      : NEUTRAL,
                                width: `${Math.round((count / 4) * 100)}%`,
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6063",
                      marginTop: "auto",
                    }}
                  >
                    Red: 4 or more open. Yellow: 2 to 3 open.
                  </div>
                </div>

                <div
                  style={{
                    ...cardStyle,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    Recent activity
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "6px 0 0",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {RECENT_ACTIVITY.map((a) => (
                      <li
                        key={a.what}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "10px 0",
                          borderTop: "1px solid #EFEDEB",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: "10px",
                            height: "10px",
                            flex: "none",
                            marginTop: "5px",
                            borderRadius: "50%",
                            ...(a.warn
                              ? {
                                  background: "#FFC72C",
                                  border: "2px solid #1B1416",
                                  boxSizing: "border-box",
                                }
                              : { background: "#C8102E" }),
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              lineHeight: 1.3,
                            }}
                          >
                            {a.what}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#6B6063",
                              marginTop: "2px",
                            }}
                          >
                            {a.meta}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: REQUESTS */}
          {tab === "requests" && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  {(
                    [
                      ["open", "All open (12)"],
                      ["waiting", "Waiting over 24 h (4)"],
                      ["done", "Completed (3)"],
                    ] as const
                  ).map(([fKey, fLabel]) => (
                    <button
                      key={fKey}
                      type="button"
                      onClick={() => setFilter(fKey)}
                      style={{
                        ...(filter === fKey
                          ? {
                              background: "#C8102E",
                              color: "#fff",
                              border: "1px solid #C8102E",
                            }
                          : {
                              background: "#fff",
                              color: "#1B1416",
                              border: "1px solid #E3DEDB",
                            }),
                        minHeight: "44px",
                        padding: "0 20px",
                        borderRadius: "999px",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {fLabel}
                    </button>
                  ))}
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#fff",
                    border: "1px solid #E3DEDB",
                    borderRadius: "12px",
                    padding: "0 16px",
                    minHeight: "48px",
                    width: "320px",
                    boxSizing: "border-box",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6B6063"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search category or precinct"
                    aria-label="Search requests"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 0,
                      outline: 0,
                      background: "transparent",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#1B1416",
                    }}
                  />
                </label>
              </div>

              <div style={{ ...cardStyle, overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "14px 24px",
                    background: "#EFEDEB",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#6B6063",
                  }}
                >
                  <span style={{ width: "170px" }}>Request</span>
                  <span style={{ width: "130px" }}>Precinct</span>
                  <span style={{ width: "170px" }}>Time</span>
                  <span style={{ flex: 1 }}>Status</span>
                  <span style={{ width: "140px", textAlign: "right" }}>
                    Action
                  </span>
                </div>

                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {filteredRows.map((r) => {
                    const isFollowed =
                      r.status === "waiting" && Boolean(followed[r.id]);
                    const tag = isFollowed
                      ? "Staff following up"
                      : r.status === "waiting"
                        ? "Waiting over 24 h"
                        : r.status === "done"
                          ? "Completed"
                          : "Open";
                    const tagColors: React.CSSProperties = isFollowed
                      ? {
                          background: "#fff",
                          color: "#1B1416",
                          borderColor: "#1B1416",
                        }
                      : r.status === "waiting"
                        ? { background: "#C8102E", color: "#fff" }
                        : r.status === "done"
                          ? { background: "#1B1416", color: "#fff" }
                          : { background: "#FFC72C", color: "#1B1416" };
                    const canFollow = r.status === "waiting" && !isFollowed;

                    return (
                      <li
                        key={r.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          padding: "12px 24px",
                          borderTop: "1px solid #EFEDEB",
                          minHeight: "64px",
                          boxSizing: "border-box",
                        }}
                      >
                        <span
                          style={{
                            width: "170px",
                            fontSize: "16px",
                            fontWeight: 800,
                          }}
                        >
                          {r.cat}
                        </span>
                        <span
                          style={{
                            width: "130px",
                            fontSize: "15px",
                            fontWeight: 500,
                          }}
                        >
                          {r.precinct}
                        </span>
                        <span
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            width: "170px",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#3B3235",
                          }}
                        >
                          {r.time}
                        </span>
                        <span style={{ flex: 1 }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "13px",
                              fontWeight: 800,
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: "2px solid transparent",
                              ...tagColors,
                            }}
                          >
                            {tag}
                          </span>
                        </span>
                        <span
                          style={{
                            width: "140px",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          {canFollow && (
                            <button
                              type="button"
                              onClick={() => followNow(r.id)}
                              style={{
                                minHeight: "44px",
                                padding: "0 20px",
                                border: 0,
                                borderRadius: "999px",
                                background: "#C8102E",
                                color: "#fff",
                                fontSize: "14px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              Follow up
                            </button>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {filteredRows.length === 0 && (
                  <div
                    style={{
                      padding: "40px 24px",
                      textAlign: "center",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#6B6063",
                      borderTop: "1px solid #EFEDEB",
                    }}
                  >
                    No requests match. Try another filter or search.
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#6B6063",
                }}
              >
                Requests show category, precinct and time only. Staff never see
                who asked or what they wrote.
              </div>
            </>
          )}

          {/* TAB 3: POINTS AND SAFETY */}
          {tab === "points" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "#C8102E",
                  color: "#fff",
                  borderRadius: "20px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 8px 24px rgba(200,16,46,0.22)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#fff",
                  }}
                >
                  Points ledger
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: "8px 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {d.ledger.map(([label, val]) => (
                    <li
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        padding: "22px 0",
                        borderTop: "1px solid rgba(255,255,255,0.35)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          fontSize: "44px",
                          fontWeight: 800,
                          color: "#fff",
                          lineHeight: 1.1,
                        }}
                      >
                        {val}
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {" "}
                          pts
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.5,
                    fontWeight: 600,
                    color: "#fff",
                    marginTop: "8px",
                  }}
                >
                  Points only. No cash value, no buying or selling. Reward list
                  and values are demo content.
                </div>
              </div>

              <div
                style={{
                  ...cardStyle,
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#3B3235",
                  }}
                >
                  Safety and trust
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: "8px 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {d.safety.map(([what, val, attention]) => (
                    <li
                      key={what}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "20px 0",
                        borderTop: "1px solid #E3DEDB",
                      }}
                    >
                      <span
                        style={{ flex: 1, fontSize: "17px", fontWeight: 700 }}
                      >
                        {what}
                      </span>
                      {attention && (
                        <span
                          style={{
                            background: "#FFC72C",
                            color: "#1B1416",
                            fontSize: "12px",
                            fontWeight: 800,
                            padding: "5px 10px",
                            borderRadius: "999px",
                          }}
                        >
                          Needs review
                        </span>
                      )}
                      <b
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          fontSize: "26px",
                          fontWeight: 800,
                          color: "#1B1416",
                          minWidth: "90px",
                          textAlign: "right",
                        }}
                      >
                        {val}
                      </b>
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.5,
                    fontWeight: 500,
                    color: "#6B6063",
                    marginTop: "8px",
                  }}
                >
                  Posts about prescription medicine are blocked automatically
                  and never shown to neighbours.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {tab === "settings" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    Township
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "8px 0 0",
                      padding: 0,
                    }}
                  >
                    <li
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px 0",
                        borderTop: "1px solid #EFEDEB",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ flex: 1 }}>Township</span>
                      <span style={{ fontWeight: 500, color: "#3B3235" }}>
                        Demo Township
                      </span>
                    </li>
                    <li
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px 0",
                        borderTop: "1px solid #EFEDEB",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ flex: 1 }}>Precincts</span>
                      <span style={{ fontWeight: 500, color: "#3B3235" }}>
                        5 precincts
                      </span>
                    </li>
                    <li
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "12px 0",
                        borderTop: "1px solid #EFEDEB",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ flex: 1 }}>Dashboard language</span>
                      <div
                        style={{
                          background: "#EFEDEB",
                          borderRadius: "999px",
                          padding: "4px",
                          display: "flex",
                          gap: "4px",
                        }}
                      >
                        {(
                          [
                            ["en", "English"],
                            ["bm", "Bahasa Malaysia"],
                          ] as const
                        ).map(([lKey, lLabel]) => (
                          <button
                            key={lKey}
                            type="button"
                            onClick={() => setLang(lKey)}
                            style={{
                              background:
                                lang === lKey ? "#C8102E" : "transparent",
                              color: lang === lKey ? "#fff" : "#1B1416",
                              minHeight: "44px",
                              padding: "0 18px",
                              border: 0,
                              borderRadius: "999px",
                              fontSize: "14px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {lLabel}
                          </button>
                        ))}
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    Alerts
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "8px 0 0",
                      padding: 0,
                    }}
                  >
                    {(
                      [
                        [
                          "over24",
                          "Show waiting requests on the Overview",
                          'Adds the "Needs attention" list for requests waiting over 24 hours.',
                        ],
                        [
                          "daily",
                          "Daily summary",
                          "One short summary each morning.",
                        ],
                        [
                          "weekly",
                          "Weekly report",
                          "Totals by category and precinct.",
                        ],
                      ] as const
                    ).map(([aKey, aLabel, aDesc]) => {
                      const isOn = alerts[aKey];
                      return (
                        <li
                          key={aKey}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "14px 0",
                            borderTop: "1px solid #EFEDEB",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{ fontSize: "16px", fontWeight: 700 }}
                            >
                              {aLabel}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#6B6063",
                                marginTop: "2px",
                              }}
                            >
                              {aDesc}
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isOn}
                            aria-label={aLabel}
                            onClick={() =>
                              setAlerts((prev) => ({
                                ...prev,
                                [aKey]: !prev[aKey],
                              }))
                            }
                            style={switchTrackStyle(isOn)}
                          >
                            <span
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#fff",
                                display: "block",
                              }}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    What neighbours can post
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: "8px 0 0",
                      padding: 0,
                    }}
                  >
                    {(
                      [
                        ["g", "Groceries"],
                        ["t", "Tech help"],
                        ["c", "Carry and fix"],
                        ["e", "Errands"],
                        ["b", "Borrow a tool"],
                      ] as const
                    ).map(([cKey, cLabel]) => {
                      const isOn = Boolean(catOn[cKey]);
                      return (
                        <li
                          key={cKey}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "12px 0",
                            borderTop: "1px solid #EFEDEB",
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              fontSize: "16px",
                              fontWeight: 700,
                            }}
                          >
                            {cLabel}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isOn}
                            aria-label={cLabel}
                            onClick={() =>
                              setCatOn((prev) => ({
                                ...prev,
                                [cKey]: !prev[cKey],
                              }))
                            }
                            style={switchTrackStyle(isOn)}
                          >
                            <span
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#fff",
                                display: "block",
                              }}
                            />
                          </button>
                        </li>
                      );
                    })}
                    <li
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 0",
                        borderTop: "1px solid #EFEDEB",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3B3235"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                      <span
                        style={{ flex: 1, fontSize: "16px", fontWeight: 700 }}
                      >
                        Prescription medicine
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#3B3235",
                          background: "#EFEDEB",
                          padding: "6px 12px",
                          borderRadius: "999px",
                        }}
                      >
                        Always blocked
                      </span>
                    </li>
                  </ul>
                </div>

                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#3B3235",
                    }}
                  >
                    Points and account
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "14px 0",
                      borderTop: "1px solid #EFEDEB",
                      marginTop: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "16px", fontWeight: 700 }}>
                        Points per completed task
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#6B6063",
                          marginTop: "2px",
                        }}
                      >
                        Demo value. Applies to new tasks only.
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPts((p) => Math.max(5, p - 5))}
                        aria-label="Fewer points"
                        style={{
                          width: "44px",
                          height: "44px",
                          border: 0,
                          borderRadius: "50%",
                          background: "#EFEDEB",
                          color: "#1B1416",
                          fontSize: "22px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          minWidth: "64px",
                          textAlign: "center",
                          fontSize: "22px",
                          fontWeight: 800,
                        }}
                      >
                        {pts} pts
                      </span>
                      <button
                        type="button"
                        onClick={() => setPts((p) => Math.min(50, p + 5))}
                        aria-label="More points"
                        style={{
                          width: "44px",
                          height: "44px",
                          border: 0,
                          borderRadius: "50%",
                          background: "#EFEDEB",
                          color: "#1B1416",
                          fontSize: "22px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px 0 0",
                      borderTop: "1px solid #EFEDEB",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#C8102E",
                        color: "#fff",
                        fontSize: "16px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      TS
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "16px", fontWeight: 800 }}>
                        Township staff
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#6B6063",
                        }}
                      >
                        Demo account · Demo Township
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        minHeight: "48px",
                        padding: "0 24px",
                        border: 0,
                        borderRadius: "999px",
                        background: "#C8102E",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "auto",
              paddingTop: "8px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#6B6063",
              textAlign: "center",
            }}
          >
            All figures are demo data for the hackathon prototype. This
            dashboard never shows who asked, who helped, or what they wrote.
          </div>
        </main>
      </div>
    </div>
  );
}
