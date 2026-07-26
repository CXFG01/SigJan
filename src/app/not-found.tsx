import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return (
    <main id="main-content" className="auth-page">
      <header className="auth-header"><Brand /></header>
      <div className="auth-panel">
        <p className="eyebrow">404 · Page not found</p>
        <h1>This page isn’t part of SignalRx.</h1>
        <p>The address may be old. Return to the public home or sign in to your record.</p>
        <div className="review-actions">
          <Link className="button button-primary" href="/"><ArrowLeft size={18} /> SignalRx home</Link>
          <Link className="button button-secondary" href="/auth">Sign in</Link>
        </div>
      </div>
      <span />
    </main>
  );
}
