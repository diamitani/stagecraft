"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, TextArea, TextInput } from "@/components/stagecraft/fields";
import { WAITLIST_ROLES, WAITLIST_ROLE_LABELS, type WaitlistRole } from "@/lib/stagecraft-shared";
import { cn } from "@/lib/utils";

export default function StagecraftWaitlistForm() {
  const [role, setRole] = useState<WaitlistRole>("venue");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/stagecraft/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, name, city, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not add you to the list. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-ap border border-[#bfe3cb] bg-[#effaf2] p-6">
        <p className="font-display text-xl font-bold text-ink">You&apos;re on the list.</p>
        <p className="mt-1 text-sm text-ink-soft">We&apos;ll email {email} when there is something new for you in Stagecraft.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-ap border border-line bg-card p-6 shadow-ap" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Which one are you?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {WAITLIST_ROLES.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-sm font-medium transition-colors",
                "focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-1",
                role === option ? "border-brand bg-[#fdf0f0] text-ink" : "border-line bg-card text-ink-soft hover:border-ink",
              )}
            >
              <input type="radio" name="sc-role" value={option} checked={role === option} onChange={() => setRole(option)} className="h-4 w-4 accent-[var(--ap-brand)]" />
              {WAITLIST_ROLE_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="sc-wl-email" className="sm:col-span-2">
          <TextInput id="sc-wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label={role === "venue" ? "Venue name" : role === "sponsor" ? "Company or brand" : "Name"} hint="Optional" htmlFor="sc-wl-name">
          <TextInput id="sc-wl-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </Field>
        <Field label="City" hint="Optional" htmlFor="sc-wl-city">
          <TextInput id="sc-wl-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} autoComplete="address-level2" />
        </Field>
        <Field label="Anything you want us to know?" hint="Optional" htmlFor="sc-wl-note" className="sm:col-span-2">
          <TextArea id="sc-wl-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} className="min-h-[5rem]" />
        </Field>
      </div>

      <FormMessage error={error} />
      <Button type="submit" disabled={sending}>{sending ? "Adding you..." : "Join the list"}</Button>
    </form>
  );
}
