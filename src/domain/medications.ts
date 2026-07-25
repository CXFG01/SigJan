import { z } from "zod";

import { createAuditEvent } from "./audit";
import { normalizeMedicationName } from "./normalization";
import {
  ActorSchema,
  ConfirmationStatusSchema,
  DomainIdSchema,
  ExposureStatusSchema,
  FieldProvenanceSchema,
  IsoDateSchema,
  MedicationEntrySchema,
  MedicationFieldSchema,
  type Actor,
  type AuditEvent,
  type MedicationEntry,
  type MedicationField,
  type Observation,
} from "./schemas";

export const ExposureOverlapResultSchema = z
  .object({
    status: ExposureStatusSchema,
    overlapStart: IsoDateSchema.nullable(),
    overlapEnd: IsoDateSchema.nullable(),
    rationale: z.string().min(1),
  })
  .strict();
export type ExposureOverlapResult = z.infer<
  typeof ExposureOverlapResultSchema
>;

function asDate(value: string): string {
  return value.slice(0, 10);
}

function isOpenExposure(entry: MedicationEntry): boolean {
  return (
    entry.currentStatus === "active" ||
    entry.currentStatus === "intermittent"
  );
}

export function calculateExposureOverlap(
  left: MedicationEntry,
  right: MedicationEntry,
  asOf: string,
): ExposureOverlapResult {
  const asOfDate = IsoDateSchema.parse(asDate(asOf));
  const leftEnd =
    left.stopDate ?? (isOpenExposure(left) ? asOfDate : null);
  const rightEnd =
    right.stopDate ?? (isOpenExposure(right) ? asOfDate : null);

  if (
    isOpenExposure(left) &&
    isOpenExposure(right) &&
    (!left.startDate || left.startDate <= asOfDate) &&
    (!right.startDate || right.startDate <= asOfDate)
  ) {
    const knownStarts = [left.startDate, right.startDate].filter(
      (value): value is string => value !== null,
    );
    return ExposureOverlapResultSchema.parse({
      status: "overlap",
      overlapStart:
        knownStarts.length === 2
          ? knownStarts.sort().at(-1) ?? null
          : asOfDate,
      overlapEnd: asOfDate,
      rationale:
        "Both products are reported as current at the episode reference date.",
    });
  }

  if (left.startDate && right.startDate && leftEnd && rightEnd) {
    const overlapStart =
      left.startDate > right.startDate ? left.startDate : right.startDate;
    const overlapEnd = leftEnd < rightEnd ? leftEnd : rightEnd;

    if (overlapStart <= overlapEnd) {
      return ExposureOverlapResultSchema.parse({
        status: "overlap",
        overlapStart,
        overlapEnd,
        rationale: "The recorded exposure intervals intersect.",
      });
    }

    return ExposureOverlapResultSchema.parse({
      status: "no_overlap",
      overlapStart: null,
      overlapEnd: null,
      rationale: "The recorded exposure intervals do not intersect.",
    });
  }

  if (
    (left.stopDate && right.startDate && left.stopDate < right.startDate) ||
    (right.stopDate && left.startDate && right.stopDate < left.startDate)
  ) {
    return ExposureOverlapResultSchema.parse({
      status: "no_overlap",
      overlapStart: null,
      overlapEnd: null,
      rationale:
        "One recorded exposure ended before the other recorded exposure began.",
    });
  }

  return ExposureOverlapResultSchema.parse({
    status: "unknown",
    overlapStart: null,
    overlapEnd: null,
    rationale:
      "At least one start, stop, or current-use value is too uncertain to establish overlap.",
  });
}

export type FormulationComparison =
  | "same"
  | "different"
  | "unknown"
  | "not_comparable";

