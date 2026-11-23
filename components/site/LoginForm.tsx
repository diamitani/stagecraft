"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, TextInput } from "@/components/stagecraft/fields";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

export default function LoginForm({ next, linkProblem }: { next: string; linkProblem: boolean }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(linkProblem ? "That sign-in link has expired or was already used. Send yourself a new one." : null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Add a valid email address.");
      return;
    }
    const supabase = createBrowserAuthClient();
    if (!supabase) {
      setError("Sign-in isn't set up on this site yet.");
      return;
    }
    setSending(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setSending(false);
    if (signInError) {
      setError("Could not send the link. Check the email address and try again in a minute.");
      return;
    }
    setSentTo(address);
  }

  if (sentTo) {
    return (
      <div role="status" className="rounded-ap border border-[#bfe3cb] bg-[#effaf2] p-5">
        <p className="font-display text-lg font-bold text-ink">Check your email</p>
        <p className="mt-1 text-sm text-ink-soft">We sent a sign-in link to {sentTo}. Open it on this device. It can take a minute to arrive, so check spam too.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="sc-login-email">
        <TextInput id="sc-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <FormMessage error={error} />
      <Button type="submit" disabled={sending}>{sending ? "Sending..." : "Email me a sign-in link"}</Button>
    </form>
  );
}
