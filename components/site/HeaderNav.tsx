"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/ui/primitives";
import { buttonStyles } from "@/components/ui/button";
import { ARTISPRENEUR_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Venues", href: "/venues" },
  { label: "Artists", href: "/artists" },
  { label: "How it works", href: "/#how" },
  { label: "Artispreneur", href: ARTISPRENEUR_URL, external: true },
];

/**
 * Slim 58px nav in the Artispreneur style: logo left, links centre, account right.
 * Transparent over the landing hero until the page scrolls.
 */
export default function HeaderNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => !href.startsWith("http") && !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className={cn("sticky top-0 z-50 h-[58px] border-b transition-colors", scrolled || open ? "border-line bg-white/90 backdrop-blur" : "border-transparent bg-white/60 backdrop-blur-sm")}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLockup size={30} />
          <span className="hidden rounded-full border border-line bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand sm:inline">Stagecraft</span>
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener" } : {})}
              aria-current={active(item.href) ? "page" : undefined}
              className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors hover:text-ink", active(item.href) ? "bg-muted text-ink" : "text-ink-soft")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              <Link href="/dashboard" className={buttonStyles("primary", "sm", "rounded-full")}>Dashboard</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink">Sign in</Link>
              <Link href="/dashboard?tab=venue" className={buttonStyles("primary", "sm", "rounded-full")}>List your venue</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav aria-label="Mobile" className="border-b border-line bg-white px-4 pb-5 pt-2 shadow-ap md:hidden">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link href={item.href} {...(item.external ? { target: "_blank", rel: "noopener" } : {})} className="block rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-muted">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
            {signedIn ? (
              <>
                <Link href="/dashboard" className={buttonStyles("primary", "md", "rounded-full")}>Dashboard</Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className={buttonStyles("secondary", "md", "w-full rounded-full")}>Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/dashboard?tab=venue" className={buttonStyles("primary", "md", "rounded-full")}>List your venue</Link>
                <Link href="/login" className={buttonStyles("secondary", "md", "rounded-full")}>Sign in</Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
