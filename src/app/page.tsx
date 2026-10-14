import { Marketplace } from "@/components/marketplace";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getCurrentUser();
  return <Marketplace signedIn={Boolean(user)} />;
}
