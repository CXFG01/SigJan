"use client";

import { useId, useMemo, useState } from "react";
import { Check, FileText, Pencil, Save } from "lucide-react";
import { z } from "zod";
import type {
  MedicationEntry,
  MedicationFieldCorrections,
} from "@/domain";
import { useDemo } from "@/context/demo-provider";

const confirmationLabels: Record<
  MedicationEntry["confirmationStatus"],
  string
> = {
  confirmed: "Confirmed",
  needs_confirmation: "Needs confirmation",
  uncertain_match: "Uncertain match",
  missing_information: "Missing information",
  possibly_stopped: "Possibly stopped",
  corrected: "Corrected",
};

const editableDraftSchema = z
  .object({
    enteredName: z.string().trim().min(1, "Enter the product name."),
    normalizedName: z.string(),
    strength: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (Number.isFinite(Number(value)) && Number(value) > 0),
        "Strength must be a positive number or left unknown.",
      ),
    unit: z.string().trim(),
    dose: z.string().trim(),
    frequency: z.string().trim(),
    route: z.enum([
      "oral",
      "topical",
      "inhaled",
      "injection",
      "other",
      "unknown",
    ]),
    formulation: z.enum([
      "tablet",
      "modified_release_tablet",
      "capsule",
      "liquid",
      "cream",
      "injection",
      "unknown",
    ]),
    category: z.enum([
      "prescription",
      "otc",
      "supplement",
      "vitamin",
      "herbal",
      "food_drink",
    ]),
    startDate: z.string(),
    stopDate: z.string(),
    currentStatus: z.enum([
      "active",
      "intermittent",
      "possibly_stopped",
      "stopped",
      "unknown",
    ]),
    reportedBy: z.string().trim().min(1, "Record who supplied this item."),
    administeredBy: z
      .string()
      .trim()
      .min(1, "Record who administers this item."),
    notes: z.string().trim().max(1000, "Keep notes under 1,000 characters."),
  })
  .strict();

type EditableDraft = z.infer<typeof editableDraftSchema>;

function createDraft(entry: MedicationEntry): EditableDraft {
  return {
    enteredName: entry.enteredName,
    normalizedName: entry.normalizedName ?? "",
    strength: entry.strength?.toString() ?? "",
    unit: entry.unit ?? "",
    dose: entry.dose ?? "",
    frequency: entry.frequency ?? "",
    route: entry.route,
    formulation: entry.formulation,
    category: entry.category,
    startDate: entry.startDate ?? "",
    stopDate: entry.stopDate ?? "",
    currentStatus: entry.currentStatus,
    reportedBy: entry.reportedBy,
    administeredBy: entry.administeredBy,
    notes: entry.notes,
  };
}

