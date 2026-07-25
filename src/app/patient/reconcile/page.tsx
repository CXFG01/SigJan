"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  GitCompareArrows,
  HelpCircle,
  PackageOpen,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  calculateCompleteness,
  detectDuplicateIngredients,
  type MedicationEntry,
} from "@/domain";
import { useDemo } from "@/context/demo-provider";

export default function ReconcilePage() {
  const { episode } = useDemo();
  const completeness = calculateCompleteness(episode.medicationEntries, {
    observations: episode.observations,
    requiredObservationCodes: ["egfr"],
  });
  const duplicateFindings = detectDuplicateIngredients(
    episode.medicationEntries,
    episode.asOf,
  );

  const discharge = episode.medicationEntries.filter(
    (entry) => entry.sourceId === "source-discharge-letter",
  );
  const home = episode.medicationEntries.filter(
    (entry) => entry.sourceId !== "source-discharge-letter",
  );
  const possiblyStopped = episode.medicationEntries.filter(
    (entry) =>
      entry.currentStatus === "possibly_stopped" ||
      entry.confirmationStatus === "possibly_stopped",
  );
  const missingItems = completeness.missingMedicationFields.map((finding) => ({
    finding,
    entry: episode.medicationEntries.find(
      (entry) => entry.id === finding.medicationEntryId,
    ),
  }));

  return (
    <AppShell
      description="The same active ingredient can appear under different names or formulations. SignalRx keeps those records separate until a professional checks them."
      eyebrow="Step 3 of 6 · Reconcile sources"
      mode="patient"
      title="One list, without hiding the differences"
    >
      <div className="app-stack">
        <section className="reconcile-summary">
          <div className="completeness-panel">
            <div className="completeness-heading">
              <div>
                <p className="eyebrow">Record quality</p>
                <h2>Medication list completeness</h2>
              </div>
              <strong>{completeness.medicationListCompleteness}%</strong>
            </div>
            <progress
              aria-label="Medication list completeness"
              max="100"
              value={completeness.medicationListCompleteness}
            />
            <p>
              {completeness.medicationFieldsComplete} of{" "}
              {completeness.medicationFieldsExpected} expected medication
              fields are present. This is a completeness measure, not a safety
              score.
            </p>
            <div className="completeness-split">
              <div>
                <strong>{completeness.contextCompleteness}%</strong>
                <span>Context completeness</span>
              </div>
              <div>
                <strong>{completeness.itemsAwaitingConfirmation.length}</strong>
                <span>Items awaiting confirmation</span>
              </div>
              <div>
                <strong>{duplicateFindings.length}</strong>
                <span>Ingredient/formulation flags</span>
              </div>
            </div>
          </div>

          <div className="utility-panel" data-tone="amber">
            <HelpCircle aria-hidden="true" size={24} />
            <h2>Context is still incomplete</h2>
            <p>
              A current kidney-function result is not present in the sources.
              SignalRx leaves that value missing and prepares a question for
              professional review.
            </p>
            <ul className="utility-panel-list">
              {completeness.missingContextCodes.map((code) => (
                <li key={code}>
                  <AlertTriangle aria-hidden="true" size={17} />
                  Current {code.toUpperCase()} value and result date
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="app-section">
          <div className="app-section-heading">
            <div>
              <p className="eyebrow">Source comparison</p>
              <h2>Discharge record beside what is at home</h2>
            </div>
            <p>
              “Not listed” means absent from that source; it does not mean the
              product was stopped.
            </p>
          </div>
          <div className="source-compare">
            <div className="source-compare-header" aria-hidden="true">
              <span>Product identity</span>
              <span>Listed at discharge</span>
              <span>Reported or found at home</span>
            </div>
            {episode.medicationEntries
              .filter(
                (entry) =>
                  !entry.ingredientIds.includes("ingredient-diltiazem"),
              )
              .map((entry) => (
                <ComparisonRow
                  dischargeEntry={
                    discharge.find((item) => item.id === entry.id) ?? null
                  }
                  homeEntry={home.find((item) => item.id === entry.id) ?? null}
                  key={entry.id}
                  label={entry.normalizedName ?? entry.enteredName}
                />
              ))}
            <ComparisonRow
              dischargeEntry={
                discharge.find((entry) =>
                  entry.ingredientIds.includes("ingredient-diltiazem"),
                ) ?? null
              }
              homeEntry={
                home.find((entry) =>
                  entry.ingredientIds.includes("ingredient-diltiazem"),
                ) ?? null
              }
              label="Diltiazem / Cardizem"
            />
          </div>
        </section>

        <section className="app-section">
          <div className="app-section-heading">
            <div>
              <p className="eyebrow">Differences to carry forward</p>
              <h2>Nothing unresolved is silently collapsed</h2>
            </div>
          </div>
          <div className="discrepancy-grid">
            {duplicateFindings.map((finding) => {
              const entries = finding.medicationEntryIds
                .map((id) =>
                  episode.medicationEntries.find((entry) => entry.id === id),
                )
                .filter((entry): entry is MedicationEntry => Boolean(entry));
              return (
                <article
                  className="discrepancy-card"
                  data-tone="coral"
                  key={finding.id}
                >
                  <span className="discrepancy-icon">
                    <GitCompareArrows aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <p className="eyebrow">
                      {humanise(finding.kind)}
                    </p>
                    <h3>
                      {entries
                        .map((entry) => entry.enteredName)
                        .join(" and ")}
                    </h3>
                    <p>{finding.explanation}</p>
                    <small>
                      Exposure timing: {humanise(finding.exposureStatus)}
                    </small>
                  </div>
                </article>
              );
            })}

            {possiblyStopped.map((entry) => (
              <article className="discrepancy-card" key={entry.id}>
                <span className="discrepancy-icon">
                  <PackageOpen aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="eyebrow">Possibly stopped</p>
                  <h3>{entry.enteredName}</h3>
                  <p>
                    Found in the home supply, but current use is not confirmed.
                    It stays separate from the active list.
                  </p>
                  <small>Source: {entry.sourceLabel}</small>
                </div>
              </article>
            ))}

            {missingItems.slice(0, 3).map(({ entry, finding }) =>
              entry ? (
                <article className="discrepancy-card" key={entry.id}>
                  <span className="discrepancy-icon">
                    <HelpCircle aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <p className="eyebrow">Missing information</p>
                    <h3>{entry.enteredName}</h3>
                    <p>
                      {finding.fields.map(humanise).join(", ")}{" "}
                      {finding.fields.length === 1 ? "is" : "are"} incomplete.
                    </p>
                    <small>
                      Missing values remain questions, never assumptions.
                    </small>
                  </div>
                </article>
              ) : null,
            )}
          </div>
        </section>

        <section className="utility-panel" data-tone="teal">
          <div className="ready-review-line">
            <Check aria-hidden="true" size={22} />
            <div>
              <h2>Ready for a bounded concern review</h2>
              <p>
                The next screen shows three source-backed items. It does not
                grade the regimen or declare it safe.
              </p>
            </div>
          </div>
        </section>

        <div className="app-bottom-actions">
          <Link className="button button-ghost" href="/patient/confirm">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to confirmation
          </Link>
          <Link className="button button-primary" href="/patient/concerns">
            Review three concerns
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function ComparisonRow({
  label,
  dischargeEntry,
  homeEntry,
}: {
  label: string;
  dischargeEntry: MedicationEntry | null;
  homeEntry: MedicationEntry | null;
}) {
  return (
    <div className="source-compare-row">
      <h3>{label}</h3>
      <ComparisonCell entry={dischargeEntry} label="Discharge record" />
      <ComparisonCell entry={homeEntry} label="Home report" />
    </div>
  );
}

function ComparisonCell({
  entry,
  label,
}: {
  entry: MedicationEntry | null;
  label: string;
}) {
  if (!entry) {
    return (
      <div className="source-compare-cell">
        <small>{label}</small>
        <span className="not-listed">Not listed in this source</span>
      </div>
    );
  }
  return (
    <div className="source-compare-cell">
      <small>{label}</small>
      <strong>{entry.enteredName}</strong>
      <span>
        {[entry.dose, entry.frequency].filter(Boolean).join(" · ") ||
          "Dose or frequency missing"}
      </span>
      <span className="category-chip" data-category={entry.category}>
        {humanise(entry.category)}
      </span>
    </div>
  );
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
