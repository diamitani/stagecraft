import { getRequestUser, isSupabaseConfigured } from "@/lib/supabase/server";
import HeaderNav from "@/components/site/HeaderNav";

/** Reads who is signed in on the server, then hands the interactive nav to the client. */
export default async function SiteHeader() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    try {
      signedIn = Boolean(await getRequestUser());
    } catch {
      signedIn = false;
    }
  }
  return <HeaderNav signedIn={signedIn} />;
}
