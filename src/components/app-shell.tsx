"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { RotateCcw, ShieldCheck, UserRoundCog } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ProgressRail } from "@/components/progress-rail";
import { useDemo } from "@/context/demo-provider";

type AppShellProps = {
  mode: "patient" | "professional" | "caregiver";
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  mode,
  eyebrow,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const { resetDemo } = useDemo();
  const roleLabel =
    mode === "professional"
      ? "Pharmacist view"
      : mode === "caregiver"
        ? "Caregiver view"
        : "Patient view";

  return (
    <div
      className={`app-frame ${mode === "professional" ? "professional-frame" : ""}`}
    >
      <header className="app-topbar">
        <div className="app-topbar-inner shell-width">
          <BrandMark />
          <span className="app-topbar-centre">{roleLabel}</span>
          <nav className="app-topbar-actions" aria-label="Demo controls">
            <Link
              aria-label="Switch demo role"
              className="app-role-link"
              href="/demo"
            >
              <UserRoundCog aria-hidden="true" size={18} />
              <span>Switch role</span>
            </Link>
            <button
              aria-label="Reset synthetic demo"
              className="app-role-link"
              onClick={resetDemo}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={17} />
              <span>Reset demo</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="app-demo-strip">
        <div className="app-demo-strip-inner shell-width">
          <span>
            <strong>Synthetic demonstration data</strong> · Evelyn Carter, age
            72 · post-discharge review
          </span>
          <span>No real patient information is used.</span>
        </div>
      </div>

      <div className="app-workspace">
        <ProgressRail mode={mode} />
        <main className="app-main" id="main-content">
          <div className="app-main-inner">
            <header className="app-page-header">
              <div className="app-page-header-copy">
                <p className="eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                <p>{description}</p>
              </div>
              {actions && <div className="app-page-actions">{actions}</div>}
            </header>
            {children}
            <footer
              className="app-bottom-actions"
              style={{ marginTop: "var(--space-3xl)" }}
            >
              <p className="muted flex items-center gap-2 text-sm">
                <ShieldCheck aria-hidden="true" size={17} />
                Do not change prescribed treatment based only on SignalRx.
              </p>
              <Link className="text-link" href="/about/safety">
                Safety boundaries
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
