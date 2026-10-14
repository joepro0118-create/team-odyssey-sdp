import type { Metadata } from "next";
import {
  ArrowLeft,
  HandHeart,
  HeartHandshake,
  Leaf,
  Sprout,
} from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import "./login.css";

export const metadata: Metadata = { title: "Sign in · Tolong" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  oauth_failed: "Google sign-in wasn’t completed. Please try again.",
  not_configured:
    "Account sign-in isn’t available yet. You can still explore the demo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const initialError =
    typeof params.error === "string" ? errors[params.error] || "" : "";

  return (
    <div className="login-shell">
      <a href="#login-title" className="skip-link">
        Skip to sign in
      </a>
      <header className="login-header">
        <a className="brand" href="/" aria-label="Tolong home">
          <span className="brand-symbol">
            <HeartHandshake size={25} strokeWidth={1.7} />
          </span>
          <span>
            tolong<span className="brand-dot">.</span>
          </span>
        </a>
        <a className="login-back" href="/">
          <ArrowLeft size={16} /> Back to neighbourhood
        </a>
      </header>
      <main className="login-layout">
        <section className="login-story" aria-labelledby="login-story-title">
          <span className="login-story-tag">
            <Sprout size={16} /> SMALL ACTS. STRONGER COMMUNITIES.
          </span>
          <h2 id="login-story-title">
            A little help.
            <br />A place to <em>belong.</em>
          </h2>
          <p>
            Borrow a tool. Share a skill. Lend a hand.
            <br />
            Good things start with the people nearby.
          </p>
          <div className="login-scene" aria-hidden="true">
            <svg viewBox="0 0 580 300" fill="none">
              <ellipse cx="290" cy="148" rx="211" ry="139" fill="#E7ECDA" />
              <circle cx="390" cy="65" r="30" fill="#EEDDAA" />
              <path
                d="M61 265c79-24 350-19 452 2"
                stroke="#ABB89C"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M111 250V153"
                stroke="#71885D"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <ellipse cx="111" cy="157" rx="37" ry="54" fill="#A4B790" />
              <path
                d="M111 205v-57m0 36-18-14m18-7 17-15"
                stroke="#71885D"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect
                x="155"
                y="129"
                width="121"
                height="127"
                rx="4"
                fill="#E7D9BD"
              />
              <path d="m145 134 70-58 73 58" fill="#B48868" />
              <path
                d="m145 134 70-58 73 58"
                stroke="#B48868"
                strokeWidth="9"
                strokeLinejoin="round"
              />
              <rect
                x="176"
                y="159"
                width="27"
                height="32"
                rx="3"
                fill="#FCF9EF"
              />
              <path
                d="M189.5 159v32M176 175h27"
                stroke="#CFBFA1"
                strokeWidth="2"
              />
              <rect
                x="228"
                y="210"
                width="27"
                height="46"
                rx="13.5"
                fill="#B49A76"
              />
              <rect
                x="288"
                y="156"
                width="134"
                height="100"
                rx="4"
                fill="#98AD83"
              />
              <path d="m275 158 78-61 82 61" fill="#496947" />
              <path
                d="m275 158 78-61 82 61"
                stroke="#496947"
                strokeWidth="9"
                strokeLinejoin="round"
              />
              <rect
                x="308"
                y="184"
                width="28"
                height="28"
                rx="3"
                fill="#F7F4DC"
              />
              <path
                d="M322 184v28M308 198h28"
                stroke="#92A378"
                strokeWidth="2"
              />
              <rect
                x="364"
                y="203"
                width="30"
                height="53"
                rx="15"
                fill="#587753"
              />
              <circle cx="386" cy="233" r="2" fill="#F1DD9F" />
              <path
                d="M461 254v-86"
                stroke="#7C905F"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <circle cx="461" cy="167" r="35" fill="#C0CB9E" />
              <path
                d="M461 206v-43m0 22 15-12"
                stroke="#8B9C70"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M203 257c11 17 25 28 41 37m134-38c-5 17-12 24-22 36"
                stroke="#D3CFB9"
                strokeWidth="10"
              />
              <circle cx="263" cy="218" r="9" fill="#BE8C6A" />
              <path
                d="M263 231v25m0-18-13 9m13-9 12 5m-12 13-8 18m8-18 7 18"
                stroke="#586F50"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <circle cx="294" cy="224" r="8" fill="#CDA47D" />
              <path
                d="M294 236v22m0-16-15 1m15-1 9 8m-9 8-7 16m7-16 8 16"
                stroke="#C29D69"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M46 92h16m-8-8v16m454-4h14m-7-7v14"
                stroke="#A3B386"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M278 74c-13-11-22 3 0 17 22-14 13-28 0-17Z"
                fill="#C8A080"
              />
            </svg>
            <span className="login-scene-note">
              <HandHeart size={20} /> Someone nearby is glad you’re here.
            </span>
          </div>
          <div className="login-values">
            <span>
              <HeartHandshake size={18} /> Help close to home
            </span>
            <span>
              <Leaf size={18} /> Share a little more
            </span>
          </div>
        </section>
        <LoginForm
          enabled={Boolean(getSupabaseConfig())}
          accountLabel={user ? user.email || "Your Tolong account" : null}
          initialError={initialError}
        />
      </main>
      <footer className="login-footer">
        <span>Made for neighbours, by neighbours.</span>
        <span>Tolong · Community demo</span>
      </footer>
    </div>
  );
}
