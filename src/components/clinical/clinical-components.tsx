"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileText,
  Info,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  PhoneCall,
  Pill,
  RotateCcw,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import {
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
  useId,
  useState,
} from "react";

export type ConfirmationState =
  | "confirmed"
  | "needs-confirmation"
  | "uncertain-match"
  | "missing-information"
  | "possibly-stopped";

export type MedicationCategory =
  | "prescription"
  | "otc"
  | "supplement"
  | "diet";

export type MedicationSourceKind =
  | "discharge"
  | "patient"
  | "caregiver"
  | "pharmacy"
  | "photo"
  | "voice"
  | "manual"
  | "other";

export type EvidenceTier =
  | "authoritative"
  | "clinical-evidence"
  | "signal"
  | "hypothesis"
  | "insufficient";

export type ConcernCategory =
  | "established-evidence"
  | "context-dependent"
  | "insufficient-evidence";

export type ReviewDisposition =
  | "accepted-action-required"
  | "accepted-already-managed"
  | "monitor"
  | "not-relevant"
  | "duplicate-data-error"
  | "more-information-required"
  | "escalated"
  | "patient-declined";

export interface MedicationSourceView {
  kind: MedicationSourceKind;
  label: string;
  reportedBy?: string;
  capturedAt?: string;
}

export interface MedicationEditorValue {
  productName: string;
  genericName: string;
  strength: string;
  unit: string;
  dose: string;
  frequency: string;
  route: string;
  formulation: string;
  category: MedicationCategory;
  status: ConfirmationState;
  startDate: string;
  stopDate: string;
  currentUse: string;
  source: string;
  reportedBy: string;
  administeredBy: string;
  notes: string;
}

export interface ConfidenceDimensionValue {
  label: string;
  description?: string;
  tone?: "neutral" | "established" | "attention" | "incomplete";
}

export interface EvidenceRecordView {
  id: string;
  title: string;
  organisation: string;
  evidenceType: string;
  tier: EvidenceTier;
  publishedAt?: string;
  retrievedAt: string;
  excerpt: string;
  applicability?: string;
  limitations?: string;
  demoLabel?: string;
}

export interface TimelineEventView {
  id: string;
  title: string;
  kind:
    | "medication-start"
    | "medication-change"
    | "discharge"
    | "otc-use"
    | "supplement-use"
    | "symptom"
    | "symptom-resolution"
    | "review"
    | "follow-up";
  dateLabel: string;
  dateCertainty?: "known" | "approximate" | "unknown";
  description?: string;
  source?: string;
}

export interface AuditEventView {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  detail?: string;
}

export interface DemoDataBannerProps extends HTMLAttributes<HTMLElement> {
  text?: string;
}

export function DemoDataBanner({
  text = "Synthetic demonstration data — no real patient information is shown.",
  className = "",
  ...props
}: DemoDataBannerProps) {
  return (
    <aside
      className={`clinical-demo-banner ${className}`.trim()}
      aria-label="Demonstration data notice"
      {...props}
    >
      <Info aria-hidden="true" size={18} />
      <strong>Synthetic demonstration data</strong>
      <span>{text.replace(/^Synthetic demonstration data\s*[—:-]?\s*/i, "")}</span>
    </aside>
  );
}

export interface SafetyNoticeProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  children?: ReactNode;
  compact?: boolean;
}

export function SafetyNotice({
  title = "Before you act",
  children = "Do not start, stop, or change prescribed treatment based only on SignalRx. Contact a pharmacist, prescriber, or appropriate care service.",
  compact = false,
  className = "",
  ...props
}: SafetyNoticeProps) {
  return (
    <aside
      className={`clinical-notice clinical-notice--safety ${
        compact ? "clinical-notice--compact" : ""
      } ${className}`.trim()}
      aria-label={title}
      {...props}
    >
      <ShieldCheck aria-hidden="true" size={22} />
      <div>
        <strong>{title}</strong>
        <div className="clinical-notice__body">{children}</div>
      </div>
    </aside>
  );
}

export interface EmergencyNoticeProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  message?: string;
  contactLabel?: string;
  contactHref?: string;
}

export function EmergencyNotice({
  title = "When to seek urgent help",
  message = "Seek urgent medical help for severe or rapidly worsening symptoms, major bleeding, difficulty breathing, collapse, severe confusion, or other symptoms that feel immediately dangerous. This list is not exhaustive.",
  contactLabel,
  contactHref,
  className = "",
  ...props
}: EmergencyNoticeProps) {
  return (
    <aside
      className={`clinical-notice clinical-notice--urgent ${className}`.trim()}
      aria-label={title}
      {...props}
    >
      <PhoneCall aria-hidden="true" size={22} />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        {contactLabel && contactHref ? (
          <a className="clinical-inline-action" href={contactHref}>
            {contactLabel}
            <ArrowRight aria-hidden="true" size={16} />
          </a>
        ) : null}
      </div>
    </aside>
  );
}

