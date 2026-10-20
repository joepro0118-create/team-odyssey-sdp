"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  ACTIVE_TAB_SESSION_KEY,
  isRememberMeEnabled,
} from "@/lib/supabase/client";
import { Marketplace } from "./marketplace";

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof getSupabaseBrowserClient>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      window.location.replace("/login");
      return;
    }

    function updateSession(nextSession: Session | null) {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        window.location.replace("/login");
      } else {
        try {
          window.sessionStorage.setItem(ACTIVE_TAB_SESSION_KEY, "1");
        } catch {
          // Ignore sessionStorage errors
        }
      }
    }

    void supabase.auth
      .getSession()
      .then(async ({ data, error: authError }) => {
        if (authError) {
          if (active) {
            setError("We couldn’t restore your session. Please sign in again.");
          }
          return;
        }
        // If "Remember me" was turned off and this is a fresh browser session, sign out.
        let activeTab = true;
        try {
          activeTab =
            window.sessionStorage.getItem(ACTIVE_TAB_SESSION_KEY) === "1";
        } catch {
          activeTab = true;
        }
        if (data.session && !isRememberMeEnabled() && !activeTab) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          updateSession(null);
          return;
        }
        updateSession(data.session);
      })
      .catch(() => {
        if (active) {
          setError("We couldn’t connect. Please reload or sign in again.");
        }
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
          <div role="alert">
            {error} <a href="/login">Sign in</a>
          </div>
        ) : (
          <p role="status">Opening the neighbourhood…</p>
        )}
      </main>
    );
  }

  return (
    <Marketplace
      onSignOut={async () => {
        try {
          window.sessionStorage.removeItem(ACTIVE_TAB_SESSION_KEY);
        } catch {
          // Ignore storage errors
        }
        const { error: authError } = await getSupabaseBrowserClient().auth.signOut({
          scope: "local",
        });
        if (authError) throw authError;
        window.location.replace("/login");
      }}
    />
  );
}