export function compareFormulations(
  left: MedicationEntry,
  right: MedicationEntry,
): FormulationComparison {
  const sharedIngredients = left.ingredientIds.filter((ingredientId) =>
    right.ingredientIds.includes(ingredientId),
  );
  if (sharedIngredients.length === 0) {
    return "not_comparable";
  }
  if (left.formulation === "unknown" || right.formulation === "unknown") {
    return "unknown";
  }
  return left.formulation === right.formulation ? "same" : "different";
}

export const DuplicateIngredientFindingSchema = z
  .object({
    id: DomainIdSchema,
    ingredientId: DomainIdSchema,
    medicationEntryIds: z.tuple([DomainIdSchema, DomainIdSchema]),
    kind: z.enum([
      "possible_duplicate",
      "formulation_difference",
      "formulation_ambiguity",
    ]),
    exposureStatus: ExposureStatusSchema,
    requiresConfirmation: z.literal(true),
    explanation: z.string().min(1),
  })
  .strict();
export type DuplicateIngredientFinding = z.infer<
  typeof DuplicateIngredientFindingSchema
>;

export function detectDuplicateIngredients(
  entries: readonly MedicationEntry[],
  asOf: string,
): DuplicateIngredientFinding[] {
  const findings: DuplicateIngredientFinding[] = [];

  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < entries.length;
      rightIndex += 1
    ) {
      const left = entries[leftIndex];
      const right = entries[rightIndex];
      const sharedIngredients = left.ingredientIds.filter((ingredientId) =>
        right.ingredientIds.includes(ingredientId),
      );
      if (sharedIngredients.length === 0) {
        continue;
      }

      const exposure = calculateExposureOverlap(left, right, asOf);
      if (exposure.status === "no_overlap") {
        continue;
      }

      const formulation = compareFormulations(left, right);
      const kind =
        formulation === "different"
          ? "formulation_difference"
          : formulation === "unknown"
            ? "formulation_ambiguity"
            : "possible_duplicate";
      const explanation =
        kind === "formulation_difference"
          ? "These records share an active ingredient but have different formulations; they must not be collapsed or added together without confirmation."
          : kind === "formulation_ambiguity"
            ? "These records share an active ingredient, but formulation information is incomplete."
            : "These records share an active ingredient during a possible or confirmed exposure overlap.";

      for (const ingredientId of sharedIngredients) {
        findings.push(
          DuplicateIngredientFindingSchema.parse({
            id: `duplicate-${ingredientId.replace(/^ingredient-/u, "")}-${left.id.replace(/^med-/u, "")}-${right.id.replace(/^med-/u, "")}`,
            ingredientId,
            medicationEntryIds: [left.id, right.id],
            kind,
            exposureStatus: exposure.status,
            requiresConfirmation: true,
            explanation,
          }),
        );
      }
    }
  }

  return findings.sort((left, right) => left.id.localeCompare(right.id));
}

const MedicationMissingFieldSchema = z
  .object({
    medicationEntryId: DomainIdSchema,
    fields: z.array(z.string().min(1)),
  })
  .strict();

export const CompletenessResultSchema = z
  .object({
    medicationListCompleteness: z.number().int().min(0).max(100),
    contextCompleteness: z.number().int().min(0).max(100),
    medicationFieldsComplete: z.number().int().nonnegative(),
    medicationFieldsExpected: z.number().int().nonnegative(),
    contextFieldsComplete: z.number().int().nonnegative(),
    contextFieldsExpected: z.number().int().nonnegative(),
    missingMedicationFields: z.array(MedicationMissingFieldSchema),
    missingContextCodes: z.array(z.string().min(1)),
    itemsAwaitingConfirmation: z.array(DomainIdSchema),
  })
  .strict();
export type CompletenessResult = z.infer<typeof CompletenessResultSchema>;

const completenessFields = [
  "normalizedName",
  "ingredient",
  "strength",
  "unit",
  "dose",
  "frequency",
  "route",
  "formulation",
  "startDate",
  "currentStatus",
  "sourceId",
  "reportedBy",
  "administeredBy",
  "confirmationStatus",
] as const;

