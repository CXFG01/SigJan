"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  PhoneCall,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConcernCard } from "@/components/patient/concern-card";
import { useDemo } from "@/context/demo-provider";

export default function PatientConcernsPage() {
  const { episode } = useDemo();
  const concerns = episode.concerns.slice(0, 3);

  return (
    <AppShell
      description="These are bounded, source-backed review items—not a diagnosis, treatment recommendation, or single risk score."
      eyebrow="Step 4 of 6 · Prepare the review"
      mode="patient"
      title="Three items to discuss with the care team"
    >
      <div className="app-stack">
        <section className="concern-orientation">
          <div>
            <strong>{concerns.length}</strong>
            <span>primary review items</span>
          </div>
          <p>
            SignalRx separates what the sources establish, what depends on
            missing context, and what cannot yet be classified. It does not
            declare the medication combination safe.
          </p>
        </section>

        <div className="concern-list">
          {concerns.map((concern, index) => (
            <ConcernCard
              concern={concern}
              evidence={episode.evidenceRecords.filter((record) =>
                concern.evidenceIds.includes(record.id),
              )}
              index={index + 1}
              key={concern.id}
            />
          ))}
        </div>

        <section className="safety-notice">
          <ShieldAlert aria-hidden="true" size={24} />
          <div>
            <h2>Keep treatment decisions with a qualified professional</h2>
            <p>
              Do not change prescribed treatment based only on this result.
              Bring these questions and the verified list to a pharmacist,
              prescriber, or appropriate care service.
            </p>
          </div>
        </section>

        <section className="emergency-notice">
          <PhoneCall aria-hidden="true" size={24} />
          <div>
            <h2>Emergency information</h2>
            <p>
              Seek urgent medical help for severe or rapidly worsening
              symptoms, major bleeding, difficulty breathing, collapse, severe
              confusion, or other symptoms that feel immediately dangerous.
              This list is not exhaustive.
            </p>
          </div>
        </section>

        <div className="app-bottom-actions">
          <Link className="button button-ghost" href="/patient/reconcile">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to comparison
          </Link>
          <div className="app-bottom-actions-end">
            <Link className="button button-secondary" href="/research">
              View isolated research hypothesis
            </Link>
            <Link className="button button-primary" href="/patient/timeline">
              See medication timeline
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
