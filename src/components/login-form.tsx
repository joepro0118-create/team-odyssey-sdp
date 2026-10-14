"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.43h11a9.4 9.4 0 0 1-4.08 6.17v5h6.61c3.86-3.55 6.08-8.79 6.08-14.68Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.51 0 10.13-1.82 13.51-4.94l-6.61-5c-1.83 1.23-4.18 1.98-6.9 1.98-5.32 0-9.84-3.59-11.46-8.43H5.73v5.16A20.4 20.4 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.54 27.61A12.2 12.2 0 0 1 11.9 24c0-1.25.22-2.47.64-3.61v-5.16H5.73A20 20 0 0 0 3.6 24c0 3.24.78 6.29 2.13 8.77l6.81-5.16Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.96c3 0 5.7 1.03 7.83 3.04l5.88-5.88A19.7 19.7 0 0 0 24 4 20.4 20.4 0 0 0 5.73 15.23l6.81 5.16c1.62-4.84 6.14-8.43 11.46-8.43Z"
      />
    </svg>
  );
}

type Props = {
  enabled: boolean;
  accountLabel: string | null;
  initialError: string;
};

export function LoginForm({ enabled, accountLabel, initialError }: Props) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState<"email" | "google" | "signout" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const unavailable = !enabled || busy !== null;

  async function signInWithGoogle() {
    if (unavailable) return;
    setBusy("google");
    setError("");
    try {
      const { data, error: authError } =
        await createClient().auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: new URL(
              "/auth/callback",
              window.location.origin,
            ).toString(),
            queryParams: { prompt: "select_account" },
            skipBrowserRedirect: true,
          },
        });
      if (authError || !data.url) throw new Error("Google sign-in failed");
      window.location.assign(data.url);
    } catch {
      setError(
        "Google sign-in is unavailable right now. Please try again later.",
      );
      setBusy(null);
    }
  }

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unavailable) return;
    const values = new FormData(event.currentTarget);
    setBusy("email");
    setError("");
    try {
      const { error: authError } = await createClient().auth.signInWithPassword(
        {
          email: String(values.get("email") || "").trim(),
          password: String(values.get("password") || ""),
        },
      );
      if (authError) {
        setError(
          authError.code === "invalid_credentials"
            ? "That email and password don’t match. Please try again."
            : authError.code === "email_not_confirmed"
              ? "Please confirm your email before signing in."
              : "We couldn’t sign you in. Please try again later.",
        );
        setBusy(null);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("We couldn’t connect. Check your connection and try again.");
      setBusy(null);
    }
  }

  async function signOut() {
    if (unavailable) return;
    setBusy("signout");
    setError("");
    try {
      const { error: authError } = await createClient().auth.signOut({
        scope: "local",
      });
      if (authError) throw authError;
      window.location.assign("/login");
    } catch {
      setError("We couldn’t sign you out. Please try again.");
      setBusy(null);
    }
  }

  if (accountLabel) {
    return (
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-account-icon">
          <CheckCircle2 size={30} />
        </div>
        <p className="login-eyebrow">YOUR TOLONG ACCOUNT</p>
        <h1 id="login-title">Good to see you.</h1>
        <p className="login-account-label">
          Signed in as <strong>{accountLabel}</strong>
        </p>
        <p className="login-setup-note">
          Your account is connected. Marketplace activity is still a demo with
          fictional residents and listings.
        </p>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <a className="login-submit" href="/">
          Explore the neighbourhood <ArrowRight size={18} />
        </a>
        <button
          className="login-guest"
          onClick={() => void signOut()}
          disabled={busy !== null}
        >
          {busy === "signout" ? (
            <LoaderCircle className="login-spinner" size={17} />
          ) : (
            <LogOut size={17} />
          )}
          {busy === "signout" ? "Signing out…" : "Sign out"}
        </button>
      </section>
    );
  }

  return (
    <section
      className="login-card"
      aria-labelledby="login-title"
      aria-busy={busy !== null}
    >
      <p className="login-eyebrow">A LITTLE CLOSER TO HOME</p>
      <h1 id="login-title">
        Welcome back,
        <br />
        <em>neighbour.</em>
      </h1>
      <p className="login-intro">A helping hand is just around the corner.</p>

      {!enabled && (
        <p className="login-setup-note" id="login-setup" role="status">
          Account sign-in is coming soon. You can explore the demo without an
          account.
        </p>
      )}
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="login-google"
        type="button"
        disabled={unavailable}
        aria-describedby={!enabled ? "login-setup" : undefined}
        onClick={() => void signInWithGoogle()}
      >
        {busy === "google" ? (
          <LoaderCircle className="login-spinner" size={20} />
        ) : (
          <GoogleMark />
        )}
        {busy === "google" ? "Opening Google…" : "Continue with Google"}
      </button>

      <div className="login-divider">
        <span>or sign in with email</span>
      </div>

      <form onSubmit={(event) => void signInWithEmail(event)}>
        <fieldset
          disabled={unavailable}
          aria-describedby={!enabled ? "login-setup" : undefined}
        >
          <legend className="sr-only">
            Sign in with your email and password
          </legend>
          <label className="login-field" htmlFor="login-email">
            Email address
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
            />
          </label>
          <label className="login-field" htmlFor="login-password">
            Password
          </label>
          <div className="login-password">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              maxLength={1024}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <button className="login-submit" type="submit">
            {busy === "email" ? "Signing in…" : "Sign in"}
            {busy === "email" ? (
              <LoaderCircle className="login-spinner" size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        </fieldset>
      </form>

      <p className="login-new">
        New here?{" "}
        {enabled
          ? "Use Google to create your account."
          : "Accounts will open when sign-in is ready."}
      </p>
      <a className="login-guest" href="/">
        Explore the demo <ArrowRight size={16} />
      </a>
      <p className="login-demo-note">Fictional listings. Real possibilities.</p>
    </section>
  );
}
