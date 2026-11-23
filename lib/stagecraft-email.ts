/**
 * Stagecraft notification emails (server-only). Sent through the shared
 * Resend service, which quietly does nothing when email isn't configured.
 * A failed email never fails the booking action that triggered it.
 */
import "server-only";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { dayLabel, formatMoney, type Booking } from "@/lib/stagecraft-shared";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DASHBOARD_URL = `${SITE_URL}/dashboard`;

function layout(heading: string, lines: string[], cta: { label: string; href: string }): string {
  const body = lines.map((line) => `<p style="font-size:15px;line-height:1.6;color:#262626;margin:0 0 12px;">${line}</p>`).join("");
  return `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:32px 20px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:10px;padding:28px;">
<p style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#78716c;margin:0 0 8px;">Stagecraft</p>
<h1 style="font-size:20px;line-height:1.3;color:#0c0a09;margin:0 0 16px;">${heading}</h1>
${body}
<p style="margin:20px 0 0;"><a href="${cta.href}" style="display:inline-block;background:#0c0a09;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 18px;border-radius:8px;">${cta.label}</a></p>
</div></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!to) return;
  try {
    await sendEmail({ to, subject, html, tags: [{ name: "category", value: "stagecraft" }] });
  } catch (error) {
    console.error("[stagecraft] email failed", error instanceof Error ? error.message : error);
  }
}

/** To the venue: an artist asked for a date. */
export async function notifyVenueOfRequest(to: string, booking: Booking): Promise<void> {
  const artist = escapeHtml(booking.artistName);
  const lines = [
    `<strong>${artist}</strong> asked to book <strong>${escapeHtml(booking.venueName)}</strong> on <strong>${dayLabel(booking.eventDate)}</strong>.`,
    booking.expectedAttendance ? `Expected crowd: ${booking.expectedAttendance.toLocaleString("en-US")}.` : "",
    `Their note: ${escapeHtml(booking.message).replace(/\n/g, "<br>")}`,
    "Open your booking inbox to accept or decline.",
  ].filter(Boolean);
  await send(to, `New booking request from ${booking.artistName}`, layout("You have a new booking request", lines, { label: "Open booking inbox", href: `${DASHBOARD_URL}?tab=inbox` }));
}

/** To the artist: the venue accepted, declined or cancelled. */
export async function notifyArtistOfAnswer(to: string, booking: Booking): Promise<void> {
  const venue = escapeHtml(booking.venueName);
  const date = dayLabel(booking.eventDate);
  const note = booking.venueNote ? `Their note: ${escapeHtml(booking.venueNote)}` : "";
  let subject: string;
  let heading: string;
  let lines: string[];
  if (booking.status === "confirmed") {
    subject = `${booking.venueName} confirmed your date`;
    heading = "Your date is confirmed";
    lines = [`<strong>${venue}</strong> confirmed <strong>${date}</strong>.`, note];
  } else if (booking.status === "accepted") {
    subject = `${booking.venueName} accepted your request`;
    heading = "Accepted. Pay the deposit to lock it in";
    lines = [
      `<strong>${venue}</strong> accepted <strong>${date}</strong> and asked for a <strong>${formatMoney(booking.depositCents)}</strong> deposit.`,
      "The date is held for you. It is confirmed once the deposit is paid.",
      note,
    ];
  } else if (booking.status === "declined") {
    subject = `${booking.venueName} can't do that date`;
    heading = "That date didn't work out";
    lines = [`<strong>${venue}</strong> declined your request for <strong>${date}</strong>.`, note, "You can ask for another date or try another venue."];
  } else {
    subject = `${booking.venueName} cancelled your booking`;
    heading = "Your booking was cancelled";
    lines = [`<strong>${venue}</strong> cancelled the booking for <strong>${date}</strong>.`, note];
  }
  await send(to, subject, layout(heading, lines.filter(Boolean), { label: "View my requests", href: `${DASHBOARD_URL}?tab=requests` }));
}

/** To the venue: the artist cancelled. */
export async function notifyVenueOfCancellation(to: string, booking: Booking): Promise<void> {
  const lines = [
    `<strong>${escapeHtml(booking.artistName)}</strong> cancelled their booking for <strong>${dayLabel(booking.eventDate)}</strong>. The date is open again on your calendar.`,
  ];
  await send(to, `${booking.artistName} cancelled ${dayLabel(booking.eventDate)}`, layout("A booking was cancelled", lines, { label: "Open booking inbox", href: `${DASHBOARD_URL}?tab=inbox` }));
}

/** To the venue: the deposit landed, the date is confirmed. */
export async function notifyVenueOfDeposit(
  to: string,
  details: { artistName: string; eventDate: string; depositCents: number },
): Promise<void> {
  const lines = [
    `<strong>${escapeHtml(details.artistName)}</strong> paid the <strong>${formatMoney(details.depositCents)}</strong> deposit for <strong>${dayLabel(details.eventDate)}</strong>.`,
    "The booking is now confirmed. The payment is in your Stripe account.",
  ];
  await send(to, `Deposit paid: ${details.artistName}, ${dayLabel(details.eventDate)}`, layout("Deposit paid, booking confirmed", lines, { label: "Open booking inbox", href: `${DASHBOARD_URL}?tab=inbox` }));
}
