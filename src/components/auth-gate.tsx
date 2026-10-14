"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Marketplace } from "./marketplace";

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    function updateSession(nextSession: Session | null) {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) window.location.replace("/login");
    }
    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (authError) {
        if (active) setError("We couldn’t restore your session. Please sign in again.");
        return;
      }
      updateSession(data.session);
    }).catch(() => {
      if (active) setError("We couldn’t connect. Please reload or sign in again.");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      updateSession(nextSession);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return (
      <main className="auth-shell">
        {error ? (
          <div role="alert">{error} <a href="/login">Sign in</a></div>
        ) : <p role="status">Opening the neighbourhood…</p>}
      </main>
    );
  }
  return <Marketplace onSignOut={async () => {
    const { error: authError } = await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
    if (authError) throw authError;
    window.location.replace("/login");
  }} />;
}
