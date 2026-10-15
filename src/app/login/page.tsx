import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { isGoogleSignInEnabled } from "@/lib/supabase/providers";
import "./login.css";

export const metadata: Metadata = { title: "Sign in · Tolong" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  oauth_failed: "Google sign-in wasn’t completed. Please try again.",
  not_configured:
    "Supabase sign-in is not configured for this deployment. Please contact the demo team.",
  reset_failed: "That reset link didn’t work. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; recovery?: string | string[] }>;
}) {
  const [params, user, googleEnabled] = await Promise.all([
    searchParams,
    getCurrentUser(),
    isGoogleSignInEnabled(),
  ]);
  const errorKey = typeof params.error === "string" ? params.error : "";
  const recovery = params.recovery === "1";

  return (
    <div className="sdp-phone-canvas login-phone">
      <a href="#login-title" className="skip-link">
        Skip to sign in
      </a>
      <div className="login-band" aria-hidden="true" />
      <main className="login-screen">
        <header className="login-hero">
          <h1 id="login-title">Tolong</h1>
          <p>Neighbours helping neighbours</p>
        </header>
        <LoginForm
          enabled={Boolean(getSupabaseConfig())}
          googleEnabled={googleEnabled}
          accountLabel={user ? user.email || "Your Tolong account" : null}
          initialError={errors[errorKey] || ""}
          recoveryReady={recovery && Boolean(user)}
          recoveryMissing={recovery && !user}
        />
      </main>
    </div>
  );
}