function isCompletenessValuePresent(
  entry: MedicationEntry,
  field: (typeof completenessFields)[number],
): boolean {
  const value = entry[field];
  if (value === null || value === "") {
    return false;
  }
  if (value === "unknown") {
    return false;
  }
  if (
    field === "confirmationStatus" &&
    !["confirmed", "corrected"].includes(String(value))
  ) {
    return false;
  }
  return true;
}

export interface CompletenessContext {
  observations: readonly Observation[];
  requiredObservationCodes: readonly string[];
}

export function calculateCompleteness(
  entries: readonly MedicationEntry[],
  context: CompletenessContext,
): CompletenessResult {
  const missingMedicationFields = entries
    .map((entry) => ({
      medicationEntryId: entry.id,
      fields: completenessFields.filter(
        (field) => !isCompletenessValuePresent(entry, field),
      ),
    }))
    .filter((entry) => entry.fields.length > 0);

  const medicationFieldsExpected = entries.length * completenessFields.length;
  const missingMedicationFieldCount = missingMedicationFields.reduce(
    (total, entry) => total + entry.fields.length,
    0,
  );
  const medicationFieldsComplete =
    medicationFieldsExpected - missingMedicationFieldCount;
  const availableObservationCodes = new Set(
    context.observations
      .filter(
        (observation) =>
          observation.status === "available" && observation.value !== null,
      )
      .map((observation) => observation.code),
  );
  const requiredContextCodes = [...new Set(context.requiredObservationCodes)];
  const missingContextCodes = requiredContextCodes.filter(
    (code) => !availableObservationCodes.has(code),
  );
  const contextFieldsComplete =
    requiredContextCodes.length - missingContextCodes.length;

  return CompletenessResultSchema.parse({
    medicationListCompleteness:
      medicationFieldsExpected === 0
        ? 0
        : Math.round(
            (medicationFieldsComplete / medicationFieldsExpected) * 100,
          ),
    contextCompleteness:
      requiredContextCodes.length === 0
        ? 100
        : Math.round(
            (contextFieldsComplete / requiredContextCodes.length) * 100,
          ),
    medicationFieldsComplete,
    medicationFieldsExpected,
    contextFieldsComplete,
    contextFieldsExpected: requiredContextCodes.length,
    missingMedicationFields,
    missingContextCodes,
    itemsAwaitingConfirmation: entries
      .filter(
        (entry) =>
          !["confirmed", "corrected"].includes(entry.confirmationStatus),
      )
      .map((entry) => entry.id),
  });
}

function toProvenanceValue(value: unknown): string | number | boolean | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  throw new Error("Medication provenance supports scalar values only");
}

function fieldSlug(field: MedicationField): string {
  return field.replace(/([a-z])([A-Z])/gu, "$1-$2").toLocaleLowerCase("en-GB");
}

export type MedicationFieldCorrections = Partial<
  Record<MedicationField, string | number | null>
>;

interface MedicationCorrectionOptions {
  additionalPatch?: Partial<MedicationEntry>;
  confirmationStatus?: MedicationEntry["confirmationStatus"];
}

