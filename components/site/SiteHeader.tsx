import Link from "next/link";
import { getRequestUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { buttonStyles } from "@/components/ui/button";

export default async function SiteHeader() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    try {
      signedIn = Boolean(await getRequestUser());
    } catch {
      signedIn = false;
    }
  }
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-ink">
          Stage<span className="text-brand">craft</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link href="/venues" className="rounded-[10px] px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-muted hover:text-ink">Find a venue</Link>
          {signedIn ? (
            <>
              <Link href="/dashboard" className={buttonStyles("primary", "sm")}>Dashboard</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="rounded-[10px] px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-muted hover:text-ink">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className={buttonStyles("primary", "sm")}>Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