export function MedicationConfirmationItem({
  entry,
}: {
  entry: MedicationEntry;
}) {
  const { confirmMedication, correctMedication } = useDemo();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableDraft>(() => createDraft(entry));
  const [announcement, setAnnouncement] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof EditableDraft, string>>
  >({});
  const [formError, setFormError] = useState("");

  const differences = useMemo(() => {
    const original = createDraft(entry);
    return (Object.keys(draft) as Array<keyof EditableDraft>).filter(
      (field) => draft[field] !== original[field],
    );
  }, [draft, entry]);

  function update<K extends keyof EditableDraft>(
    field: K,
    value: EditableDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function saveCorrections() {
    const parsed = editableDraftSchema.safeParse(draft);
    if (!parsed.success) {
      const errors: Partial<Record<keyof EditableDraft, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof EditableDraft | undefined;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      setFormError("Check the highlighted fields before saving.");
      setAnnouncement("Corrections were not saved. Check the form errors.");
      return;
    }

    const original = createDraft(entry);
    const corrections: MedicationFieldCorrections = {};
    for (const field of differences) {
      if (field === "normalizedName") {
        continue;
      }
      let nextValue: string | number | null = parsed.data[field];
      if (field === "strength") {
        nextValue = parsed.data.strength
          ? Number(parsed.data.strength)
          : null;
      } else if (
        ["unit", "dose", "frequency", "startDate", "stopDate"].includes(field)
      ) {
        nextValue = parsed.data[field] || null;
      }
      if (parsed.data[field] !== original[field]) {
        corrections[field] = nextValue;
      }
    }

    const result = correctMedication(entry.id, corrections);
    if (!result.ok) {
      setFormError(result.error);
      setAnnouncement(`Corrections were not saved. ${result.error}`);
      return;
    }

    setFieldErrors({});
    setFormError("");
    setEditing(false);
    setAnnouncement(
      differences.length
        ? `${entry.enteredName} corrections saved with provenance.`
        : `No changes were made to ${entry.enteredName}.`,
    );
  }

  function confirmAsShown() {
    confirmMedication(entry.id);
    setAnnouncement(`${entry.enteredName} confirmed.`);
  }

  const isVerified = ["confirmed", "corrected"].includes(
    entry.confirmationStatus,
  );
  const isCarriedForward = ["missing_information", "possibly_stopped"].includes(
    entry.confirmationStatus,
  );

  return (
    <article className="source-and-editor">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <section className="original-source" aria-label="Original source">
        <div className="original-source-header">
          <div>
            <p className="eyebrow">Original source</p>
            <strong>{entry.sourceLabel}</strong>
          </div>
          <FileText aria-hidden="true" size={20} />
        </div>
        <blockquote className="source-excerpt">
          “{entry.sourceExcerpt}”
        </blockquote>
        <div className="original-source-meta">
          <span>
            <b>Reported by</b> {entry.reportedBy}
          </span>
          <span>
            <b>Captured</b>{" "}
            {new Date(entry.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span>
            <b>Extraction confidence</b>{" "}
            {Math.round(entry.confidence * 100)}%
          </span>
          <span>
            <b>Source ID</b> {entry.sourceId}
          </span>
        </div>
      </section>

      <section className="editor-panel">
        <header className="editor-panel-header">
          <div>
            <span
              className="status-chip"
              data-status={entry.confirmationStatus}
            >
              {confirmationLabels[entry.confirmationStatus]}
            </span>
            <h2>{entry.enteredName}</h2>
            <p className="muted">
              {entry.normalizedName
                ? `Interpreted as ${entry.normalizedName}`
                : "Identity has not been normalised"}
            </p>
          </div>
          <button
            className="button button-secondary"
            onClick={() => setEditing((current) => !current)}
            type="button"
          >
            <Pencil aria-hidden="true" size={16} />
            {editing ? "Close editor" : "Edit fields"}
          </button>
        </header>

        {editing ? (
          <div className="medication-editor-grid">
            <Field
              error={fieldErrors.enteredName}
              label="Entered product name"
              value={draft.enteredName}
              onChange={(value) => update("enteredName", value)}
            />
            <div className="field">
              <label htmlFor={`${entry.id}-normalised-name`}>
                Normalised name
              </label>
              <input
                aria-describedby={`${entry.id}-normalised-name-hint`}
                className="input"
                id={`${entry.id}-normalised-name`}
                readOnly
                value={draft.normalizedName || "Identity not yet mapped"}
              />
              <span
                className="field-hint"
                id={`${entry.id}-normalised-name-hint`}
              >
                Governed mapping. Edit the product name and SignalRx will
                remap the complete clinical identity when you save.
              </span>
            </div>
            <Field
              error={fieldErrors.strength}
              inputMode="decimal"
              label="Strength"
              value={draft.strength}
              onChange={(value) => update("strength", value)}
            />
            <Field
              label="Unit"
              value={draft.unit}
              onChange={(value) => update("unit", value)}
            />
            <Field
              label="Dose actually taken"
              value={draft.dose}
              onChange={(value) => update("dose", value)}
            />
            <Field
              label="Frequency"
              value={draft.frequency}
              onChange={(value) => update("frequency", value)}
            />
            <SelectField
              label="Route"
              value={draft.route}
              onChange={(value) =>
                update("route", value as MedicationEntry["route"])
              }
              options={[
                ["oral", "By mouth"],
                ["topical", "On the skin"],
                ["inhaled", "Inhaled"],
                ["injection", "Injection"],
                ["other", "Other"],
                ["unknown", "I don’t know"],
              ]}
            />
            <SelectField
              label="Formulation"
              value={draft.formulation}
              onChange={(value) =>
                update(
                  "formulation",
                  value as MedicationEntry["formulation"],
                )
              }
              options={[
                ["tablet", "Tablet"],
                ["modified_release_tablet", "Modified-release tablet"],
                ["capsule", "Capsule"],
                ["liquid", "Liquid"],
                ["cream", "Cream"],
                ["injection", "Injection"],
                ["unknown", "I don’t know"],
              ]}
            />
            <SelectField
              label="Product type"
              value={draft.category}
              onChange={(value) =>
                update("category", value as MedicationEntry["category"])
              }
              options={[
                ["prescription", "Prescription"],
                ["otc", "Over-the-counter"],
                ["supplement", "Supplement"],
                ["vitamin", "Vitamin"],
                ["herbal", "Herbal"],
                ["food_drink", "Food or drink exposure"],
              ]}
            />
            <Field
              label="Start date"
              type="date"
              value={draft.startDate}
              onChange={(value) => update("startDate", value)}
            />
            <Field
              label="Stop date"
              type="date"
              value={draft.stopDate}
              onChange={(value) => update("stopDate", value)}
            />
            <SelectField
              label="Current-use status"
              value={draft.currentStatus}
              onChange={(value) =>
                update(
                  "currentStatus",
                  value as MedicationEntry["currentStatus"],
                )
              }
              options={[
                ["active", "Currently taking"],
                ["intermittent", "Taken sometimes"],
                ["possibly_stopped", "Possibly stopped"],
                ["stopped", "Stopped"],
                ["unknown", "I don’t know"],
              ]}
            />
            <Field
              error={fieldErrors.reportedBy}
              label="Who reported it"
              value={draft.reportedBy}
              onChange={(value) => update("reportedBy", value)}
            />
            <Field
              error={fieldErrors.administeredBy}
              label="Who administers it"
              value={draft.administeredBy}
              onChange={(value) => update("administeredBy", value)}
            />
            <div className="field field-full">
              <label htmlFor={`${entry.id}-notes`}>Notes</label>
              <textarea
                className="textarea"
                id={`${entry.id}-notes`}
                onChange={(event) => update("notes", event.target.value)}
                value={draft.notes}
              />
              {fieldErrors.notes && (
                <span className="form-error">{fieldErrors.notes}</span>
              )}
            </div>
            {formError && (
              <p className="form-error field-full" role="alert">
                {formError}
              </p>
            )}
          </div>
        ) : (
          <dl className="medication-facts">
            <Fact label="Strength" value={formatStrength(entry)} />
            <Fact label="Dose" value={entry.dose ?? "Missing"} />
            <Fact label="Frequency" value={entry.frequency ?? "Missing"} />
            <Fact label="Route" value={humanise(entry.route)} />
            <Fact label="Formulation" value={humanise(entry.formulation)} />
            <Fact label="Product type" value={humanise(entry.category)} />
            <Fact
              label="Start date"
              value={entry.startDate ?? "Date uncertain"}
            />
            <Fact
              label="Current use"
              value={humanise(entry.currentStatus)}
            />
            <Fact label="Administered by" value={entry.administeredBy} />
            <Fact label="Notes" value={entry.notes || "No notes recorded"} />
          </dl>
        )}

        <footer className="editor-actions">
          {editing ? (
            <button
              className="button button-primary"
              disabled={!differences.length}
              onClick={saveCorrections}
              type="button"
            >
              <Save aria-hidden="true" size={17} />
              Save corrections
            </button>
          ) : (
            <button
              className="button button-teal"
              disabled={isVerified || isCarriedForward}
              onClick={confirmAsShown}
              type="button"
            >
              <Check aria-hidden="true" size={17} />
              {isVerified
                ? "Checked"
                : isCarriedForward
                  ? "Carried forward unresolved"
                  : "Confirm as shown"}
            </button>
          )}
        </footer>
      </section>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "decimal";
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="input"
        id={id}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error && (
        <span className="form-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        className="select"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatStrength(entry: MedicationEntry): string {
  return entry.strength
    ? `${entry.strength} ${entry.unit ?? ""}`.trim()
    : "Missing or uncertain";
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
