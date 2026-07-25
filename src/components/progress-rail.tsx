"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

export type JourneyStep = {
  label: string;
  href: string;
};

const patientSteps: JourneyStep[] = [
  { label: "Add sources", href: "/patient/intake" },
  { label: "Confirm list", href: "/patient/confirm" },
  { label: "Reconcile", href: "/patient/reconcile" },
  { label: "Review concerns", href: "/patient/concerns" },
  { label: "Timeline", href: "/patient/timeline" },
  { label: "Patient plan", href: "/patient/plan" },
];

const professionalSteps: JourneyStep[] = [
  { label: "Review queue", href: "/professional" },
  {
    label: "Evelyn’s review",
    href: "/professional/review/episode-evelyn-post-discharge-2026-07",
  },
];

const caregiverSteps: JourneyStep[] = [
  { label: "Caregiver overview", href: "/caregiver" },
  { label: "Patient plan", href: "/patient/plan" },
];

type ProgressRailProps = {
  mode: "patient" | "professional" | "caregiver";
};

export function ProgressRail({ mode }: ProgressRailProps) {
  const pathname = usePathname();
  const steps =
    mode === "professional"
      ? professionalSteps
      : mode === "caregiver"
        ? caregiverSteps
        : patientSteps;
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => pathname === step.href),
  );

  return (
    <aside className="journey-rail" aria-label={`${mode} journey`}>
      <p className="journey-label">
        {mode === "patient" ? "Your review" : `${mode} view`}
      </p>
      <ol className="journey-list">
        {steps.map((step, index) => {
          const isActive = pathname === step.href;
          const isComplete = index < activeIndex;
          return (
            <li key={step.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className="journey-link"
                data-complete={isComplete}
                href={step.href}
              >
                <span className="journey-number" aria-hidden="true">
                  {isComplete ? <Check size={12} strokeWidth={3} /> : index + 1}
                </span>
                <span>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="journey-footnote">
        Progress reflects the demo workflow, not a safety rating.
      </p>
    </aside>
  );
}
