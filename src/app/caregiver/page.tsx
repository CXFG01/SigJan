"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Check,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  History,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SharePlanButton } from "@/components/share-plan-button";
import { useDemo } from "@/context/demo-provider";
import "@/styles/professional-workflow.css";

type AdministrationStatus = "taken" | "not_taken" | "unknown";

const statusOptions: {
  value: AdministrationStatus;
  label: string;
  icon: typeof Check;
}[] = [
  { value: "taken", label: "Taken", icon: Check },
  { value: "not_taken", label: "Not taken", icon: Ban },
  { value: "unknown", label: "Not sure", icon: Clock3 },
];

const standardAdministratorOptions = [
  { value: "Evelyn Carter", label: "Evelyn Carter (self)" },
  { value: "Daniel Carter", label: "Daniel Carter (caregiver)" },
  { value: "Unknown", label: "Not known" },
] as const;

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function CaregiverPage() {
  const { episode, hydrated, recordCaregiverStatus, setRole } = useDemo();
  useEffect(() => {
    if (hydrated) {
      setRole("caregiver");
    }
  }, [hydrated, setRole]);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [administrators, setAdministrators] = useState<
    Record<string, string>
  >({});
  const [announcement, setAnnouncement] = useState("");

  const caregiverHistory = useMemo(
    () =>
      episode.auditEvents
        .filter((event) => event.action === "caregiver_status_recorded")
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    [episode.auditEvents],
  );

  const shareText = useMemo(() => {
    const verified = episode.medicationEntries
      .filter((entry) =>
        ["confirmed", "corrected"].includes(entry.confirmationStatus),
      )
      .map(
        (entry) =>
          `${entry.normalizedName ?? entry.enteredName} — ${formatStatus(entry.administrationStatus)}`,
      );
    return [
      "SignalRx synthetic demonstration record for Evelyn Carter",
      `Professional plan status: ${episode.patientPlan.status}`,
      "",
      "Verified medication record:",
      ...verified.map((entry) => `• ${entry}`),
      "",
      episode.patientPlan.safetyStatement,
    ].join("\n");
  }, [episode.medicationEntries, episode.patientPlan]);

  function saveStatus(
    medicationId: string,
    medicationName: string,
    status: AdministrationStatus,
    administeredBy: string,
  ) {
    recordCaregiverStatus(
      medicationId,
      status,
      administeredBy,
      notes[medicationId] ?? "",
    );
    setNotes((current) => ({ ...current, [medicationId]: "" }));
    setAnnouncement(
      `${formatStatus(status)} was recorded for ${medicationName}. Administered by ${administeredBy}; update recorded by Daniel Carter.`,
    );
  }

  return (
    <AppShell
      actions={
        <SharePlanButton
          disabled={episode.patientPlan.status !== "approved"}
          text={shareText}
        />
      }
      description="Record what happened, who administered it, and what still needs checking. This shared view never changes a prescription or schedule."
      eyebrow="Caregiver workspace · Shared with permission"
      mode="caregiver"
      title="Evelyn’s home medication record"
    >
      <div aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>

      <div className="caregiver-stack">
        <section
          className="permission-card"
          data-permission={permissionGranted ? "granted" : "paused"}
        >
          <span className="permission-icon" aria-hidden="true">
            {permissionGranted ? (
              <UserRoundCheck size={24} />
            ) : (
              <EyeOff size={24} />
            )}
          </span>
          <div>
            <p className="eyebrow">Demo permission</p>
            <h2>
              {permissionGranted
                ? "Evelyn has shared medication logging with Daniel"
                : "Caregiver logging is paused"}
            </h2>
            <p>
              {permissionGranted
                ? "Daniel Carter can view sources and record actual-use updates until 31 July 2026. Evelyn can withdraw access at any time."
                : "Records remain visible in the audit history, but no new caregiver updates can be added."}
            </p>
          </div>
          <button
            className="button button-secondary"
            onClick={() => setPermissionGranted((current) => !current)}
            type="button"
          >
            {permissionGranted ? (
              <EyeOff aria-hidden="true" size={17} />
            ) : (
              <Eye aria-hidden="true" size={17} />
            )}
            {permissionGranted ? "Pause demo access" : "Restore demo access"}
          </button>
        </section>

        <section className="caregiver-overview" aria-label="Record summary">
          <div>
            <strong>{episode.medicationEntries.length}</strong>
            <span>products in the shared record</span>
          </div>
          <div>
            <strong>{caregiverHistory.length}</strong>
            <span>caregiver updates recorded</span>
          </div>
          <div>
            <strong>
              {
                episode.medicationEntries.filter(
                  (entry) => entry.administrationStatus === "unknown",
                ).length
              }
            </strong>
            <span>actual-use states still uncertain</span>
          </div>
          <p>
            These counts describe record completeness. They are not a safety
            score.
          </p>
        </section>

        <section className="app-section" aria-labelledby="caregiver-log-title">
          <div className="app-section-heading">
            <div>
              <p className="eyebrow">Today’s record</p>
              <h2 id="caregiver-log-title">Record actual use</h2>
            </div>
            <p>
              Choose only what you observed. “Not sure” is a valid answer and
              preserves uncertainty for the pharmacist.
            </p>
          </div>

          <div className="caregiver-medication-list">
            {episode.medicationEntries.map((entry) => {
              const medicineName = entry.normalizedName ?? entry.enteredName;
              const selectedAdministrator =
                administrators[entry.id] ?? entry.administeredBy;
              const administratorOptions = standardAdministratorOptions.some(
                (option) => option.value === selectedAdministrator,
              )
                ? standardAdministratorOptions
                : [
                    {
                      value: selectedAdministrator,
                      label: selectedAdministrator,
                    },
                    ...standardAdministratorOptions,
                  ];
              const latestCaregiverProvenance = [...entry.provenance]
                .reverse()
                .find(
                  (record) =>
                    record.field === "administrationStatus" &&
                    record.editorRole === "caregiver",
                );

              return (
                <article className="caregiver-medication" key={entry.id}>
                  <header>
                    <div>
                      <p className="caregiver-category">
                        {formatStatus(entry.category)}
                      </p>
                      <h3>{medicineName}</h3>
                      <p>
                        {entry.strength
                          ? `${entry.strength} ${entry.unit ?? ""}`
                          : "Strength not verified"}
                        {" · "}
                        {entry.frequency ?? "Frequency not recorded"}
                      </p>
                    </div>
                    <span
                      className="record-status"
                      data-status={entry.administrationStatus}
                    >
                      {formatStatus(entry.administrationStatus)}
                    </span>
                  </header>

                  <dl className="caregiver-attribution">
                    <div>
                      <dt>Administered by</dt>
                      <dd>{entry.administeredBy}</dd>
                    </div>
                    <div>
                      <dt>Reported by</dt>
                      <dd>{entry.reportedBy}</dd>
                    </div>
                    <div>
                      <dt>Last caregiver entry</dt>
                      <dd>
                        {latestCaregiverProvenance
                          ? `Daniel Carter · ${formatDateTime(latestCaregiverProvenance.recordedAt)}`
                          : "No caregiver entry yet"}
                      </dd>
                    </div>
                  </dl>

                  <div className="caregiver-entry-controls">
                    <div className="field">
                      <label htmlFor={`administrator-${entry.id}`}>
                        Who administered this medicine?
                      </label>
                      <select
                        aria-describedby={`administrator-hint-${entry.id}`}
                        className="select"
                        disabled={!permissionGranted}
                        id={`administrator-${entry.id}`}
                        onChange={(event) =>
                          setAdministrators((current) => ({
                            ...current,
                            [entry.id]: event.target.value,
                          }))
                        }
                        value={selectedAdministrator}
                      >
                        {administratorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className="field-hint"
                        id={`administrator-hint-${entry.id}`}
                      >
                        Saved with the next actual-use status.
                      </span>
                    </div>

                    <div>
                      <span className="field-label">Actual-use status</span>
                      <div
                        className="administration-control"
                        aria-label={`Actual-use status for ${medicineName}`}
                      >
                        {statusOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              aria-pressed={
                                entry.administrationStatus === option.value
                              }
                              disabled={!permissionGranted}
                              key={option.value}
                              onClick={() =>
                                saveStatus(
                                  entry.id,
                                  medicineName,
                                  option.value,
                                  selectedAdministrator,
                                )
                              }
                              type="button"
                            >
                              <Icon aria-hidden="true" size={15} />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="caregiver-note">
                      <span>Optional observation for the review record</span>
                      <input
                        className="input"
                        disabled={!permissionGranted}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [entry.id]: event.target.value,
                          }))
                        }
                        placeholder="For example: found tablet in pill organiser"
                        value={notes[entry.id] ?? ""}
                      />
                    </label>
                  </div>

                  <details className="source-disclosure">
                    <summary>
                      <FileText aria-hidden="true" size={16} />
                      View original source
                    </summary>
                    <div>
                      <strong>{entry.sourceLabel}</strong>
                      <blockquote>“{entry.sourceExcerpt}”</blockquote>
                      <p>
                        Source supplied by {entry.reportedBy}. Confirmation
                        state: {formatStatus(entry.confirmationStatus)}.
                      </p>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </section>

        <section className="history-panel" aria-labelledby="history-title">
          <header>
            <div>
              <p className="eyebrow">Accountable change log</p>
              <h2 id="history-title">Caregiver update history</h2>
            </div>
            <History aria-hidden="true" size={24} />
          </header>
          {caregiverHistory.length === 0 ? (
            <div className="empty-history">
              <ShieldCheck aria-hidden="true" size={22} />
              <div>
                <strong>No caregiver updates yet</strong>
                <p>
                  New entries will record who administered the medicine,
                  Daniel’s identity, time, status, and note without overwriting
                  the original source.
                </p>
              </div>
            </div>
          ) : (
            <ol className="history-list">
              {caregiverHistory.map((event) => {
                const medication = episode.medicationEntries.find(
                  (entry) => entry.id === event.entityId,
                );
                const detail = Object.fromEntries(
                  event.details.map((item) => [item.key, item.value]),
                );
                return (
                  <li key={event.id}>
                    <span className="history-marker" aria-hidden="true" />
                    <div>
                      <strong>
                        {medication?.normalizedName ??
                          medication?.enteredName ??
                          "Medication record"}
                        {" · "}
                        {formatStatus(detail.administrationStatus ?? "unknown")}
                      </strong>
                      <p>
                        Administered by{" "}
                        {detail.administeredBy ??
                          medication?.administeredBy ??
                          "not recorded"}
                        {" · "}Update recorded by {event.actor.name} ·{" "}
                        {formatDateTime(event.occurredAt)}
                      </p>
                      {detail.note && <blockquote>“{detail.note}”</blockquote>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="workflow-forward">
          <div>
            <p className="eyebrow">Reviewed output</p>
            <strong>
              Plan status: {formatStatus(episode.patientPlan.status)}
            </strong>
            <p>
              The patient plan separates professional follow-up from
              caregiver observations.
            </p>
          </div>
          <Link className="button button-primary" href="/patient/plan">
            Open patient plan
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
