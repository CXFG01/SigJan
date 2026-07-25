"use client";

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileQuestion,
  FileText,
  FlaskConical,
  History,
  ListChecks,
  MessageSquareText,
  PackageSearch,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDemo } from "@/context/demo-provider";
import {
  calculateCompleteness,
  getLatestReviewAction,
  type Concern,
  type EvidenceRecord,
  type MedicationEntry,
  type ReviewAction,
  type ReviewDisposition,
} from "@/domain";
import "@/styles/professional-workflow.css";

const dispositionOptions: {
  value: ReviewDisposition;
  label: string;
  description: string;
  reasonRequired: boolean;
}[] = [
  {
    value: "accepted_action_required",
    label: "Accepted · action required",
    description: "Record an accountable follow-up action.",
    reasonRequired: false,
  },
  {
    value: "accepted_already_managed",
    label: "Accepted · already managed",
    description: "Document the existing management pathway.",
    reasonRequired: false,
  },
  {
    value: "monitor",
    label: "Monitor",
    description: "Keep the item visible with an owner and review point.",
    reasonRequired: false,
  },
  {
    value: "not_relevant_due_to_context",
    label: "Not relevant due to context",
    description: "Explain which verified context makes the item inapplicable.",
    reasonRequired: true,
  },
  {
    value: "duplicate_or_data_error",
    label: "Duplicate or data error",
    description: "Record the source or reconciliation finding.",
    reasonRequired: true,
  },
  {
    value: "more_information_required",
    label: "More information required",
    description: "Assign the missing-data follow-up.",
    reasonRequired: true,
  },
  {
    value: "escalated",
    label: "Escalated",
    description: "Record the receiving professional or service.",
    reasonRequired: true,
  },
  {
    value: "patient_declined_action",
    label: "Patient declined action",
    description: "Document the discussion and the patient’s decision.",
    reasonRequired: true,
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Date unknown";
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatToken(value: string) {
  return value.replaceAll("_", " ");
}

function sourceFor(
  sourceId: string,
  sources: { id: string; label: string }[],
) {
  return sources.find((source) => source.id === sourceId)?.label ?? sourceId;
}

function MedicationSourceGroup({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: MedicationEntry[];
}) {
  return (
    <section className="review-source-group">
      <header>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span>{entries.length}</span>
      </header>
      <div className="review-source-items">
        {entries.map((entry) => (
          <article key={entry.id}>
            <div>
              <strong>{entry.normalizedName ?? entry.enteredName}</strong>
              <p>
                {entry.strength
                  ? `${entry.strength} ${entry.unit ?? ""}`
                  : "Strength not verified"}
                {" · "}
                {entry.formulation === "unknown"
                  ? "Formulation not verified"
                  : formatToken(entry.formulation)}
              </p>
            </div>
            <dl>
              <div>
                <dt>Use</dt>
                <dd>{formatToken(entry.currentStatus)}</dd>
              </div>
              <div>
                <dt>Confirmation</dt>
                <dd>{formatToken(entry.confirmationStatus)}</dd>
              </div>
            </dl>
            <details>
              <summary>Source excerpt</summary>
              <blockquote>“{entry.sourceExcerpt}”</blockquote>
              <p>{entry.sourceLabel}</p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceDetails({ record }: { record: EvidenceRecord }) {
  return (
    <details className="professional-evidence-record" id={record.id}>
      <summary>
        <span>
          <BookOpen aria-hidden="true" size={17} />
          <strong>{record.title}</strong>
        </span>
        <span className="evidence-state">{formatToken(record.state)}</span>
      </summary>
      <div className="professional-evidence-body">
        <div className="evidence-governance">
          <span>{formatToken(record.tier)}</span>
          <span>{formatToken(record.evidenceType)}</span>
          <span>{formatToken(record.quotationStatus)}</span>
        </div>
        <blockquote>{record.exactSupportingExcerpt}</blockquote>
        <div className="evidence-columns">
          <section>
            <h4>Applicability to this record</h4>
            <ul>
              {record.applicabilityNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4>Limitations</h4>
            <ul>
              {record.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </section>
        </div>
        <dl className="evidence-metadata">
          <div>
            <dt>Evidence owner</dt>
            <dd>{record.organization}</dd>
          </div>
          <div>
            <dt>Jurisdiction</dt>
            <dd>{record.jurisdiction}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{record.version}</dd>
          </div>
          <div>
            <dt>Retrieved</dt>
            <dd>{formatDate(record.retrievedDate)}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}

function ReviewDecisionForm({
  concern,
  existingAction,
}: {
  concern: Concern;
  existingAction?: ReviewAction;
}) {
  const { recordReviewDisposition } = useDemo();
  const [disposition, setDisposition] = useState<ReviewDisposition>(
    existingAction?.disposition ?? "monitor",
  );
  const [reason, setReason] = useState(existingAction?.reason ?? "");
  const [owner, setOwner] = useState(
    existingAction?.owner ?? "Amina Shah, pharmacist",
  );
  const [dueDate, setDueDate] = useState(existingAction?.dueDate ?? "2026-07-29");
  const [followUpAction, setFollowUpAction] = useState(
    existingAction?.followUpAction ?? "",
  );
  const [patientFacingMessage, setPatientFacingMessage] = useState(
    existingAction?.patientFacingMessage ?? "",
  );
  const [feedback, setFeedback] = useState("");
  const selectedOption = dispositionOptions.find(
    (option) => option.value === disposition,
  );
  const reasonRequired = selectedOption?.reasonRequired ?? false;

  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (reasonRequired && !reason.trim()) {
      setFeedback("Add a reason for this context-dependent disposition.");
      return;
    }
    if (disposition === "accepted_action_required" && !followUpAction.trim()) {
      setFeedback("Add the accountable follow-up action.");
      return;
    }
    const result = recordReviewDisposition({
      concernId: concern.id,
      disposition,
      reason,
      owner,
      dueDate,
      followUpAction,
      patientFacingMessage,
    });
    setFeedback(
      result.ok
        ? "Decision recorded in the episode audit log."
        : result.error,
    );
  }

  return (
    <form className="review-decision-form" onSubmit={submitDecision}>
      <div className="review-decision-heading">
        <div>
          <p className="eyebrow">Accountable decision</p>
          <h4>Record pharmacist disposition</h4>
        </div>
        {existingAction && (
          <span className="decision-recorded">
            <CheckCircle2 aria-hidden="true" size={15} />
            Recorded
          </span>
        )}
      </div>

      <label className="field field-full">
        <span className="field-label">Disposition</span>
        <select
          className="select"
          onChange={(event) =>
            setDisposition(event.target.value as ReviewDisposition)
          }
          value={disposition}
        >
          {dispositionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="field-hint">{selectedOption?.description}</span>
      </label>

      <div className="field-grid">
        <label className="field field-full">
          <span className="field-label">
            Reason {reasonRequired ? "(required)" : "(recommended)"}
          </span>
          <textarea
            className="textarea"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Document how the verified record supports this disposition."
            required={reasonRequired}
            value={reason}
          />
        </label>

        <label className="field">
          <span className="field-label">Owner</span>
          <input
            className="input"
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Named person or team"
            value={owner}
          />
        </label>

        <label className="field">
          <span className="field-label">Due date</span>
          <input
            className="input"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </label>

        <label className="field field-full">
          <span className="field-label">
            Follow-up action
            {disposition === "accepted_action_required" ? " (required)" : ""}
          </span>
          <textarea
            className="textarea textarea-compact"
            onChange={(event) => setFollowUpAction(event.target.value)}
            placeholder="State the next accountable professional or information-gathering step."
            required={disposition === "accepted_action_required"}
            value={followUpAction}
          />
        </label>

        <label className="field field-full">
          <span className="field-label">Patient-facing message</span>
          <textarea
            className="textarea textarea-compact"
            onChange={(event) => setPatientFacingMessage(event.target.value)}
            placeholder="Explain what the care team is reviewing and who will follow up."
            value={patientFacingMessage}
          />
        </label>
      </div>

      <div className="review-form-submit">
        <p aria-live="polite" data-error={feedback && !feedback.startsWith("Decision")}>
          {feedback || "Clinical language is checked before this action is saved."}
        </p>
        <button className="button button-primary" type="submit">
          <ClipboardCheck aria-hidden="true" size={17} />
          Save disposition
        </button>
      </div>
    </form>
  );
}

function WorkbenchSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="workbench-section" id={id}>
      <header className="workbench-section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

export default function ProfessionalReviewPage() {
  const params = useParams<{ episodeId: string }>();
  const {
    episode,
    hydrated,
    applySeededProfessionalReview,
    publishReviewedPlan,
  } = useDemo();
  const [actionFeedback, setActionFeedback] = useState("");

  const completeness = useMemo(
    () =>
      calculateCompleteness(episode.medicationEntries, {
        observations: episode.observations,
        requiredObservationCodes: ["egfr"],
      }),
    [episode.medicationEntries, episode.observations],
  );

  const reviewedCount = episode.concerns.filter(
    (concern) => concern.reviewStatus !== "unreviewed",
  ).length;
  const dischargeEntries = episode.medicationEntries.filter(
    (entry) =>
      episode.medicationSources.find((source) => source.id === entry.sourceId)
        ?.type === "discharge_document",
  );
  const homeEntries = episode.medicationEntries.filter(
    (entry) =>
      !dischargeEntries.some((discharge) => discharge.id === entry.id) &&
      entry.currentStatus !== "possibly_stopped",
  );
  const uncertainHomeSupply = episode.medicationEntries.filter(
    (entry) => entry.currentStatus === "possibly_stopped",
  );
  const uniqueMissingInformation = [
    ...new Set(
      episode.concerns.flatMap((concern) => concern.missingInformation),
    ),
  ];
  const knownRouteIds = new Set([episode.id]);

  function loadSeededReview() {
    applySeededProfessionalReview();
    setActionFeedback(
      "Seeded pharmacist decisions loaded. The approved plan and audit history now reflect all three dispositions.",
    );
  }

  function publishPlan() {
    const result = publishReviewedPlan();
    setActionFeedback(
      result.ok
        ? "The reviewed patient plan is published."
        : result.error,
    );
  }

  if (!knownRouteIds.has(params.episodeId)) {
    return (
      <AppShell
        description="This synthetic queue contains one demonstration episode."
        eyebrow="Professional workspace"
        mode="professional"
        title="Review episode not found"
      >
        <Link className="button button-primary" href="/professional">
          <ArrowLeft aria-hidden="true" size={17} />
          Return to review queue
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      actions={
        <>
          <button
            className="button button-secondary"
            disabled={!hydrated}
            onClick={loadSeededReview}
            type="button"
          >
            <Sparkles aria-hidden="true" size={17} />
            Load seeded review
          </button>
          <button
            className="button button-primary"
            disabled={!hydrated}
            onClick={publishPlan}
            type="button"
          >
            <Send aria-hidden="true" size={17} />
            Publish patient plan
          </button>
        </>
      }
      description="Reconcile the source record, inspect governed evidence, record one disposition per concern, and publish only when every concern has an accountable outcome."
      eyebrow={`Professional review · ${formatToken(episode.workflowState)}`}
      mode="professional"
      title={`${episode.patient.name} · post-discharge`}
    >
      <div aria-live="polite" className="workbench-announcement">
        {actionFeedback}
      </div>

      <nav className="workbench-index" aria-label="Review workbench sections">
        {[
          ["record", "Patient record"],
          ["sources", "Source comparison"],
          ["concerns", `Concern queue (${episode.concerns.length})`],
          ["context", "Missing data"],
          ["timeline", "Timeline"],
          ["evidence", "Evidence"],
          ["audit", "Audit"],
          ["plan", "Plan preview"],
        ].map(([href, label], index) => (
          <a href={`#${href}`} key={href}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {label}
          </a>
        ))}
      </nav>

      <div className="professional-workbench">
        <WorkbenchSection
          description="Demographic and clinical context is source-bound synthetic data. It orients review but does not determine a disposition on its own."
          eyebrow="01 · Patient record"
          id="record"
          title="Case orientation"
        >
          <div className="patient-review-summary">
            <section className="patient-identity-panel">
              <span className="patient-monogram patient-monogram-large">EC</span>
              <div>
                <p className="eyebrow">Synthetic patient</p>
                <h3>{episode.patient.name}</h3>
                <p>
                  Age {episode.patient.age} · {episode.patient.recentEvent}
                </p>
              </div>
              <dl>
                <div>
                  <dt>Episode</dt>
                  <dd>{episode.id}</dd>
                </div>
                <div>
                  <dt>Workflow</dt>
                  <dd>{formatToken(episode.workflowState)}</dd>
                </div>
                <div>
                  <dt>As of</dt>
                  <dd>{formatDateTime(episode.asOf)}</dd>
                </div>
              </dl>
            </section>

            <section className="completeness-panel">
              <div className="completeness-heading">
                <div>
                  <p className="eyebrow">Record completeness</p>
                  <h3>Known fields, not safety</h3>
                </div>
                <ListChecks aria-hidden="true" size={23} />
              </div>
              <div className="completeness-measure">
                <span>
                  <strong>Medication list</strong>
                  {completeness.medicationListCompleteness}%
                </span>
                <progress
                  aria-label="Medication list completeness"
                  max="100"
                  value={completeness.medicationListCompleteness}
                />
                <small>
                  {completeness.medicationFieldsComplete} of{" "}
                  {completeness.medicationFieldsExpected} expected fields
                </small>
              </div>
              <div className="completeness-measure">
                <span>
                  <strong>Required context</strong>
                  {completeness.contextCompleteness}%
                </span>
                <progress
                  aria-label="Required context completeness"
                  max="100"
                  value={completeness.contextCompleteness}
                />
                <small>
                  {completeness.contextFieldsComplete} of{" "}
                  {completeness.contextFieldsExpected} required fields
                </small>
              </div>
              <p className="completeness-boundary">
                Completeness measures whether expected data is present. It
                does not measure clinical safety.
              </p>
            </section>
          </div>

          <div className="clinical-context-strip">
            <div>
              <span>
                <UserRound aria-hidden="true" size={17} />
                Recorded conditions
              </span>
              <ul>
                {episode.patient.conditions.map((condition) => (
                  <li key={condition.id}>{condition.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <span>
                <MessageSquareText aria-hidden="true" size={17} />
                Patient-reported symptoms
              </span>
              <ul>
                {episode.symptoms.map((symptom) => (
                  <li key={symptom.id}>
                    {symptom.name} · {formatToken(symptom.status)}
                  </li>
                ))}
              </ul>
              <small>
                Timing is recorded; medicine causality has not been assessed.
              </small>
            </div>
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          description="Products remain attached to their source. Shared ingredients and different formulations are shown separately until professionally reconciled."
          eyebrow="02 · Source comparison"
          id="sources"
          title="What each source says"
        >
          <div className="review-source-columns">
            <MedicationSourceGroup
              entries={dischargeEntries}
              subtitle="Hospital-supplied list dated 22 July"
              title="Discharge record"
            />
            <MedicationSourceGroup
              entries={homeEntries}
              subtitle="Patient voice record and package evidence"
              title="Reported at home"
            />
            <MedicationSourceGroup
              entries={uncertainHomeSupply}
              subtitle="Present in the home; current use not established"
              title="Possibly stopped supply"
            />
          </div>
          <aside className="formulation-note">
            <PackageSearch aria-hidden="true" size={20} />
            <div>
              <strong>Diltiazem / Cardizem record requires reconciliation</strong>
              <p>
                The entries share an active ingredient but record different
                strengths and formulations. They remain separate; the data
                does not establish that both are currently used.
              </p>
            </div>
          </aside>
        </WorkbenchSection>

        <WorkbenchSection
          description="The deterministic fixture contains exactly three primary concerns. Review the four dimensions independently before recording a professional disposition."
          eyebrow="03 · Governed concern queue"
          id="concerns"
          title={`${episode.concerns.length} concerns for professional review`}
        >
          <div className="professional-concern-list">
            {episode.concerns.map((concern, index) => {
              const evidence = concern.evidenceIds
                .map((id) =>
                  episode.evidenceRecords.find((record) => record.id === id),
                )
                .filter((record): record is EvidenceRecord => Boolean(record));
              const existingAction =
                concern.reviewStatus === "unreviewed"
                  ? undefined
                  : getLatestReviewAction(
                      episode.reviewActions,
                      concern.id,
                    );

              return (
                <article
                  className="professional-concern"
                  data-category={concern.category}
                  key={concern.id}
                >
                  <header className="professional-concern-heading">
                    <span className="concern-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="eyebrow">{concern.categoryLabel}</p>
                      <h3>{concern.title}</h3>
                      <p>{concern.productNames.join(" · ")}</p>
                    </div>
                    <span className="review-status">
                      {formatToken(concern.reviewStatus)}
                    </span>
                  </header>

                  <div className="concern-dimensions">
                    <div>
                      <span>Potential severity</span>
                      <strong>{formatToken(concern.potentialSeverity)}</strong>
                    </div>
                    <div>
                      <span>Evidence strength</span>
                      <strong>{formatToken(concern.evidenceStrength)}</strong>
                    </div>
                    <div>
                      <span>Context match</span>
                      <strong>
                        {formatToken(concern.patientContextMatch)}
                      </strong>
                    </div>
                    <div>
                      <span>Data completeness</span>
                      <strong>{formatToken(concern.dataCompleteness)}</strong>
                    </div>
                  </div>

                  <div className="concern-professional-copy">
                    <section>
                      <h4>Why it may matter</h4>
                      <p>{concern.whyItMayMatter}</p>
                    </section>
                    <section>
                      <h4>Potential consequence</h4>
                      <p>{concern.potentialConsequence}</p>
                    </section>
                    <section>
                      <h4>Mechanism summary</h4>
                      <p>{concern.mechanismSummary}</p>
                    </section>
                  </div>

                  <div className="concern-review-context">
                    <section>
                      <h4>
                        <FileQuestion aria-hidden="true" size={17} />
                        Missing or uncertain information
                      </h4>
                      {concern.missingInformation.length ? (
                        <ul>
                          {concern.missingInformation.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No required data gaps are recorded for this rule.</p>
                      )}
                    </section>
                    <section>
                      <h4>
                        <MessageSquareText aria-hidden="true" size={17} />
                        Suggested question
                      </h4>
                      <p>{concern.suggestedQuestion}</p>
                    </section>
                  </div>

                  <div className="concern-evidence-links">
                    <strong>Governed evidence</strong>
                    {evidence.map((record) => (
                      <a href={`#${record.id}`} key={record.id}>
                        {record.title}
                        <ChevronRight aria-hidden="true" size={15} />
                      </a>
                    ))}
                  </div>

                  {existingAction && (
                    <section className="current-resolution">
                      <header>
                        <CheckCircle2 aria-hidden="true" size={18} />
                        <strong>Current resolution</strong>
                        <span>{formatToken(existingAction.disposition)}</span>
                      </header>
                      <dl>
                        <div>
                          <dt>Reason</dt>
                          <dd>{existingAction.reason ?? "No reason recorded"}</dd>
                        </div>
                        <div>
                          <dt>Owner</dt>
                          <dd>{existingAction.owner ?? "Not assigned"}</dd>
                        </div>
                        <div>
                          <dt>Due</dt>
                          <dd>{formatDate(existingAction.dueDate)}</dd>
                        </div>
                        <div>
                          <dt>Follow-up</dt>
                          <dd>
                            {existingAction.followUpAction ??
                              "No follow-up action recorded"}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  )}

                  <ReviewDecisionForm
                    concern={concern}
                    existingAction={existingAction}
                    key={`${concern.id}-${existingAction?.id ?? "new"}-${existingAction?.reviewedAt ?? ""}`}
                  />
                </article>
              );
            })}
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          description="Missing data stays explicit. An incomplete field prompts information gathering rather than a silent assumption."
          eyebrow="04 · Missing data"
          id="context"
          title="Questions that block or qualify review"
        >
          <div className="missing-data-grid">
            <section>
              <span className="missing-data-icon">
                <FlaskConical aria-hidden="true" size={21} />
              </span>
              <div>
                <h3>Required clinical context</h3>
                {completeness.missingContextCodes.length ? (
                  <ul>
                    {completeness.missingContextCodes.map((code) => (
                      <li key={code}>
                        Current {code.toUpperCase()} value and observation date
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>All configured context fields are present.</p>
                )}
              </div>
            </section>
            <section>
              <span className="missing-data-icon">
                <FileQuestion aria-hidden="true" size={21} />
              </span>
              <div>
                <h3>Medication record gaps</h3>
                <ul>
                  {completeness.missingMedicationFields.map((item) => {
                    const entry = episode.medicationEntries.find(
                      (candidate) => candidate.id === item.medicationEntryId,
                    );
                    return (
                      <li key={item.medicationEntryId}>
                        <strong>
                          {entry?.normalizedName ??
                            entry?.enteredName ??
                            item.medicationEntryId}
                        </strong>
                        : {item.fields.map(formatToken).join(", ")}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
            <section>
              <span className="missing-data-icon">
                <MessageSquareText aria-hidden="true" size={21} />
              </span>
              <div>
                <h3>Concern-specific questions</h3>
                <ul>
                  {uniqueMissingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          description="Events are ordered chronologically where dates are known. Temporal proximity is not presented as proof that a medicine caused a symptom."
          eyebrow="05 · Neutral chronology"
          id="timeline"
          title="Medication and symptom timeline"
        >
          <ol className="professional-timeline">
            {episode.timelineEvents.map((event) => (
              <li key={event.id}>
                <span className="timeline-node" aria-hidden="true">
                  <CircleDot size={16} />
                </span>
                <div className="timeline-date">
                  <strong>{formatDate(event.occurredAt)}</strong>
                  <span>{formatToken(event.datePrecision)}</span>
                </div>
                <article>
                  <div>
                    <span>{formatToken(event.type)}</span>
                    <span>{formatToken(event.temporalLanguage)}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <small>
                    Source:{" "}
                    {sourceFor(event.sourceId, episode.medicationSources)}
                  </small>
                </article>
              </li>
            ))}
          </ol>
        </WorkbenchSection>

        <WorkbenchSection
          description="All evidence in this hackathon episode is visibly synthetic and paraphrased. Provenance, applicability, limitations, version, and retrieval date remain inspectable."
          eyebrow="06 · Evidence governance"
          id="evidence"
          title="Evidence records"
        >
          <div className="professional-evidence-list">
            {episode.evidenceRecords.map((record) => (
              <EvidenceDetails key={record.id} record={record} />
            ))}
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          description="Source import, confirmation, caregiver records, workflow changes, decisions, and plan publication are preserved as actor-attributed events."
          eyebrow="07 · Accountability"
          id="audit"
          title="Episode audit trail"
        >
          <div className="audit-table" role="region" aria-label="Audit trail">
            <table>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Action</th>
                  <th scope="col">Entity</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {[...episode.auditEvents]
                  .sort((left, right) =>
                    right.occurredAt.localeCompare(left.occurredAt),
                  )
                  .map((event) => (
                    <tr key={event.id}>
                      <td>{formatDateTime(event.occurredAt)}</td>
                      <td>
                        <strong>{event.actor.name}</strong>
                        <small>{formatToken(event.actor.role)}</small>
                      </td>
                      <td>{formatToken(event.action)}</td>
                      <td>
                        {formatToken(event.entityType)}
                        <small>{event.entityId}</small>
                      </td>
                      <td>
                        {event.details.length
                          ? event.details
                              .map(
                                (detail) =>
                                  `${formatToken(detail.key)}: ${formatToken(detail.value)}`,
                              )
                              .join(" · ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          description="Only a fully reviewed plan can be published. The patient output names the owner, follow-up, unresolved questions, and treatment-change boundary."
          eyebrow="08 · Patient output"
          id="plan"
          title="Plan preview"
        >
          <article className="professional-plan-preview">
            <header>
              <div>
                <p className="eyebrow">Patient-facing review plan</p>
                <h3>{episode.patient.name}</h3>
                <p>
                  Version {episode.patientPlan.version} ·{" "}
                  {formatToken(episode.patientPlan.status)}
                </p>
              </div>
              <span
                className="plan-approval-status"
                data-approved={episode.patientPlan.status === "approved"}
              >
                {episode.patientPlan.status === "approved" ? (
                  <FileCheck2 aria-hidden="true" size={18} />
                ) : (
                  <Clock3 aria-hidden="true" size={18} />
                )}
                {episode.patientPlan.status === "approved"
                  ? "Approved"
                  : `${reviewedCount} of ${episode.concerns.length} reviewed`}
              </span>
            </header>

            <div className="plan-preview-grid">
              <section>
                <h4>What the care team is reviewing</h4>
                {episode.patientPlan.reviewItems.length ? (
                  <ol>
                    {episode.patientPlan.reviewItems.map((item) => (
                      <li key={item.concernId}>
                        <strong>{item.whatCareTeamIsReviewing}</strong>
                        <p>{item.patientFacingMessage}</p>
                        <small>
                          {item.owner ?? "Owner not assigned"} ·{" "}
                          {item.followUpDate
                            ? formatDate(item.followUpDate)
                            : "Date not assigned"}
                        </small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="plan-empty-state">
                    <FileText aria-hidden="true" size={22} />
                    <p>
                      Record a disposition for each concern to build the
                      patient-facing plan.
                    </p>
                  </div>
                )}
              </section>

              <aside>
                <dl>
                  <div>
                    <dt>Contact owner</dt>
                    <dd>
                      {episode.patientPlan.contactOwner ?? "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt>Follow-up</dt>
                    <dd>{formatDate(episode.patientPlan.followUpDate)}</dd>
                  </div>
                  <div>
                    <dt>Approved by</dt>
                    <dd>
                      {episode.patientPlan.approvedBy ?? "Awaiting approval"}
                    </dd>
                  </div>
                </dl>
                <h4>Questions to ask</h4>
                <ul>
                  {episode.patientPlan.questionsToAsk.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </aside>
            </div>

            <div className="plan-safety-boundary">
              <ShieldCheck aria-hidden="true" size={21} />
              <p>{episode.patientPlan.safetyStatement}</p>
            </div>

            <footer>
              <p aria-live="polite">
                {actionFeedback ||
                  "Publishing is blocked until all three concerns have a recorded disposition."}
              </p>
              <button
                className="button button-primary"
                onClick={publishPlan}
                type="button"
              >
                <Send aria-hidden="true" size={17} />
                Publish patient plan
              </button>
            </footer>
          </article>
        </WorkbenchSection>
      </div>

      <aside className="workbench-sticky-status">
        <div>
          <History aria-hidden="true" size={17} />
          <span>
            <strong>
              {reviewedCount}/{episode.concerns.length}
            </strong>{" "}
            concerns reviewed
          </span>
        </div>
        <div>
          <CalendarClock aria-hidden="true" size={17} />
          <span>
            Plan <strong>{formatToken(episode.patientPlan.status)}</strong>
          </span>
        </div>
        <a href="#plan">
          Preview output
          <ChevronRight aria-hidden="true" size={15} />
        </a>
      </aside>
    </AppShell>
  );
}
