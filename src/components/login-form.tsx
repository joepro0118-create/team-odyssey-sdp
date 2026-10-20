"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import {
  createClient,
  getRememberedEmail,
  isRememberMeEnabled,
  setRememberMePreference,
} from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

type Mode = "signin" | "signup" | "forgot";

type Props = {
  enabled: boolean;
  googleEnabled: boolean;
  accountLabel: string | null;
  initialError: string;
  recoveryReady: boolean;
  recoveryMissing: boolean;
};

export function LoginForm({
  enabled,
  googleEnabled,
  accountLabel,
  initialError,
  recoveryReady,
  recoveryMissing,
}: Props) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState<"email" | "google" | "signout" | "reset" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [rememberMe, setRememberMe] = useState(true);
  const [defaultEmail, setDefaultEmail] = useState("");
  const [notice, setNotice] = useState(
    recoveryMissing
      ? "That reset link has expired. Request a new one."
      : "",
  );
  const [invalid, setInvalid] = useState(false);
  const unavailable = !enabled || busy !== null;

  useEffect(() => {
    setRememberMe(isRememberMeEnabled());
    setDefaultEmail(getRememberedEmail());
  }, []);

  async function signInWithGoogle() {
    if (unavailable || !googleEnabled) return;
    setBusy("google");
    setError("");
    setRememberMePreference(rememberMe);
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
    const email = String(values.get("email") || "").trim();
    setBusy("email");
    setError("");
    setNotice("");
    setInvalid(false);
    try {
      if (mode === "forgot") {
        const { error: resetError } =
          await createClient().auth.resetPasswordForEmail(email, {
            redirectTo: new URL("/auth/reset", window.location.origin).toString(),
          });
        if (resetError) {
          setError("We couldn’t send a reset link. Please try again later.");
          setInvalid(true);
          setBusy(null);
          return;
        }
        setNotice(
          "If an account exists for that email, a reset link is on its way.",
        );
        setBusy(null);
        return;
      }
      setRememberMePreference(rememberMe, email);
      if (mode === "signup") {
        const { data, error: signupError } = await createClient().auth.signUp({
          email,
          password: String(values.get("password") || ""),
          options: {
            data: {
              anonymous_label: String(values.get("label") || "").trim(),
              area_label: "Demo Township",
            },
          },
        });
        if (signupError) {
          setError(signupError.message);
          setInvalid(true);
          setBusy(null);
          return;
        }
        if (data.session) {
          window.location.assign("/");
          return;
        }
        setNotice(
          "If sign-up is available for this address, confirm your email before signing in. For fictional .test addresses, ask the demo team for a confirmed test account.",
        );
        setBusy(null);
        return;
      }
      const { error: authError } = await createClient().auth.signInWithPassword(
        {
          email,
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
        setInvalid(true);
        setBusy(null);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("We couldn’t connect. Check your connection and try again.");
      setBusy(null);
    }
  }

  async function saveNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unavailable) return;
    const password = String(new FormData(event.currentTarget).get("password") || "");
    setBusy("reset");
    setError("");
    setInvalid(false);
    try {
      const { error: updateError } = await createClient().auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        setInvalid(true);
        setBusy(null);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("We couldn’t save that password. Please try again.");
      setInvalid(true);
      setBusy(null);
    }
  }

  async function signOut() {
    if (busy !== null) return;
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

  if (recoveryReady) {
    return (
      <section className="login-card" aria-labelledby="login-title">
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={(event) => void saveNewPassword(event)}>
          <label className={`login-field${invalid ? " is-invalid" : ""}`} htmlFor="login-new-password">
            New password
            <input
              id="login-new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Choose a new password"
              required
              minLength={6}
              maxLength={1024}
              aria-invalid={invalid}
            />
          </label>
          <button className="login-submit" type="submit" disabled={busy !== null}>
            {busy === "reset" ? "Saving…" : "Save password"}
          </button>
        </form>
      </section>
    );
  }

  if (accountLabel) {
    return (
      <section className="login-card" aria-labelledby="login-title">
        <p className="login-account-copy">You’re signed in.</p>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <a className="login-submit" href="/">
          Explore the neighbourhood
        </a>
        <button
          className="login-text-button"
          type="button"
          onClick={() => void signOut()}
          disabled={busy !== null}
        >
          {busy === "signout" ? "Signing out…" : "Log out"}
        </button>
      </section>
    );
  }

  const submitLabel =
    busy === "email"
      ? "Please wait…"
      : mode === "signup"
        ? "Create an account"
        : mode === "forgot"
          ? "Send reset link"
          : "Sign in";

  return (
    <>
      <section
        className="login-card"
        aria-labelledby="login-title"
        aria-busy={busy !== null}
      >
        {!enabled && (
          <p className="login-note" id="login-setup" role="status">
            Supabase sign-in is not configured for this deployment. Please
            contact the demo team.
          </p>
        )}
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="login-note" role="status">
            {notice}
          </p>
        )}

        {mode === "signin" && (
          <>
            <button
              className={`login-google${!googleEnabled ? " is-unavailable" : ""}`}
              type="button"
              disabled={unavailable || !googleEnabled}
              aria-describedby={!googleEnabled ? "google-setup" : undefined}
              onClick={() => void signInWithGoogle()}
            >
              {busy === "google" ? (
                <LoaderCircle className="login-spinner" size={20} />
              ) : (
                <GoogleMark />
              )}
              {busy === "google" ? "Opening Google…" : "Continue with Google"}
            </button>
            {!googleEnabled && (
              <p className="login-note" id="google-setup">
                Google sign-in is not available yet. Use your email and password.
              </p>
            )}
            <div className="login-divider">
              <span>or sign in with email</span>
            </div>
          </>
        )}

        <form onSubmit={(event) => void signInWithEmail(event)}>
          <fieldset disabled={unavailable}>
            <legend className="sr-only">
              {mode === "signup"
                ? "Create a fictional demo account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Sign in with your email and password"}
            </legend>
            {mode === "signup" && (
              <label
                className={`login-field${invalid ? " is-invalid" : ""}`}
                htmlFor="login-label"
              >
                Anonymous display label
                <input
                  id="login-label"
                  name="label"
                  placeholder="A first name is enough"
                  minLength={3}
                  maxLength={40}
                  required
                  autoComplete="off"
                  aria-invalid={invalid}
                />
              </label>
            )}
            <label
              className={`login-field${invalid ? " is-invalid" : ""}`}
              htmlFor="login-email"
            >
              Email
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue={defaultEmail}
                required
                maxLength={254}
                aria-invalid={invalid}
              />
            </label>
            {mode !== "forgot" && (
              <div className={`login-field${invalid ? " is-invalid" : ""}`}>
                <label htmlFor="login-password">Password</label>
                <span className="login-password">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="Your password"
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    maxLength={1024}
                    aria-invalid={invalid}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </div>
            )}
            {mode !== "forgot" && (
              <label className="login-remember" htmlFor="login-remember">
                <input
                  id="login-remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me on this device</span>
              </label>
            )}
            <button className="login-submit" type="submit">
              {submitLabel}
            </button>
          </fieldset>
        </form>

        {mode === "signin" && (
          <button
            className="login-text-button"
            type="button"
            disabled={unavailable}
            onClick={() => {
              setMode("forgot");
              setError("");
              setNotice("");
              setInvalid(false);
            }}
          >
            Forgot password?
          </button>
        )}
        {mode !== "signin" && (
          <button
            className="login-text-button"
            type="button"
            disabled={unavailable}
            onClick={() => {
              setMode("signin");
              setError("");
              setNotice("");
              setInvalid(false);
            }}
          >
            Already have an account? Sign in
          </button>
        )}
      </section>

      {mode === "signin" && (
        <div className="login-signup">
          <p>New to Tolong?</p>
          <button
            className="login-outline"
            type="button"
            disabled={unavailable}
            onClick={() => {
              setMode("signup");
              setError("");
              setNotice("");
              setInvalid(false);
            }}
          >
            Create an account
          </button>
        </div>
      )}
      {mode === "signup" && (
        <p className="login-footnote">
          Use a fictional first name. Tolong never asks for your real full name.
        </p>
      )}
    </>
  );
}