function applyMedicationFieldCorrections(
  rawEntry: MedicationEntry,
  rawCorrections: MedicationFieldCorrections,
  rawActor: Actor,
  occurredAt: string,
  options: MedicationCorrectionOptions = {},
): MedicationEntry {
  const entry = MedicationEntrySchema.parse(rawEntry);
  const actor = ActorSchema.parse(rawActor);
  const corrections = Object.fromEntries(
    Object.entries(rawCorrections).map(([rawField, value]) => [
      MedicationFieldSchema.parse(rawField),
      toProvenanceValue(value),
    ]),
  ) as MedicationFieldCorrections;
  const finalConfirmationStatus =
    options.confirmationStatus ?? "corrected";
  const provenance = Object.entries(corrections).map(([rawField, value]) => {
    const field = MedicationFieldSchema.parse(rawField);
    const previousProvenance = [...entry.provenance]
      .reverse()
      .find((record) => record.field === field);
    const provenanceCount =
      entry.provenance.filter((record) => record.field === field).length + 1;

    return FieldProvenanceSchema.parse({
      id: `provenance-${entry.id.replace(/^med-/u, "")}-${fieldSlug(field)}-${provenanceCount}`,
      field,
      originalValue: toProvenanceValue(entry[field]),
      normalizedValue: value,
      sourceId: entry.sourceId,
      confidence: 1,
      confirmationStatus: finalConfirmationStatus,
      editorId: actor.id,
      editorRole: actor.role,
      recordedAt: occurredAt,
      supersedesProvenanceId: previousProvenance?.id ?? null,
    });
  });

  return MedicationEntrySchema.parse({
    ...entry,
    ...corrections,
    ...options.additionalPatch,
    confirmationStatus: finalConfirmationStatus,
    confidence: 1,
    provenance: [...entry.provenance, ...provenance],
    updatedAt: occurredAt,
  });
}

export function correctMedicationFields(
  rawEntry: MedicationEntry,
  corrections: MedicationFieldCorrections,
  rawActor: Actor,
  occurredAt: string,
): MedicationEntry {
  return applyMedicationFieldCorrections(
    rawEntry,
    corrections,
    rawActor,
    occurredAt,
  );
}

export function correctMedicationIdentity(
  rawEntry: MedicationEntry,
  enteredName: string,
  rawActor: Actor,
  occurredAt: string,
): MedicationEntry {
  const entry = MedicationEntrySchema.parse(rawEntry);
  const normalization = normalizeMedicationName(enteredName);
  const identityIsMatched = normalization.status === "matched";
  const confirmationStatus = identityIsMatched
    ? "corrected"
    : normalization.status === "ambiguous"
      ? "uncertain_match"
      : "missing_information";
  const candidateCorrections: MedicationFieldCorrections = {
    enteredName: normalization.originalInput,
    normalizedName: normalization.normalizedName,
    ingredient: normalization.ingredient,
  };

  if (identityIsMatched) {
    candidateCorrections.formulation = normalization.formulation;
    candidateCorrections.route = normalization.route;
    if (normalization.category) {
      candidateCorrections.category = normalization.category;
    }
  }
  const corrections = Object.fromEntries(
    Object.entries(candidateCorrections).filter(
      ([rawField, value]) =>
        toProvenanceValue(
          entry[MedicationFieldSchema.parse(rawField)],
        ) !== value,
    ),
  ) as MedicationFieldCorrections;

  return applyMedicationFieldCorrections(
    entry,
    corrections,
    rawActor,
    occurredAt,
    {
      confirmationStatus,
      additionalPatch: {
        conceptId: normalization.conceptId,
        ingredientIds: normalization.ingredientId
          ? [normalization.ingredientId]
          : [],
        normalizationStatus: normalization.status,
      },
    },
  );
}

export function correctMedicationEntry(
  rawEntry: MedicationEntry,
  rawField: MedicationField,
  value: unknown,
  rawActor: Actor,
  occurredAt: string,
): MedicationEntry {
  const field = MedicationFieldSchema.parse(rawField);
  return correctMedicationFields(
    rawEntry,
    { [field]: toProvenanceValue(value) },
    rawActor,
    occurredAt,
  );
}

