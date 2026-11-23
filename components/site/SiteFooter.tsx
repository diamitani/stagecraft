import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-muted">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Stagecraft. Where artists and venues book shows.</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/venues" className="hover:text-ink">Find a venue</Link>
          <Link href="/dashboard?tab=venue" className="hover:text-ink">List your venue</Link>
        </nav>
      </div>
    </footer>
  );
}
