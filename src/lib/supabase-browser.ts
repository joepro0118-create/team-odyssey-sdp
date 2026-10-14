"use client";

// Login, OAuth callback, and API calls share the same cookie-backed session.
export { createClient as getSupabaseBrowserClient } from "./supabase/client";
