"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCheck, Filter } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MedicationConfirmationItem } from "@/components/patient/medication-confirmation-item";
import { useDemo } from "@/context/demo-provider";

type ConfirmationFilter = "all" | "attention" | "verified";

export default function ConfirmMedicationPage() {
  const { episode, confirmAllMedications } = useDemo();
  const [filter, setFilter] = useState<ConfirmationFilter>("all");
  const [announcement, setAnnouncement] = useState("");

  const blockingItems = episode.medicationEntries.filter((entry) =>
    ["needs_confirmation", "uncertain_match"].includes(
      entry.confirmationStatus,
    ),
  );
  const unresolvedItems = episode.medicationEntries.filter(
    (entry) =>
      !["confirmed", "corrected"].includes(entry.confirmationStatus),
  );
  const visibleEntries = useMemo(
    () =>
      episode.medicationEntries.filter((entry) => {
        if (filter === "verified") {
          return ["confirmed", "corrected"].includes(
            entry.confirmationStatus,
          );
        }
        if (filter === "attention") {
          return !["confirmed", "corrected"].includes(
            entry.confirmationStatus,
          );
        }
        return true;
      }),
    [episode.medicationEntries, filter],
  );

  function confirmPending() {
    confirmAllMedications();
    setAnnouncement(
      "All candidate identities that could be confirmed were marked as reviewed. Missing information and possibly stopped items remain visible.",
    );
  }

  const readyForReview =
    episode.medicationEntries.length > 0 && !blockingItems.length;

  return (
    <AppShell
      actions={
        <button
          className="button button-teal"
          disabled={!blockingItems.length}
          onClick={confirmPending}
          type="button"
        >
          <CheckCheck aria-hidden="true" size={18} />
          Confirm clear candidates
        </button>
      }
      description="Compare each interpretation with its source. Correct anything that differs, and leave genuinely unknown information visible."
      eyebrow="Step 2 of 6 · Verify the record"
      mode="patient"
      title="Check every medicine and product"
    >
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="app-stack">
        <section className="confirm-toolbar" aria-label="Confirmation controls">
          <div className="confirm-filter">
            <span className="confirm-filter-label">
              <Filter aria-hidden="true" size={16} /> Show
            </span>
            {(
              [
                ["all", `All ${episode.medicationEntries.length}`],
                ["attention", `Needs attention ${unresolvedItems.length}`],
                [
                  "verified",
                  `Verified ${
                    episode.medicationEntries.length - unresolvedItems.length
                  }`,
                ],
              ] as const
            ).map(([value, label]) => (
              <button
                aria-pressed={filter === value}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="confirmation-progress">
            <strong>
              {episode.medicationEntries.length - blockingItems.length} of{" "}
              {episode.medicationEntries.length}
            </strong>
            <span>clear enough to reconcile</span>
          </div>
        </section>

        {blockingItems.length > 0 && (
          <section className="utility-panel" data-tone="amber">
            <h2>
              {blockingItems.length} candidate{" "}
              {blockingItems.length === 1 ? "identity needs" : "identities need"}{" "}
              your check
            </h2>
            <p>
              “Missing information” and “possibly stopped” can remain unresolved
              for the pharmacist. An uncertain extracted identity cannot.
            </p>
          </section>
        )}

        {visibleEntries.length ? (
          <div className="confirmation-list">
            {visibleEntries.map((entry) => (
              <MedicationConfirmationItem
                entry={entry}
                key={`${entry.id}-${entry.updatedAt}`}
              />
            ))}
          </div>
        ) : (
          <section className="utility-panel" data-tone="amber">
            <h2>No candidate items yet</h2>
            <p>
              Return to intake and add at least one source before checking the
              medication record.
            </p>
          </section>
        )}

        <div className="app-bottom-actions">
          <Link className="button button-ghost" href="/patient/intake">
            <ArrowLeft aria-hidden="true" size={17} />
            Back to sources
          </Link>
          <div className="app-bottom-actions-end">
            <span className={readyForReview ? "intake-completion" : "muted"}>
              {readyForReview
                ? "Ready to compare sources"
                : episode.medicationEntries.length
                  ? "Confirm the uncertain candidate to continue"
                  : "Add a source before continuing"}
            </span>
            <Link
              aria-disabled={!readyForReview}
              className="button button-primary"
              href={readyForReview ? "/patient/reconcile" : "#"}
              tabIndex={readyForReview ? undefined : -1}
            >
              Compare the full list
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
