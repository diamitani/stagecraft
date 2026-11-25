import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/* Artispreneur type: Playfair Display for brand headings, Plus Jakarta Sans for crisp UI text. */
const sans = localFont({
  src: [{ path: "./fonts/PlusJakartaSans-variable.ttf", weight: "200 800", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
});

const display = localFont({
  src: [
    { path: "./fonts/PlayfairDisplay-variable.ttf", weight: "400 900", style: "normal" },
    { path: "./fonts/PlayfairDisplay-italic-variable.ttf", weight: "400 900", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Stagecraft | Book venues and shows on Artispreneur", template: "%s" },
  description: "Stagecraft is the venue side of Artispreneur. Venues list their room and open dates, artists ask for a night, and the venue says yes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="laurel" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-ink antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <main id="main-content" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
