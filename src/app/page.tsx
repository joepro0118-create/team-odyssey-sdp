import { redirect } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await getCurrentUser())) redirect("/login");
  return <AuthGate />;
}
