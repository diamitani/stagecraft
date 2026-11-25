import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, EnvelopeSimple, Globe, MapPin } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { getArtistBySlug } from "@/lib/artists";
import { LINK_KEYS, LINK_LABELS } from "@/lib/artists-shared";
import { absoluteUrl, artispreneurUrl } from "@/lib/site";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtistBySlug(params.slug);
  if (!artist) return { title: "Artist not found", robots: { index: false } };
  const bits = [artist.genre, artist.city].filter(Boolean).join(" · ");
  const title = `${artist.name}${bits ? `, ${bits}` : ""} | Stagecraft`;
  const description = artist.bio ? artist.bio.slice(0, 160) : `${artist.name} on Artispreneur and Stagecraft.`;
  const url = absoluteUrl(`/artists/${artist.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", siteName: "Stagecraft", title, description, url, ...(artist.imageUrl ? { images: [{ url: artist.imageUrl, alt: artist.name }] } : {}) },
  };
}

export default async function ArtistPage({ params }: Props) {
  const artist = await getArtistBySlug(params.slug);
  if (!artist) notFound();
  const links = LINK_KEYS.filter((key) => artist.links[key]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/artists" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand"><ArrowLeft className="h-4 w-4" />All artists</Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div>
          {artist.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- artist photos come from any host the artist pastes
            <img src={artist.imageUrl} alt={`${artist.name}`} className="aspect-square w-full rounded-ap border border-line object-cover" />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded-ap border border-line bg-muted font-display text-6xl text-brand" aria-hidden="true">{artist.name.slice(0, 1)}</div>
          )}
        </div>

        <div className="min-w-0">
          {artist.genre ? <p className="ap-eyebrow">{artist.genre}</p> : null}
          <h1 className="mt-2 break-words font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">{artist.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            {artist.city ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{artist.city}</span> : null}
            {artist.websiteUrl ? (
              <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"><Globe className="h-4 w-4" />Website</a>
            ) : null}
          </div>

          {artist.bio ? <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{artist.bio}</p> : null}

          {links.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {links.map((key) => (
                <li key={key}>
                  <a href={artist.links[key]} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand">{LINK_LABELS[key]}</a>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {artist.bookingEmail ? (
              <a href={`mailto:${artist.bookingEmail}`} className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white shadow-ap transition-colors hover:bg-brand-deep"><EnvelopeSimple className="h-4 w-4" />Book this artist</a>
            ) : null}
            {artist.city ? <ButtonLink href={`/venues?city=${encodeURIComponent(artist.city)}`} variant="secondary">Venues in {artist.city}</ButtonLink> : null}
            <ButtonLink href={artispreneurUrl(`/artists/${artist.slug}`)} variant="ghost">Full page on Artispreneur</ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