const confirmationLabels: Record<ConfirmationState, string> = {
  confirmed: "Confirmed",
  "needs-confirmation": "Needs confirmation",
  "uncertain-match": "Uncertain match",
  "missing-information": "Missing information",
  "possibly-stopped": "Possibly stopped",
};

export interface ConfirmationStatusProps {
  status: ConfirmationState;
  label?: string;
  detail?: string;
}

export function ConfirmationStatus({
  status,
  label,
  detail,
}: ConfirmationStatusProps) {
  const Icon = status === "confirmed" ? CheckCircle2 : CircleHelp;
  return (
    <span
      className={`clinical-status clinical-status--${status}`}
      title={detail}
      aria-label={detail ? `${label ?? confirmationLabels[status]}: ${detail}` : undefined}
    >
      <Icon aria-hidden="true" size={15} />
      {label ?? confirmationLabels[status]}
    </span>
  );
}

export interface MedicationSourceBadgeProps {
  source: MedicationSourceView | MedicationSourceKind;
  label?: string;
}

export function MedicationSourceBadge({
  source,
  label,
}: MedicationSourceBadgeProps) {
  const kind = typeof source === "string" ? source : source.kind;
  const text =
    label ?? (typeof source === "string" ? source.replace("-", " ") : source.label);
  return (
    <span className="clinical-source-badge">
      <FileText aria-hidden="true" size={14} />
      <span>{text}</span>
      <span className="sr-only">Source type: {kind}</span>
    </span>
  );
}

const evidenceTierLabels: Record<EvidenceTier, string> = {
  authoritative: "Authoritative source",
  "clinical-evidence": "Clinical evidence",
  signal: "Signal",
  hypothesis: "Research hypothesis",
  insufficient: "Insufficient evidence",
};

export interface EvidenceBadgeProps {
  tier: EvidenceTier;
  label?: string;
}

export function EvidenceBadge({ tier, label }: EvidenceBadgeProps) {
  return (
    <span className={`clinical-evidence-badge clinical-evidence-badge--${tier}`}>
      {label ?? evidenceTierLabels[tier]}
    </span>
  );
}

export interface CompletenessIndicatorProps {
  complete: number;
  total: number;
  label?: string;
  awaitingLabel?: string;
  detail?: string;
}

export function CompletenessIndicator({
  complete,
  total,
  label = "Medication list completeness",
  awaitingLabel = "items awaiting confirmation",
  detail,
}: CompletenessIndicatorProps) {
  const safeTotal = Math.max(0, total);
  const safeComplete = Math.min(Math.max(0, complete), safeTotal);
  const percent = safeTotal === 0 ? 0 : Math.round((safeComplete / safeTotal) * 100);
  const awaiting = safeTotal - safeComplete;
  return (
    <section className="clinical-completeness" aria-labelledby="completeness-label">
      <div className="clinical-completeness__heading">
        <div>
          <p id="completeness-label">{label}</p>
          {detail ? <span>{detail}</span> : null}
        </div>
        <strong aria-label={`${safeComplete} of ${safeTotal} complete`}>
          {safeComplete}/{safeTotal}
        </strong>
      </div>
      <div
        className="clinical-completeness__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeComplete}
        aria-label={label}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="clinical-completeness__note">
        {awaiting} {awaitingLabel}. This measures information completeness, not safety.
      </p>
    </section>
  );
}

