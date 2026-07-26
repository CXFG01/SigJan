import { Suspense } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthFlow } from "@/components/auth-flow";

export default function AuthPage() {
  return (
    <main id="main-content" className="auth-page">
      <header className="auth-header">
        <Brand />
        <Link className="text-link" href="/about/safety">Safety</Link>
      </header>
      <Suspense fallback={<p>Preparing secure sign-in…</p>}>
        <AuthFlow />
      </Suspense>
      <p className="auth-support">If you need urgent medical help, use NHS 111 or 999 in an emergency.</p>
    </main>
  );
}
