import { AuthGate } from "@/components/auth-gate";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Home() {
  if (!await getCurrentUser()) redirect("/login");
  return <AuthGate />;
}
