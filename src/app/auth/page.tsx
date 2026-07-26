import { Suspense } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthFlow } from "@/components/auth-flow";

type AuthPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { error } = await searchParams;
  return (
    <main id="main-content" className="auth-page">
      <header className="auth-header">
        <Brand />
        <Link className="text-link" href="/about/safety">Safety</Link>
      </header>
      <Suspense fallback={<p>Preparing secure sign-in…</p>}>
        <AuthFlow />
      </Suspense>
      {error === "invalid_link" ? (
        <p className="form-message" role="alert">
          That sign-in link is invalid or has expired. Request a new email and try
          again.
        </p>
      ) : null}
      <p className="auth-support">If you need urgent medical help, use NHS 111 or 999 in an emergency.</p>
    </main>
  );
}
