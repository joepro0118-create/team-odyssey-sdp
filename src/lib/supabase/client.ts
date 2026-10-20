"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export const REMEMBER_ME_KEY = "tolong_remember_me";
export const REMEMBERED_EMAIL_KEY = "tolong_remembered_email";
export const ACTIVE_TAB_SESSION_KEY = "tolong_session_active";

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(REMEMBER_ME_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setRememberMePreference(remember: boolean, email?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMEMBER_ME_KEY, remember ? "1" : "0");
    window.sessionStorage.setItem(ACTIVE_TAB_SESSION_KEY, "1");
    if (remember && email) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    } else if (!remember) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch {
    // Ignore storage errors in restricted browsing modes
  }
}

export function getRememberedEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Sign-in is not configured yet.");
  const remember = isRememberMeEnabled();
  return createBrowserClient(config.url, config.publishableKey, {
    cookieOptions: remember
      ? { maxAge: 60 * 60 * 24 * 30, sameSite: "lax", path: "/" }
      : { maxAge: undefined, sameSite: "lax", path: "/" },
  });
}
