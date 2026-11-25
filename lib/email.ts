/**
 * Sends email through Resend. Quietly does nothing when RESEND_API_KEY is not set,
 * so Stagecraft works without email; people just won't get notifications.
 *
 * STAGECRAFT_FROM_EMAIL must be an address on a domain you have verified in Resend,
 * for example "Stagecraft <hello@yourdomain.com>".
 */
import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = process.env.STAGECRAFT_FROM_EMAIL || "Stagecraft <onboarding@resend.dev>";
const REPLY_TO = process.env.STAGECRAFT_REPLY_TO || undefined;

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<{ success: boolean; id?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set, skipping:", params.subject);
    return { success: false };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: params.to,
      subject: params.subject,
      html: params.html,
      tags: params.tags,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false };
    }
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[email] Send failed:", error);
    return { success: false };
  }
}
