"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Marketplace } from "./marketplace";

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        // Guest / demo mode
      });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <Marketplace
      onSignOut={async () => {
        if (session) {
          try {
            await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
          } catch {
            // Ignore sign-out errors
          }
        }
        window.location.assign("/login");
      }}
    />
  );
}
