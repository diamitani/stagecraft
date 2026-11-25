import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StagecraftDashboard from "@/components/stagecraft/StagecraftDashboard";
import { getRequestUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { loginHrefFor } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Dashboard | Stagecraft",
  description: "Book venues for your shows, or list your venue and answer booking requests.",
};

// Depends on who is signed in, so it is never cached.
export const dynamic = "force-dynamic";

/** /dashboard: signed in only. Anyone else is sent to sign in and then brought back here. */
export default async function DashboardPage({ searchParams }: { searchParams: { tab?: string; deposit?: string; payouts?: string } }) {
  const tab = searchParams.tab === "venue" || searchParams.tab === "inbox" ? searchParams.tab : "requests";
  const user = isSupabaseConfigured() ? await getRequestUser() : null;
  if (!user) redirect(loginHrefFor(`/dashboard?tab=${tab}`));
  return <StagecraftDashboard initialTab={tab} depositResult={searchParams.deposit ?? null} payoutsResult={searchParams.payouts ?? null} />;
}
