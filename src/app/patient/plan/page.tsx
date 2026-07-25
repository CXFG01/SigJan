"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  Phone,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlanActions } from "@/components/plan-actions";
import { SharePlanButton } from "@/components/share-plan-button";
import { useDemo } from "@/context/demo-provider";

export default function PatientPlanPage() {
  const { episode, openProfessionalReview } = useDemo();
  const { patientPlan } = episode;
  const approved = patientPlan.status === "approved";
  const verifiedEntries = patientPlan.verifiedMedicationEntryIds
    .map((id) => episode.medicationEntries.find((entry) => entry.id === id))
    .filter(Boolean);
  const awaitingEntries = patientPlan.awaitingConfirmationEntryIds
    .map((id) => episode.medicationEntries.find((entry) => entry.id === id))
    .filter(Boolean);
  const planText = createPlanText(episode);

  return (
    <AppShell
      actions={
        approved ? (
          <PlanActions content={planText} />
        ) : (
          <Link
            className="button button-primary"
            href={`/professional/review/${episode.id}`}
            onClick={openProfessionalReview}
          >
            Open pharmacist review
          </Link>
        )
      }
      description={
        approved
          ? "This plain-language summary reflects the documented pharmacist dispositions in the synthetic review."
          : "The verified record is ready, but the care-team actions below cannot be published until a professional reviews every concern."
      }
      eyebrow={`Step 6 of 6 · ${approved ? "Approved plan" : "Awaiting approval"}`}
      mode="patient"
      title={approved ? "Evelyn’s reviewed medication plan" : "Plan prepared for review"}
    >
      <div className="plan-print-zone">
        <section
          aria-label="Plan approval status"
          className="plan-approval-banner"
          data-approved={approved}
        >
          <span className="plan-approval-icon">
            {approved ? (
              <UserRoundCheck aria-hidden="true" size={25} />
            ) : (
              <Clock3 aria-hidden="true" size={25} />
            )}
          </span>
          <div>
            <p className="eyebrow">
              {approved ? "Professional review complete" : "Not yet approved"}
            </p>
            <h2>
              {approved
                ? `Approved by ${patientPlan.approvedBy}`
                : "A pharmacist must document all three decisions"}
            </h2>
            <p>
              {approved && patientPlan.approvedAt
                ? `Approved ${formatDateTime(patientPlan.approvedAt)} · plan version ${patientPlan.version}`
                : "Nothing on this page should be used to make a treatment change while review is outstanding."}
            </p>
          </div>
        </section>

        <section className="plan-section">
          <div className="plan-section-heading">
            <div>
              <p className="eyebrow">Verified list</p>
              <h2>Medicines and products checked in this episode</h2>
            </div>
            <span>{verifiedEntries.length} verified</span>
          </div>
          <div className="plan-medication-list">
            {verifiedEntries.map((entry) =>
              entry ? (
                <article key={entry.id}>
                  <span className="plan-check">
                    <Check aria-hidden="true" size={16} />
                  </span>
                  <div>
                    <h3>{entry.normalizedName ?? entry.enteredName}</h3>
                    <p>
                      {[
                        entry.strength
                          ? `${entry.strength} ${entry.unit ?? ""}`.trim()
                          : null,
                        entry.dose,
                        entry.frequency,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Details remain incomplete"}
                    </p>
                    <small>
                      {humanise(entry.category)} · administered by{" "}
                      {entry.administeredBy}
                    </small>
                  </div>
                </article>
              ) : null,
            )}
          </div>
        </section>

        <section className="plan-section">
          <div className="plan-section-heading">
            <div>
              <p className="eyebrow">Still unresolved</p>
              <h2>Items awaiting confirmation or more information</h2>
            </div>
            <span>{awaitingEntries.length} open</span>
          </div>
          {awaitingEntries.length ? (
            <div className="plan-awaiting-list">
              {awaitingEntries.map((entry) =>
                entry ? (
                  <article key={entry.id}>
                    <CircleHelp aria-hidden="true" size={19} />
                    <div>
                      <h3>{entry.enteredName}</h3>
                      <p>
                        {humanise(entry.confirmationStatus)} ·{" "}
                        {entry.notes || "More source detail is needed."}
                      </p>
                    </div>
                  </article>
                ) : null,
              )}
            </div>
          ) : (
            <p className="muted">
              No medication entries are awaiting confirmation.
            </p>
          )}
        </section>

        <section className="plan-section">
          <div className="plan-section-heading">
            <div>
              <p className="eyebrow">Care-team review</p>
              <h2>What happens next</h2>
            </div>
          </div>
          {patientPlan.reviewItems.length ? (
            <div className="plan-review-items">
              {patientPlan.reviewItems.map((item) => (
                <article key={item.concernId}>
                  <span className="category-chip">
                    {humanise(item.disposition)}
                  </span>
                  <h3>{item.whatCareTeamIsReviewing}</h3>
                  <p>{item.patientFacingMessage}</p>
                  <dl>
                    <div>
                      <dt>Owner</dt>
                      <dd>{item.owner ?? "Care team"}</dd>
                    </div>
                    <div>
                      <dt>Follow-up</dt>
                      <dd>{formatDate(item.followUpDate)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-plan-state">
              <Clock3 aria-hidden="true" size={25} />
              <div>
                <h3>Professional decisions have not been published</h3>
                <p>
                  The three questions are ready for a pharmacist, but
                  patient-facing actions remain intentionally blank.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="plan-coordination">
          <div>
            <Phone aria-hidden="true" size={21} />
            <span>
              <small>Contact owner</small>
              <strong>{patientPlan.contactOwner}</strong>
            </span>
          </div>
          <div>
            <CalendarDays aria-hidden="true" size={21} />
            <span>
              <small>Follow-up date</small>
              <strong>{formatDate(patientPlan.followUpDate)}</strong>
            </span>
          </div>
        </section>

        <section className="plan-section">
          <div className="plan-section-heading">
            <div>
              <p className="eyebrow">Bring these questions</p>
              <h2>Questions for the pharmacist or prescriber</h2>
            </div>
          </div>
          <ol className="plan-questions">
            {patientPlan.questionsToAsk.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </section>

        <section className="plan-safety-statement">
          <ShieldAlert aria-hidden="true" size={27} />
          <div>
            <h2>Before making any treatment decision</h2>
            <p>{patientPlan.safetyStatement}</p>
          </div>
        </section>

        <section className="emergency-notice">
          <Phone aria-hidden="true" size={23} />
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

        <div className="app-bottom-actions no-print">
          <Link className="button button-ghost" href="/patient/timeline">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to timeline
          </Link>
          <div className="app-bottom-actions-end">
            {approved && <SharePlanButton text={planText} />}
            {!approved && (
              <Link
                className="button button-primary"
                href={`/professional/review/${episode.id}`}
                onClick={openProfessionalReview}
              >
                Continue as pharmacist
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function createPlanText(
  episode: ReturnType<typeof useDemo>["episode"],
): string {
  const lines = [
    "SignalRx synthetic medication plan",
    `Patient: ${episode.patient.name}`,
    `Status: ${episode.patientPlan.status}`,
    "",
    "Verified medicines and products:",
    ...episode.medicationEntries
      .filter((entry) =>
        episode.patientPlan.verifiedMedicationEntryIds.includes(entry.id),
      )
      .map(
        (entry) =>
          `- ${entry.normalizedName ?? entry.enteredName}: ${[
            entry.dose,
            entry.frequency,
          ]
            .filter(Boolean)
            .join(", ")}`,
      ),
    "",
    "Care-team review:",
    ...episode.patientPlan.reviewItems.map(
      (item) =>
        `- ${item.whatCareTeamIsReviewing}: ${item.patientFacingMessage}`,
    ),
    "",
    `Contact: ${episode.patientPlan.contactOwner}`,
    `Follow-up: ${formatDate(episode.patientPlan.followUpDate)}`,
    "",
    episode.patientPlan.safetyStatement,
    "",
    "Synthetic demonstration data. No real patient information.",
  ];
  return lines.join("\n");
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not yet set";
  }
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanise(value: string): string {
  const normalised = value
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .replaceAll("_", " ")
    .trim();
  if (normalised.toLowerCase() === "otc") {
    return "OTC";
  }
  return normalised.replace(/^\w/u, (letter) => letter.toUpperCase());
}
