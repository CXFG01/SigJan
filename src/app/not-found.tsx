import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return (
    <main id="main-content" className="checker-shell">
      <header className="checker-header"><Brand /></header>
      <div className="checker-intro">
        <p className="eyebrow">404 · Page not found</p>
        <h1>This page isn’t part of SignalRx.</h1>
        <p>The address may be old. Return to the prescription checker.</p>
        <div className="checker-actions">
          <Link className="button button-primary" href="/"><ArrowLeft size={18} /> SignalRx home</Link>
        </div>
      </div>
      <span />
    </main>
  );
}
