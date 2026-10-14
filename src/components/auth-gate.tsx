"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Marketplace } from "./marketplace";

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [configurationError, setConfigurationError] = useState("");

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      void supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setChecking(false);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setChecking(false);
      });
      return () => data.subscription.unsubscribe();
    } catch (error) {
      setConfigurationError(
        error instanceof Error ? error.message : "Supabase is not configured.",
      );
      setChecking(false);
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              anonymous_label: label.trim() || "Demo Resident",
              area_label: "Demo Township",
            },
          },
        });
        if (error) throw error;
        setMessage(
          "Account created. If email confirmation is enabled, confirm the email before signing in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  if (checking)
    return (
      <main className="auth-shell">
        <p role="status">Opening the neighbourhood…</p>
      </main>
    );
  if (session) {
    return (
      <Marketplace
        onSignOut={async () => {
          await getSupabaseBrowserClient().auth.signOut();
        }}
      />
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="brand-symbol"><HeartHandshake size={28} /></span>
        <p className="eyebrow">TOLONG · DEMO RESIDENT ACCESS</p>
        <h1 id="auth-title">{mode === "signin" ? "Welcome back" : "Join the demo neighbourhood"}</h1>
        <p>Use fictional demo details only. Authentication is provided by Supabase.</p>
        {configurationError ? (
          <div className="error-box" role="alert">{configurationError}</div>
        ) : (
          <form onSubmit={submit}>
            {mode === "signup" && (
              <label className="field">Anonymous display label
                <input value={label} onChange={(event) => setLabel(event.target.value)} minLength={3} maxLength={40} required />
              </label>
            )}
            <label className="field">Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label className="field">Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </label>
            {message && <div className="notice" role="status">{message}</div>}
            <button className="primary-button full-width" disabled={busy} type="submit">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create demo account"}
            </button>
          </form>
        )}
        <button className="text-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
          {mode === "signin" ? "Need a demo account?" : "Already have an account?"}
        </button>
        <p className="privacy-note"><ShieldCheck size={18} />Never use real resident or contact information in this prototype.</p>
      </section>
    </main>
  );
}