export interface MedicationCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  genericName?: string;
  strength?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  formulation?: string;
  category: MedicationCategory;
  status: ConfirmationState;
  source?: MedicationSourceView;
  actualUse?: string;
  administeredBy?: string;
  notes?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function MedicationCard({
  title,
  genericName,
  strength,
  dose,
  frequency,
  route,
  formulation,
  category,
  status,
  source,
  actualUse,
  administeredBy,
  notes,
  actions,
  children,
  className = "",
  ...props
}: MedicationCardProps) {
  const facts = [
    ["Strength", strength],
    ["Dose", dose],
    ["Frequency", frequency],
    ["Route", route],
    ["Formulation", formulation],
    ["Actual use", actualUse],
    ["Administered by", administeredBy],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <article
      className={`clinical-record clinical-medication-card ${className}`.trim()}
      {...props}
    >
      <header className="clinical-record__header">
        <div className="clinical-record__identity">
          <span className={`clinical-category clinical-category--${category}`}>
            <Pill aria-hidden="true" size={15} />
            {category === "otc" ? "Over the counter" : category}
          </span>
          <h3>{title}</h3>
          {genericName ? <p>{genericName}</p> : null}
        </div>
        <ConfirmationStatus status={status} />
      </header>

      {facts.length ? (
        <dl className="clinical-facts">
          {facts.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {source || notes ? (
        <div className="clinical-record__context">
          {source ? <MedicationSourceBadge source={source} /> : null}
          {notes ? <p>{notes}</p> : null}
        </div>
      ) : null}
      {children}
      {actions ? <footer className="clinical-record__actions">{actions}</footer> : null}
    </article>
  );
}

export interface MedicationEditorProps {
  heading?: string;
  initialValue?: Partial<MedicationEditorValue>;
  onSubmit?: (value: MedicationEditorValue) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

const medicationEditorDefaults: MedicationEditorValue = {
  productName: "",
  genericName: "",
  strength: "",
  unit: "mg",
  dose: "",
  frequency: "",
  route: "Oral",
  formulation: "",
  category: "prescription",
  status: "needs-confirmation",
  startDate: "",
  stopDate: "",
  currentUse: "Unknown",
  source: "",
  reportedBy: "",
  administeredBy: "",
  notes: "",
};

export function MedicationEditor({
  heading = "Medication details",
  initialValue,
  onSubmit,
  onCancel,
  submitLabel = "Save medication",
  cancelLabel = "Cancel",
}: MedicationEditorProps) {
  const id = useId();
  const defaults = { ...medicationEditorDefaults, ...initialValue };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = Object.fromEntries(data.entries()) as unknown as MedicationEditorValue;
    onSubmit?.(value);
  }

  return (
    <form className="clinical-editor" onSubmit={handleSubmit}>
      <div className="clinical-editor__heading">
        <div>
          <p className="clinical-kicker">Editable interpretation</p>
          <h3>{heading}</h3>
        </div>
        <ConfirmationStatus status={defaults.status} />
      </div>

      <fieldset className="clinical-fieldset">
        <legend>Identity</legend>
        <div className="clinical-form-grid">
          <ClinicalField id={`${id}-product`} label="Entered product name">
            <input
              id={`${id}-product`}
              name="productName"
              defaultValue={defaults.productName}
              required
            />
          </ClinicalField>
          <ClinicalField id={`${id}-generic`} label="Generic or ingredient name">
            <input
              id={`${id}-generic`}
              name="genericName"
              defaultValue={defaults.genericName}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-category`} label="Product type">
            <select id={`${id}-category`} name="category" defaultValue={defaults.category}>
              <option value="prescription">Prescription</option>
              <option value="otc">Over the counter</option>
              <option value="supplement">Supplement or herbal product</option>
              <option value="diet">Food or drink exposure</option>
            </select>
          </ClinicalField>
          <ClinicalField id={`${id}-confirmation`} label="Confirmation status">
            <select
              id={`${id}-confirmation`}
              name="status"
              defaultValue={defaults.status}
            >
              {Object.entries(confirmationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </ClinicalField>
        </div>
      </fieldset>

      <fieldset className="clinical-fieldset">
        <legend>Dose and use</legend>
        <div className="clinical-form-grid clinical-form-grid--dense">
          <ClinicalField id={`${id}-strength`} label="Strength">
            <input id={`${id}-strength`} name="strength" defaultValue={defaults.strength} />
          </ClinicalField>
          <ClinicalField id={`${id}-unit`} label="Unit">
            <input id={`${id}-unit`} name="unit" defaultValue={defaults.unit} />
          </ClinicalField>
          <ClinicalField id={`${id}-dose`} label="Dose">
            <input id={`${id}-dose`} name="dose" defaultValue={defaults.dose} />
          </ClinicalField>
          <ClinicalField id={`${id}-frequency`} label="Frequency">
            <input
              id={`${id}-frequency`}
              name="frequency"
              defaultValue={defaults.frequency}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-route`} label="Route">
            <input id={`${id}-route`} name="route" defaultValue={defaults.route} />
          </ClinicalField>
          <ClinicalField id={`${id}-formulation`} label="Formulation">
            <input
              id={`${id}-formulation`}
              name="formulation"
              defaultValue={defaults.formulation}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-current-use`} label="Currently taken">
            <select
              id={`${id}-current-use`}
              name="currentUse"
              defaultValue={defaults.currentUse}
            >
              <option>Taken</option>
              <option>Not taken</option>
              <option>Unknown</option>
              <option>Possibly stopped</option>
            </select>
          </ClinicalField>
        </div>
      </fieldset>

      <details className="clinical-editor__details">
        <summary>Dates, source, and notes</summary>
        <div className="clinical-form-grid">
          <ClinicalField id={`${id}-start`} label="Start date">
            <input
              id={`${id}-start`}
              name="startDate"
              type="date"
              defaultValue={defaults.startDate}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-stop`} label="Stop date">
            <input
              id={`${id}-stop`}
              name="stopDate"
              type="date"
              defaultValue={defaults.stopDate}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-source`} label="Source">
            <input id={`${id}-source`} name="source" defaultValue={defaults.source} />
          </ClinicalField>
          <ClinicalField id={`${id}-reporter`} label="Who reported it">
            <input
              id={`${id}-reporter`}
              name="reportedBy"
              defaultValue={defaults.reportedBy}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-admin`} label="Who administers it">
            <input
              id={`${id}-admin`}
              name="administeredBy"
              defaultValue={defaults.administeredBy}
            />
          </ClinicalField>
          <ClinicalField id={`${id}-notes`} label="Notes" wide>
            <textarea id={`${id}-notes`} name="notes" defaultValue={defaults.notes} rows={3} />
          </ClinicalField>
        </div>
      </details>

      <div className="clinical-form-actions">
        {onCancel ? (
          <button className="clinical-button clinical-button--quiet" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
        ) : null}
        <button className="clinical-button clinical-button--primary" type="submit">
          <Check aria-hidden="true" size={17} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function ClinicalField({
  id,
  label,
  hint,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`clinical-field ${wide ? "clinical-field--wide" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <span>{hint}</span> : null}
    </div>
  );
}

export interface DiscrepancyCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  kind:
    | "added-at-home"
    | "possibly-stopped"
    | "duplicate-ingredient"
    | "missing-detail"
    | "formulation-difference"
    | "professional-confirmation";
  summary: string;
  comparison?: Array<{ label: string; value: string }>;
  nextAction?: string;
  status?: ConfirmationState;
  actions?: ReactNode;
}

export function DiscrepancyCard({
  title,
  kind,
  summary,
  comparison = [],
  nextAction,
  status = "needs-confirmation",
  actions,
  className = "",
  ...props
}: DiscrepancyCardProps) {
  return (
    <article className={`clinical-discrepancy ${className}`.trim()} {...props}>
      <header>
        <span className="clinical-kicker">{kind.replaceAll("-", " ")}</span>
        <ConfirmationStatus status={status} />
      </header>
      <h3>{title}</h3>
      <p>{summary}</p>
      {comparison.length ? (
        <dl className="clinical-comparison">
          {comparison.map((item) => (
            <div key={`${item.label}-${item.value}`}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {nextAction ? (
        <p className="clinical-next-action">
          <ArrowRight aria-hidden="true" size={17} />
          <span>
            <strong>Next step:</strong> {nextAction}
          </span>
        </p>
      ) : null}
      {actions ? <footer className="clinical-record__actions">{actions}</footer> : null}
    </article>
  );
}

export interface ConfidenceDimensionsProps {
  potentialSeverity: ConfidenceDimensionValue;
  evidenceStrength: ConfidenceDimensionValue;
  patientContextMatch: ConfidenceDimensionValue;
  dataCompleteness: ConfidenceDimensionValue;
}

export function ConfidenceDimensions({
  potentialSeverity,
  evidenceStrength,
  patientContextMatch,
  dataCompleteness,
}: ConfidenceDimensionsProps) {
  const dimensions = [
    ["Potential severity", potentialSeverity],
    ["Evidence strength", evidenceStrength],
    ["Patient-context match", patientContextMatch],
    ["Data completeness", dataCompleteness],
  ] as const;
  return (
    <dl className="clinical-dimensions" aria-label="Four independent review dimensions">
      {dimensions.map(([name, value]) => (
        <div
          className={`clinical-dimension clinical-dimension--${value.tone ?? "neutral"}`}
          key={name}
        >
          <dt>{name}</dt>
          <dd>{value.label}</dd>
          {value.description ? <p>{value.description}</p> : null}
        </div>
      ))}
    </dl>
  );
}

export interface MissingContextListProps {
  title?: string;
  items: Array<{
    id: string;
    label: string;
    detail?: string;
    resolved?: boolean;
  }>;
}

export function MissingContextList({
  title = "Information still needed",
  items,
}: MissingContextListProps) {
  return (
    <section className="clinical-missing-context" aria-labelledby="missing-context-title">
      <h4 id="missing-context-title">{title}</h4>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span className="clinical-missing-context__icon" aria-hidden="true">
                {item.resolved ? <Check size={15} /> : <CircleHelp size={15} />}
              </span>
              <span>
                <strong>{item.label}</strong>
                {item.detail ? <small>{item.detail}</small> : null}
                <span className="sr-only">
                  {item.resolved ? "Resolved" : "Still needed"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No additional context is currently listed.</p>
      )}
    </section>
  );
}

export interface ProfessionalQuestionProps {
  question: string;
  context?: string;
  label?: string;
  actions?: ReactNode;
}

export function ProfessionalQuestion({
  question,
  context,
  label = "Question for the pharmacist",
  actions,
}: ProfessionalQuestionProps) {
  return (
    <section className="clinical-question" aria-label={label}>
      <MessageSquareText aria-hidden="true" size={21} />
      <div>
        <span>{label}</span>
        <blockquote>{question}</blockquote>
        {context ? <p>{context}</p> : null}
        {actions}
      </div>
    </section>
  );
}

export interface EvidenceDrawerProps {
  records: EvidenceRecordView[];
  summary?: string;
  defaultOpen?: boolean;
  emptyMessage?: string;
}

export function EvidenceDrawer({
  records,
  summary = "Review evidence and source limits",
  defaultOpen = false,
  emptyMessage = "No evidence record is attached.",
}: EvidenceDrawerProps) {
  return (
    <details className="clinical-evidence-drawer" open={defaultOpen}>
      <summary>
        <span>
          <FileText aria-hidden="true" size={18} />
          {summary}
        </span>
        <ChevronRight className="clinical-evidence-drawer__chevron" aria-hidden="true" size={18} />
      </summary>
      <div className="clinical-evidence-drawer__content">
        {records.length ? (
          records.map((record) => (
            <article className="clinical-evidence-record" key={record.id}>
              <header>
                <div>
                  <h4>{record.title}</h4>
                  <p>{record.organisation}</p>
                </div>
                <EvidenceBadge tier={record.tier} />
              </header>
              <dl className="clinical-evidence-meta">
                <div>
                  <dt>Evidence type</dt>
                  <dd>{record.evidenceType}</dd>
                </div>
                {record.publishedAt ? (
                  <div>
                    <dt>Published or updated</dt>
                    <dd>{record.publishedAt}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Retrieved</dt>
                  <dd>{record.retrievedAt}</dd>
                </div>
              </dl>
              <div className="clinical-evidence-excerpt">
                <span>Supporting excerpt</span>
                <p>{record.excerpt}</p>
                {record.demoLabel ? <small>{record.demoLabel}</small> : null}
              </div>
              {record.applicability ? (
                <p>
                  <strong>Applicability:</strong> {record.applicability}
                </p>
              ) : null}
              {record.limitations ? (
                <p>
                  <strong>Limitations:</strong> {record.limitations}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p>{emptyMessage}</p>
        )}
      </div>
    </details>
  );
}

export interface ConcernCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  category: ConcernCategory;
  status: string;
  products: string[];
  potentialConsequence: string;
  whyItMatters: string;
  mechanismSummary?: string;
  dimensions: ConfidenceDimensionsProps;
  missingInformation?: MissingContextListProps["items"];
  professionalQuestion: string;
  evidence: EvidenceRecordView[];
  reviewStatus?: string;
  actions?: ReactNode;
}

const concernCategoryLabels: Record<ConcernCategory, string> = {
  "established-evidence": "Established evidence · current review needed",
  "context-dependent": "Context-dependent monitoring",
  "insufficient-evidence": "Insufficient evidence",
};

export function ConcernCard({
  title,
  category,
  status,
  products,
  potentialConsequence,
  whyItMatters,
  mechanismSummary,
  dimensions,
  missingInformation = [],
  professionalQuestion,
  evidence,
  reviewStatus,
  actions,
  className = "",
  ...props
}: ConcernCardProps) {
  return (
    <article
      className={`clinical-record clinical-concern clinical-concern--${category} ${className}`.trim()}
      {...props}
    >
      <header className="clinical-concern__header">
        <div>
          <span className="clinical-kicker">{concernCategoryLabels[category]}</span>
          <h3>{title}</h3>
        </div>
        <span className="clinical-review-label">{reviewStatus ?? status}</span>
      </header>
      <div className="clinical-product-list" aria-label="Products involved">
        <span>Products involved</span>
        <ul>
          {products.map((product) => (
            <li key={product}>{product}</li>
          ))}
        </ul>
      </div>
      {category === "insufficient-evidence" ? (
        <p className="clinical-insufficient-copy">
          SignalRx does not have enough verified information to classify this
          combination as safe or unsafe.
        </p>
      ) : null}
      <div className="clinical-concern__explanation">
        <section>
          <h4>Potential consequence</h4>
          <p>{potentialConsequence}</p>
        </section>
        <section>
          <h4>Why it may matter</h4>
          <p>{whyItMatters}</p>
        </section>
        {mechanismSummary ? (
          <section>
            <h4>Mechanism summary</h4>
            <p>{mechanismSummary}</p>
          </section>
        ) : null}
      </div>
      <ConfidenceDimensions {...dimensions} />
      {missingInformation.length ? (
        <MissingContextList items={missingInformation} />
      ) : null}
      <ProfessionalQuestion question={professionalQuestion} />
      <EvidenceDrawer records={evidence} />
      {actions ? <footer className="clinical-record__actions">{actions}</footer> : null}
    </article>
  );
}

export interface SymptomEventProps {
  event: TimelineEventView;
}

export function SymptomEvent({ event }: SymptomEventProps) {
  return (
    <article className="clinical-timeline-event clinical-timeline-event--symptom">
      <span className="clinical-timeline-event__marker" aria-hidden="true">
        <AlertCircle size={16} />
      </span>
      <div>
        <time>{event.dateLabel}</time>
        <h4>{event.title}</h4>
        {event.description ? <p>{event.description}</p> : null}
        <small>
          Timing requires review. This does not prove that a medicine caused the symptom.
        </small>
      </div>
    </article>
  );
}

export interface MedicationTimelineProps {
  events: TimelineEventView[];
  heading?: string;
  description?: string;
}

export function MedicationTimeline({
  events,
  heading = "Medication and symptom timeline",
  description = "Events are shown in reported order. Overlap does not establish causality.",
}: MedicationTimelineProps) {
  return (
    <section className="clinical-timeline" aria-labelledby="timeline-heading">
      <div className="clinical-section-heading">
        <div>
          <h3 id="timeline-heading">{heading}</h3>
          <p>{description}</p>
        </div>
      </div>
      <ol>
        {events.map((event) => (
          <li key={event.id}>
            {event.kind === "symptom" || event.kind === "symptom-resolution" ? (
              <SymptomEvent event={event} />
            ) : (
              <article className={`clinical-timeline-event clinical-timeline-event--${event.kind}`}>
                <span className="clinical-timeline-event__marker" aria-hidden="true">
                  {event.kind === "review" || event.kind === "follow-up" ? (
                    <ClipboardCheck size={16} />
                  ) : (
                    <Pill size={16} />
                  )}
                </span>
                <div>
                  <time>
                    {event.dateLabel}
                    {event.dateCertainty && event.dateCertainty !== "known"
                      ? ` · ${event.dateCertainty} date`
                      : ""}
                  </time>
                  <h4>{event.title}</h4>
                  {event.description ? <p>{event.description}</p> : null}
                  {event.source ? <small>Source: {event.source}</small> : null}
                </div>
              </article>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

const dispositionLabels: Record<ReviewDisposition, string> = {
  "accepted-action-required": "Accepted and action required",
  "accepted-already-managed": "Accepted and already managed",
  monitor: "Monitor",
  "not-relevant": "Not relevant due to context",
  "duplicate-data-error": "Duplicate or data error",
  "more-information-required": "More information required",
  escalated: "Escalated",
  "patient-declined": "Patient declined action",
};

export interface ReviewDispositionValue {
  disposition: ReviewDisposition;
  reason: string;
  owner: string;
  dueDate: string;
  followUpAction: string;
  patientMessage: string;
}

export interface ReviewDispositionFormProps {
  concernId?: string;
  heading?: string;
  initialValue?: Partial<ReviewDispositionValue>;
  owners?: string[];
  requiredReasons?: ReviewDisposition[];
  onSubmit?: (value: ReviewDispositionValue) => void;
  submitLabel?: string;
}

export function ReviewDispositionForm({
  concernId,
  heading = "Record professional review",
  initialValue,
  owners = [],
  requiredReasons = [
    "not-relevant",
    "duplicate-data-error",
    "more-information-required",
    "escalated",
    "patient-declined",
  ],
  onSubmit,
  submitLabel = "Save review decision",
}: ReviewDispositionFormProps) {
  const id = useId();
  const [disposition, setDisposition] = useState<ReviewDisposition>(
    initialValue?.disposition ?? "more-information-required",
  );
  const reasonRequired = requiredReasons.includes(disposition);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit?.({
      disposition: data.get("disposition") as ReviewDisposition,
      reason: String(data.get("reason") ?? ""),
      owner: String(data.get("owner") ?? ""),
      dueDate: String(data.get("dueDate") ?? ""),
      followUpAction: String(data.get("followUpAction") ?? ""),
      patientMessage: String(data.get("patientMessage") ?? ""),
    });
  }

  return (
    <form className="clinical-review-form" onSubmit={handleSubmit}>
      <input name="concernId" type="hidden" value={concernId} />
      <div className="clinical-editor__heading">
        <div>
          <p className="clinical-kicker">Accountable resolution</p>
          <h3>{heading}</h3>
        </div>
        <UserRoundCheck aria-hidden="true" size={24} />
      </div>
      <div className="clinical-form-grid">
        <ClinicalField id={`${id}-disposition`} label="Disposition">
          <select
            id={`${id}-disposition`}
            name="disposition"
            value={disposition}
            onChange={(event) => setDisposition(event.target.value as ReviewDisposition)}
          >
            {Object.entries(dispositionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </ClinicalField>
        <ClinicalField id={`${id}-owner`} label="Owner">
          {owners.length ? (
            <select id={`${id}-owner`} name="owner" defaultValue={initialValue?.owner ?? ""}>
              <option value="">Select owner</option>
              {owners.map((owner) => (
                <option key={owner}>{owner}</option>
              ))}
            </select>
          ) : (
            <input
              id={`${id}-owner`}
              name="owner"
              defaultValue={initialValue?.owner}
              placeholder="Name or team"
            />
          )}
        </ClinicalField>
        <ClinicalField id={`${id}-due`} label="Due date">
          <input
            id={`${id}-due`}
            name="dueDate"
            type="date"
            defaultValue={initialValue?.dueDate}
          />
        </ClinicalField>
        <ClinicalField
          id={`${id}-reason`}
          label={`Reason${reasonRequired ? " (required)" : " (optional)"}`}
          wide
        >
          <textarea
            id={`${id}-reason`}
            name="reason"
            rows={3}
            required={reasonRequired}
            defaultValue={initialValue?.reason}
          />
        </ClinicalField>
        <ClinicalField id={`${id}-follow-up`} label="Follow-up action" wide>
          <textarea
            id={`${id}-follow-up`}
            name="followUpAction"
            rows={2}
            defaultValue={initialValue?.followUpAction}
          />
        </ClinicalField>
        <ClinicalField id={`${id}-patient-message`} label="Patient-facing message" wide>
          <textarea
            id={`${id}-patient-message`}
            name="patientMessage"
            rows={3}
            defaultValue={initialValue?.patientMessage}
            aria-describedby={`${id}-message-hint`}
          />
          <span id={`${id}-message-hint`}>
            Do not include autonomous medication-change instructions.
          </span>
        </ClinicalField>
      </div>
      <div className="clinical-form-actions">
        <button className="clinical-button clinical-button--primary" type="submit">
          <ClipboardCheck aria-hidden="true" size={17} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export interface AuditTrailProps {
  events: AuditEventView[];
  heading?: string;
  emptyMessage?: string;
}

export function AuditTrail({
  events,
  heading = "Resolution history",
  emptyMessage = "No review activity has been recorded yet.",
}: AuditTrailProps) {
  return (
    <section className="clinical-audit" aria-labelledby="audit-heading">
      <div className="clinical-section-heading">
        <h3 id="audit-heading">{heading}</h3>
        <LockKeyhole aria-hidden="true" size={19} />
      </div>
      {events.length ? (
        <ol>
          {events.map((event) => (
            <li key={event.id}>
              <span aria-hidden="true">
                <Check size={14} />
              </span>
              <div>
                <h4>{event.action}</h4>
                <p>
                  {event.actor} · <time>{event.timestamp}</time>
                </p>
                {event.detail ? <small>{event.detail}</small> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </section>
  );
}

export interface PatientPlanMedication {
  id: string;
  name: string;
  directions?: string;
  status: "verified" | "awaiting-confirmation";
}

export interface PatientPlanProps extends HTMLAttributes<HTMLElement> {
  patientName: string;
  status?: "draft" | "approved";
  approvedAt?: string;
  reviewedBy?: string;
  medications: PatientPlanMedication[];
  reviewItems?: string[];
  contactName?: string;
  followUpDate?: string;
  questions?: string[];
  safetyMessage?: string;
  actions?: ReactNode;
}

export function PatientPlan({
  patientName,
  status = "approved",
  approvedAt,
  reviewedBy,
  medications,
  reviewItems = [],
  contactName,
  followUpDate,
  questions = [],
  safetyMessage,
  actions,
  className = "",
  ...props
}: PatientPlanProps) {
  const verified = medications.filter((item) => item.status === "verified");
  const awaiting = medications.filter((item) => item.status === "awaiting-confirmation");
  return (
    <article className={`clinical-plan ${className}`.trim()} {...props}>
      <header className="clinical-plan__header">
        <div>
          <p className="clinical-kicker">
            {status === "approved" ? "Professionally reviewed plan" : "Draft plan"}
          </p>
          <h2>{patientName}&rsquo;s medication plan</h2>
          {reviewedBy || approvedAt ? (
            <p>
              {[reviewedBy ? `Reviewed by ${reviewedBy}` : "", approvedAt]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
        <span className={`clinical-plan__status clinical-plan__status--${status}`}>
          {status === "approved" ? <CheckCircle2 aria-hidden="true" size={17} /> : <Clock3 aria-hidden="true" size={17} />}
          {status}
        </span>
      </header>

      <section className="clinical-plan__section">
        <h3>Verified medication list</h3>
        <ul className="clinical-plan__medications">
          {verified.map((item) => (
            <li key={item.id}>
              <Check aria-hidden="true" size={16} />
              <span>
                <strong>{item.name}</strong>
                {item.directions ? <small>{item.directions}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {awaiting.length ? (
        <section className="clinical-plan__section">
          <h3>Still awaiting confirmation</h3>
          <ul className="clinical-plan__medications clinical-plan__medications--awaiting">
            {awaiting.map((item) => (
              <li key={item.id}>
                <CircleHelp aria-hidden="true" size={16} />
                <span>
                  <strong>{item.name}</strong>
                  {item.directions ? <small>{item.directions}</small> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reviewItems.length ? (
        <section className="clinical-plan__section">
          <h3>What the care team is reviewing</h3>
          <ul className="clinical-simple-list">
            {reviewItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {contactName || followUpDate ? (
        <dl className="clinical-plan__follow-up">
          {contactName ? (
            <div>
              <dt>Who will contact you</dt>
              <dd>{contactName}</dd>
            </div>
          ) : null}
          {followUpDate ? (
            <div>
              <dt>Follow-up date</dt>
              <dd>{followUpDate}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {questions.length ? (
        <section className="clinical-plan__section">
          <h3>Questions to ask</h3>
          <ol className="clinical-numbered-list">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </section>
      ) : null}
      <SafetyNotice>{safetyMessage}</SafetyNotice>
      {actions ? <footer className="clinical-record__actions">{actions}</footer> : null}
    </article>
  );
}

export interface CaregiverPermissionCardProps extends HTMLAttributes<HTMLElement> {
  patientName: string;
  caregiverName: string;
  status: "active" | "pending" | "revoked";
  permissions: string[];
  expiresAt?: string;
  onManage?: () => void;
  manageLabel?: string;
}

export function CaregiverPermissionCard({
  patientName,
  caregiverName,
  status,
  permissions,
  expiresAt,
  onManage,
  manageLabel = "Manage sharing",
  className = "",
  ...props
}: CaregiverPermissionCardProps) {
  return (
    <article className={`clinical-permission ${className}`.trim()} {...props}>
      <header>
        <span className="clinical-permission__icon">
          <LockKeyhole aria-hidden="true" size={20} />
        </span>
        <div>
          <p>Patient-controlled sharing</p>
          <h3>{caregiverName}</h3>
        </div>
        <span className={`clinical-permission__status clinical-permission__status--${status}`}>
          {status}
        </span>
      </header>
      <p>
        {patientName} controls this permission and can change or withdraw it.
      </p>
      <ul className="clinical-simple-list">
        {permissions.map((permission) => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
      {expiresAt ? <small>Permission review date: {expiresAt}</small> : null}
      {onManage ? (
        <button className="clinical-button clinical-button--secondary" onClick={onManage} type="button">
          {manageLabel}
        </button>
      ) : null}
    </article>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon = <FileText aria-hidden="true" size={24} />,
}: EmptyStateProps) {
  return (
    <section className="clinical-state" aria-labelledby="empty-state-title">
      <span className="clinical-state__icon">{icon}</span>
      <div>
        <h3 id="empty-state-title">{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}

export interface LoadingStateProps {
  label?: string;
  detail?: string;
}

export function LoadingState({
  label = "Loading medication information",
  detail = "Keeping the original source and your confirmed details together.",
}: LoadingStateProps) {
  return (
    <div className="clinical-state clinical-state--loading" role="status" aria-live="polite">
      <span className="clinical-state__icon">
        <LoaderCircle className="clinical-spin" aria-hidden="true" size={24} />
      </span>
      <div>
        <h3>{label}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "We could not load this information",
  message,
  retryLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="clinical-state clinical-state--error" role="alert">
      <span className="clinical-state__icon">
        <AlertTriangle aria-hidden="true" size={24} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="clinical-button clinical-button--secondary" onClick={onRetry} type="button">
          <RotateCcw aria-hidden="true" size={16} />
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
