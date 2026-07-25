"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  FlaskConical,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDemo } from "@/context/demo-provider";
import { calculateCompleteness } from "@/domain";
import "@/styles/professional-workflow.css";

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function ProfessionalQueuePage() {
  const { episode, hydrated, openProfessionalReview, setRole } = useDemo();
  useEffect(() => {
    if (hydrated) {
      setRole("professional");
    }
  }, [hydrated, setRole]);
  const completeness = calculateCompleteness(episode.medicationEntries, {
    observations: episode.observations,
    requiredObservationCodes: ["egfr"],
  });
  const reviewedCount = episode.concerns.filter(
    (concern) => concern.reviewStatus !== "unreviewed",
  ).length;
  const pendingCount = episode.concerns.length - reviewedCount;

  return (
    <AppShell
      description="A deliberately short queue for source-preserving medication reconciliation. SignalRx prepares the record; an accountable professional decides what happens next."
      eyebrow="Professional workspace · Harbour Pharmacy"
      mode="professional"
      title="Medication review queue"
    >
      <div className="professional-stack">
        <section className="queue-summary" aria-label="Queue summary">
          <article>
            <span className="queue-summary-icon">
              <Inbox aria-hidden="true" size={20} />
            </span>
            <div>
              <strong>1</strong>
              <p>episode in this synthetic queue</p>
            </div>
          </article>
          <article>
            <span className="queue-summary-icon">
              <ShieldAlert aria-hidden="true" size={20} />
            </span>
            <div>
              <strong>{pendingCount}</strong>
              <p>concerns awaiting disposition</p>
            </div>
          </article>
          <article>
            <span className="queue-summary-icon">
              <FileWarning aria-hidden="true" size={20} />
            </span>
            <div>
              <strong>{completeness.missingContextCodes.length}</strong>
              <p>required context fields missing</p>
            </div>
          </article>
          <article>
            <span className="queue-summary-icon">
              <CheckCircle2 aria-hidden="true" size={20} />
            </span>
            <div>
              <strong>{reviewedCount}</strong>
              <p>concerns with a recorded decision</p>
            </div>
          </article>
        </section>

        <section className="queue-board" aria-labelledby="queue-title">
          <header className="queue-board-header">
            <div>
              <p className="eyebrow">Active review</p>
              <h2 id="queue-title">Post-discharge episodes</h2>
            </div>
            <span className="queue-filter">
              <ClipboardList aria-hidden="true" size={16} />
              Ordered by follow-up date
            </span>
          </header>

          <article className="queue-case">
            <div className="queue-case-leading">
              <span className="patient-monogram" aria-hidden="true">
                EC
              </span>
              <div>
                <div className="queue-case-title">
                  <h3>{episode.patient.name}</h3>
                  <span>{episode.patient.age} years</span>
                </div>
                <p>{episode.patient.recentEvent}</p>
                <ul className="condition-list" aria-label="Recorded conditions">
                  {episode.patient.conditions.map((condition) => (
                    <li key={condition.id}>{condition.name}</li>
                  ))}
                </ul>
              </div>
            </div>

            <dl className="queue-case-metrics">
              <div>
                <dt>Workflow</dt>
                <dd>{formatStatus(episode.workflowState)}</dd>
              </div>
              <div>
                <dt>Medication entries</dt>
                <dd>{episode.medicationEntries.length}</dd>
              </div>
              <div>
                <dt>Concern queue</dt>
                <dd>
                  {episode.concerns.length} total · {pendingCount} pending
                </dd>
              </div>
              <div>
                <dt>Medication fields</dt>
                <dd>{completeness.medicationListCompleteness}% complete</dd>
              </div>
            </dl>

            <div className="queue-case-context">
              <div>
                <CalendarClock aria-hidden="true" size={18} />
                <span>
                  Follow-up target
                  <strong>
                    {episode.patientPlan.followUpDate ?? "Not assigned"}
                  </strong>
                </span>
              </div>
              <div>
                <FlaskConical aria-hidden="true" size={18} />
                <span>
                  Missing context
                  <strong>
                    {completeness.missingContextCodes.length
                      ? completeness.missingContextCodes
                          .map((code) => code.toUpperCase())
                          .join(", ")
                      : "None recorded"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="queue-case-action">
              <p>
                <strong>Synthetic demonstration case.</strong> The workbench
                shows governed evidence and does not provide autonomous
                treatment instructions.
              </p>
              <Link
                aria-disabled={!hydrated}
                className="button button-primary"
                href={
                  hydrated
                    ? `/professional/review/${episode.id}`
                    : "#"
                }
                onClick={openProfessionalReview}
                tabIndex={hydrated ? undefined : -1}
              >
                Open review
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </article>
        </section>

        <aside className="professional-boundary">
          <ShieldAlert aria-hidden="true" size={20} />
          <div>
            <strong>Professional decision boundary</strong>
            <p>
              Severity, evidence strength, patient-context match, and data
              completeness are separate dimensions. A high potential severity
              is not a diagnosis or proof of causality.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
