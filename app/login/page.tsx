import { pageMetadata } from "@/lib/site";
import { safeNext } from "@/lib/safe-next";
import LoginForm from "@/components/site/LoginForm";

export const metadata = pageMetadata({
  title: "Sign in | Stagecraft",
  description: "Sign in to Stagecraft with an email link. No password needed.",
  path: "/login",
});

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="ap-eyebrow">Stagecraft</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Sign in</h1>
      <p className="mt-2 text-ink-soft">New or returning, the same email link works. We email you a link, you click it, you&apos;re in. No password.</p>
      <div className="mt-6">
        <LoginForm next={safeNext(searchParams.next)} linkProblem={searchParams.error === "link"} />
      </div>
    </div>
  );
}