export function confirmMedicationEntry(
  rawEntry: MedicationEntry,
  rawActor: Actor,
  occurredAt: string,
): MedicationEntry {
  const entry = MedicationEntrySchema.parse(rawEntry);
  const actor = ActorSchema.parse(rawActor);
  const confirmationStatus = ConfirmationStatusSchema.parse("confirmed");
  const previousProvenance = [...entry.provenance]
    .reverse()
    .find((record) => record.field === "confirmationStatus");
  const provenance = FieldProvenanceSchema.parse({
    id: `provenance-${entry.id.replace(/^med-/u, "")}-confirmation-${entry.provenance.length + 1}`,
    field: "confirmationStatus",
    originalValue: entry.confirmationStatus,
    normalizedValue: confirmationStatus,
    sourceId: entry.sourceId,
    confidence: 1,
    confirmationStatus,
    editorId: actor.id,
    editorRole: actor.role,
    recordedAt: occurredAt,
    supersedesProvenanceId: previousProvenance?.id ?? null,
  });

  return MedicationEntrySchema.parse({
    ...entry,
    confirmationStatus,
    confidence: 1,
    provenance: [...entry.provenance, provenance],
    updatedAt: occurredAt,
  });
}

export interface CaregiverMedicationUpdate {
  entry: MedicationEntry;
  auditEvent: AuditEvent;
}

export function recordCaregiverMedicationStatus(
  rawEntry: MedicationEntry,
  status: "taken" | "not_taken" | "unknown",
  rawAdministeredBy: string,
  note: string,
  rawActor: Actor,
  occurredAt: string,
  existingAuditEvents: readonly AuditEvent[] = [],
): CaregiverMedicationUpdate {
  const entry = MedicationEntrySchema.parse(rawEntry);
  const actor = ActorSchema.parse(rawActor);
  if (actor.role !== "caregiver") {
    throw new Error("Caregiver medication updates require a caregiver actor");
  }
  const administeredBy = rawAdministeredBy.trim();
  if (!administeredBy) {
    throw new Error("Caregiver medication updates require an administrator");
  }

  const administrationStatusProvenance = FieldProvenanceSchema.parse({
    id: `provenance-${entry.id.replace(/^med-/u, "")}-administration-${entry.provenance.length + 1}`,
    field: "administrationStatus",
    originalValue: entry.administrationStatus,
    normalizedValue: status,
    sourceId: entry.sourceId,
    confidence: 1,
    confirmationStatus: entry.confirmationStatus,
    editorId: actor.id,
    editorRole: actor.role,
    recordedAt: occurredAt,
    supersedesProvenanceId:
      [...entry.provenance]
        .reverse()
        .find((record) => record.field === "administrationStatus")?.id ?? null,
  });
  const administeredByProvenance = FieldProvenanceSchema.parse({
    id: `provenance-${entry.id.replace(/^med-/u, "")}-administered-by-${entry.provenance.length + 2}`,
    field: "administeredBy",
    originalValue: entry.administeredBy,
    normalizedValue: administeredBy,
    sourceId: entry.sourceId,
    confidence: 1,
    confirmationStatus: entry.confirmationStatus,
    editorId: actor.id,
    editorRole: actor.role,
    recordedAt: occurredAt,
    supersedesProvenanceId:
      [...entry.provenance]
        .reverse()
        .find((record) => record.field === "administeredBy")?.id ?? null,
  });
  const updatedEntry = MedicationEntrySchema.parse({
    ...entry,
    administrationStatus: status,
    administeredBy,
    notes: note ? `${entry.notes}${entry.notes ? " " : ""}${note}` : entry.notes,
    provenance: [
      ...entry.provenance,
      administrationStatusProvenance,
      administeredByProvenance,
    ],
    updatedAt: occurredAt,
  });
  const auditEvent = createAuditEvent({
    episodeId: entry.episodeId,
    action: "caregiver_status_recorded",
    entityType: "medication_entry",
    entityId: entry.id,
    actor,
    occurredAt,
    existingEvents: existingAuditEvents,
    details: {
      administrationStatus: status,
      administeredBy,
      note,
      previousAdministrationStatus: entry.administrationStatus,
      previousAdministeredBy: entry.administeredBy,
    },
  });

  return { entry: updatedEntry, auditEvent };
}
