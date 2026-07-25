import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const domainIdPattern = /^[a-z][a-z0-9-]*$/;

export const DomainIdSchema = z
  .string()
  .regex(domainIdPattern, "Use a stable, human-readable kebab-case identifier");
export const IsoDateSchema = z
  .string()
  .regex(isoDatePattern, "Expected an ISO date in YYYY-MM-DD format");
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const ActorRoleSchema = z.enum([
  "patient",
  "caregiver",
  "pharmacist",
  "clinician",
  "system",
]);
export type ActorRole = z.infer<typeof ActorRoleSchema>;

export const ActorSchema = z
  .object({
    id: DomainIdSchema,
    name: z.string().min(1),
    role: ActorRoleSchema,
  })
  .strict();
export type Actor = z.infer<typeof ActorSchema>;

export const MedicationCategorySchema = z.enum([
  "prescription",
  "otc",
  "supplement",
  "vitamin",
  "herbal",
  "food_drink",
]);
export type MedicationCategory = z.infer<typeof MedicationCategorySchema>;

export const ConfirmationStatusSchema = z.enum([
  "confirmed",
  "needs_confirmation",
  "uncertain_match",
  "missing_information",
  "possibly_stopped",
  "corrected",
]);
export type ConfirmationStatus = z.infer<typeof ConfirmationStatusSchema>;

export const MedicationCurrentStatusSchema = z.enum([
  "active",
  "intermittent",
  "possibly_stopped",
  "stopped",
  "unknown",
]);
export type MedicationCurrentStatus = z.infer<
  typeof MedicationCurrentStatusSchema
>;

export const NormalizationStatusSchema = z.enum([
  "matched",
  "ambiguous",
  "unknown",
]);
export type NormalizationStatus = z.infer<typeof NormalizationStatusSchema>;

export const MedicationRouteSchema = z.enum([
  "oral",
  "topical",
  "inhaled",
  "injection",
  "other",
  "unknown",
]);
export type MedicationRoute = z.infer<typeof MedicationRouteSchema>;

export const MedicationFormulationSchema = z.enum([
  "tablet",
  "modified_release_tablet",
  "capsule",
  "liquid",
  "cream",
  "injection",
  "unknown",
]);
export type MedicationFormulation = z.infer<
  typeof MedicationFormulationSchema
>;

export const AdministrationStatusSchema = z.enum([
  "taken",
  "not_taken",
  "unknown",
  "not_recorded",
]);
export type AdministrationStatus = z.infer<
  typeof AdministrationStatusSchema
>;

export const MedicationFieldSchema = z.enum([
  "enteredName",
  "normalizedName",
  "ingredient",
  "strength",
  "unit",
  "dose",
  "frequency",
  "route",
  "formulation",
  "category",
  "startDate",
  "stopDate",
  "currentStatus",
  "sourceId",
  "sourceExcerpt",
  "reportedBy",
  "administeredBy",
  "confirmationStatus",
  "confidence",
  "administrationStatus",
  "notes",
]);
export type MedicationField = z.infer<typeof MedicationFieldSchema>;

const ProvenanceValueSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .nullable();

export const FieldProvenanceSchema = z
  .object({
    id: DomainIdSchema,
    field: MedicationFieldSchema,
    originalValue: ProvenanceValueSchema,
    normalizedValue: ProvenanceValueSchema,
    sourceId: DomainIdSchema,
    confidence: z.number().min(0).max(1),
    confirmationStatus: ConfirmationStatusSchema,
    editorId: DomainIdSchema,
    editorRole: ActorRoleSchema,
    recordedAt: IsoDateTimeSchema,
    supersedesProvenanceId: DomainIdSchema.nullable(),
  })
  .strict();
export type FieldProvenance = z.infer<typeof FieldProvenanceSchema>;

export const MedicationEntrySchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    patientId: DomainIdSchema,
    enteredName: z.string().min(1),
    originalName: z.string().min(1),
    normalizedName: z.string().min(1).nullable(),
    conceptId: DomainIdSchema.nullable(),
    ingredient: z.string().min(1).nullable(),
    ingredientIds: z.array(DomainIdSchema),
    normalizationStatus: NormalizationStatusSchema,
    strength: z.number().positive().nullable(),
    unit: z.string().min(1).nullable(),
    dose: z.string().min(1).nullable(),
    frequency: z.string().min(1).nullable(),
    route: MedicationRouteSchema,
    formulation: MedicationFormulationSchema,
    category: MedicationCategorySchema,
    startDate: IsoDateSchema.nullable(),
    startDatePrecision: z.enum(["exact", "approximate", "unknown"]),
    stopDate: IsoDateSchema.nullable(),
    stopDatePrecision: z.enum(["exact", "approximate", "unknown"]),
    currentStatus: MedicationCurrentStatusSchema,
    sourceId: DomainIdSchema,
    sourceLabel: z.string().min(1),
    sourceExcerpt: z.string().min(1),
    additionalSourceIds: z.array(DomainIdSchema),
    reportedBy: z.string().min(1),
    reportedByRole: z.enum(["patient", "caregiver", "professional", "document"]),
    administeredBy: z.string().min(1),
    confirmationStatus: ConfirmationStatusSchema,
    confidence: z.number().min(0).max(1),
    administrationStatus: AdministrationStatusSchema,
    notes: z.string(),
    provenance: z.array(FieldProvenanceSchema).min(1),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((entry, context) => {
    if (
      entry.normalizationStatus === "matched" &&
      (!entry.normalizedName ||
        !entry.conceptId ||
        entry.ingredientIds.length === 0)
    ) {
      context.addIssue({
        code: "custom",
        message: "A matched product requires a concept and ingredient identity",
        path: ["normalizationStatus"],
      });
    }
    if (
      entry.normalizationStatus === "unknown" &&
      (entry.conceptId !== null || entry.ingredientIds.length > 0)
    ) {
      context.addIssue({
        code: "custom",
        message: "An unknown product cannot be assigned a clinical identity",
        path: ["conceptId"],
      });
    }
  });
export type MedicationEntry = z.infer<typeof MedicationEntrySchema>;

export const MedicationSourceSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    type: z.enum([
      "discharge_document",
      "medicine_box_image",
      "voice_transcript",
      "patient_statement",
      "caregiver_statement",
      "manual_entry",
    ]),
    label: z.string().min(1),
    originalExcerpt: z.string().min(1),
    capturedAt: IsoDateTimeSchema,
    suppliedBy: z.string().min(1),
    synthetic: z.literal(true),
  })
  .strict();
export type MedicationSource = z.infer<typeof MedicationSourceSchema>;

export const ConditionSchema = z
  .object({
    id: DomainIdSchema,
    name: z.string().min(1),
    status: z.enum(["active", "historical", "unknown"]),
    sourceId: DomainIdSchema,
  })
  .strict();
export type Condition = z.infer<typeof ConditionSchema>;

export const ObservationSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    code: z.string().min(1),
    label: z.string().min(1),
    value: z.union([z.string(), z.number()]).nullable(),
    unit: z.string().min(1).nullable(),
    status: z.enum(["available", "missing", "stale"]),
    observedAt: IsoDateTimeSchema.nullable(),
    sourceId: DomainIdSchema,
  })
  .strict();
export type Observation = z.infer<typeof ObservationSchema>;

export const SymptomSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    name: z.string().min(1),
    patientWords: z.string().min(1),
    onsetDate: IsoDateSchema.nullable(),
    datePrecision: z.enum(["exact", "approximate", "unknown"]),
    status: z.enum(["new", "ongoing", "resolved", "unknown"]),
    sourceId: DomainIdSchema,
    causalAssessment: z.literal("not_assessed"),
  })
  .strict();
export type Symptom = z.infer<typeof SymptomSchema>;

export const PatientProfileSchema = z
  .object({
    id: DomainIdSchema,
    name: z.string().min(1),
    age: z.number().int().min(0).max(130),
    recentEvent: z.string().min(1),
    conditions: z.array(ConditionSchema),
    synthetic: z.literal(true),
  })
  .strict();
export type PatientProfile = z.infer<typeof PatientProfileSchema>;

export const EvidenceTypeSchema = z.enum([
  "authoritative_label",
  "clinical_guideline",
  "systematic_review",
  "controlled_study",
  "observational_study",
  "case_report",
  "expert_consensus",
  "synthetic_demo_summary",
  "mechanistic_research",
  "computational_hypothesis",
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceTierSchema = z.enum([
  "authoritative",
  "clinical_evidence",
  "signal",
  "hypothesis",
]);
export type EvidenceTier = z.infer<typeof EvidenceTierSchema>;

export const EvidenceStateSchema = z.enum([
  "established",
  "context_dependent",
  "conflicting",
  "hypothesis",
  "no_documented_concern_in_coverage",
  "insufficient_evidence",
]);
export type EvidenceState = z.infer<typeof EvidenceStateSchema>;

export const EvidenceRecordSchema = z
  .object({
    id: DomainIdSchema,
    title: z.string().min(1),
    organization: z.string().min(1),
    evidenceType: EvidenceTypeSchema,
    tier: EvidenceTierSchema,
    state: EvidenceStateSchema,
    publicationDate: IsoDateSchema.nullable(),
    updatedDate: IsoDateSchema,
    retrievedDate: IsoDateSchema,
    exactSupportingExcerpt: z.string().min(1),
    applicabilityNotes: z.array(z.string().min(1)).min(1),
    limitations: z.array(z.string().min(1)).min(1),
    sourceUrl: z.string().url().nullable(),
    jurisdiction: z.string().min(1),
    version: z.string().min(1),
    quotationStatus: z.enum(["synthetic_paraphrase", "verified_excerpt"]),
    synthetic: z.boolean(),
  })
  .strict()
  .superRefine((record, context) => {
    if (
      record.quotationStatus === "synthetic_paraphrase" &&
      !record.exactSupportingExcerpt.startsWith("Synthetic paraphrase:")
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Synthetic evidence excerpts must be explicitly labelled as a synthetic paraphrase",
        path: ["exactSupportingExcerpt"],
      });
    }
  });
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

export const PotentialSeveritySchema = z.enum([
  "major",
  "moderate",
  "low",
  "unknown",
]);
export type PotentialSeverity = z.infer<typeof PotentialSeveritySchema>;

export const EvidenceStrengthSchema = z.enum([
  "high",
  "moderate",
  "low",
  "insufficient",
]);
export type EvidenceStrength = z.infer<typeof EvidenceStrengthSchema>;

export const PatientContextMatchSchema = z.enum([
  "high",
  "moderate",
  "low",
  "unknown",
]);
export type PatientContextMatch = z.infer<typeof PatientContextMatchSchema>;

export const DataCompletenessSchema = z.enum([
  "complete",
  "partial",
  "insufficient",
]);
export type DataCompleteness = z.infer<typeof DataCompletenessSchema>;

export const ConcernCategorySchema = z.enum([
  "established_evidence",
  "context_dependent",
  "insufficient_evidence",
]);
export type ConcernCategory = z.infer<typeof ConcernCategorySchema>;

export const ConcernReviewStatusSchema = z.enum([
  "unreviewed",
  "in_review",
  "accepted",
  "monitoring",
  "more_information_required",
  "dismissed",
  "escalated",
  "resolved",
]);
export type ConcernReviewStatus = z.infer<typeof ConcernReviewStatusSchema>;

export const ExposureStatusSchema = z.enum([
  "overlap",
  "no_overlap",
  "unknown",
]);
export type ExposureStatus = z.infer<typeof ExposureStatusSchema>;

export const ConcernInputSnapshotSchema = z
  .object({
    medicationEntryIds: z.array(DomainIdSchema).min(1),
    ingredientIds: z.array(DomainIdSchema),
    exposureStatus: ExposureStatusSchema,
    contextValues: z
      .array(
        z
          .object({
            key: z.string().min(1),
            value: z.string().min(1),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();
export type ConcernInputSnapshot = z.infer<
  typeof ConcernInputSnapshotSchema
>;

export const ConcernSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    ruleId: DomainIdSchema,
    ruleVersion: z.string().min(1),
    type: z.enum([
      "interaction",
      "monitoring",
      "product_uncertainty",
      "duplicate_ingredient",
      "formulation_ambiguity",
    ]),
    category: ConcernCategorySchema,
    categoryLabel: z.string().min(1),
    title: z.string().min(1),
    status: z.enum([
      "needs_professional_review",
      "context_incomplete",
      "insufficient_evidence",
    ]),
    productEntryIds: z.array(DomainIdSchema).min(1),
    productNames: z.array(z.string().min(1)).min(1),
    potentialConsequence: z.string().min(1),
    whyItMayMatter: z.string().min(1),
    mechanismSummary: z.string().min(1),
    potentialSeverity: PotentialSeveritySchema,
    evidenceStrength: EvidenceStrengthSchema,
    patientContextMatch: PatientContextMatchSchema,
    dataCompleteness: DataCompletenessSchema,
    missingInformation: z.array(z.string().min(1)),
    evidenceIds: z.array(DomainIdSchema).min(
      1,
      "A clinical concern must reference at least one governed evidence record",
    ),
    suggestedQuestion: z.string().min(1),
    reviewStatus: ConcernReviewStatusSchema,
    reviewerDisposition: z.string().min(1).nullable(),
    resolutionReason: z.string().min(1).nullable(),
    priority: z.number().int().min(0).max(100),
    inputSnapshot: ConcernInputSnapshotSchema,
    contentVersion: z.string().min(1),
    explanationVersion: z.string().min(1),
    auditEventIds: z.array(DomainIdSchema).min(1),
    createdAt: IsoDateTimeSchema,
  })
  .strict();
export type Concern = z.infer<typeof ConcernSchema>;

const IngredientPairMatchSchema = z
  .object({
    kind: z.literal("ingredient_pair"),
    ingredientIds: z.tuple([DomainIdSchema, DomainIdSchema]),
    requireExposureOverlap: z.boolean(),
  })
  .strict();

const RegimenContextMatchSchema = z
  .object({
    kind: z.literal("regimen_context"),
    ingredientIds: z.array(DomainIdSchema).min(1),
    conditionIds: z.array(DomainIdSchema).min(1),
    observationCodes: z.array(z.string().min(1)).min(1),
  })
  .strict();

const ProductUncertaintyMatchSchema = z
  .object({
    kind: z.literal("product_uncertainty"),
    ingredientId: DomainIdSchema.nullable(),
    categories: z.array(MedicationCategorySchema).min(1),
    fieldsThatMustBeKnown: z
      .array(z.enum(["identity", "strength", "dose", "formulation", "startDate"]))
      .min(1),
  })
  .strict();

export const ClinicalRuleMatchSchema = z.discriminatedUnion("kind", [
  IngredientPairMatchSchema,
  RegimenContextMatchSchema,
  ProductUncertaintyMatchSchema,
]);
export type ClinicalRuleMatch = z.infer<typeof ClinicalRuleMatchSchema>;

export const ClinicalRuleSchema = z
  .object({
    id: DomainIdSchema,
    version: z.string().min(1),
    outputConcernId: DomainIdSchema,
    type: ConcernSchema.shape.type,
    category: ConcernCategorySchema,
    categoryLabel: z.string().min(1),
    title: z.string().min(1),
    status: ConcernSchema.shape.status,
    match: ClinicalRuleMatchSchema,
    potentialConsequence: z.string().min(1),
    whyItMayMatter: z.string().min(1),
    mechanismSummary: z.string().min(1),
    potentialSeverity: PotentialSeveritySchema,
    evidenceStrength: EvidenceStrengthSchema,
    patientContextMatch: PatientContextMatchSchema,
    dataCompleteness: DataCompletenessSchema,
    missingInformation: z.array(z.string().min(1)),
    evidenceIds: z.array(DomainIdSchema).min(1),
    suggestedQuestion: z.string().min(1),
    priority: z.number().int().min(0).max(100),
    contentVersion: z.string().min(1),
    explanationVersion: z.string().min(1),
    enabled: z.boolean(),
  })
  .strict();
export type ClinicalRule = z.infer<typeof ClinicalRuleSchema>;

export const TimelineEventSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    type: z.enum([
      "medication_start",
      "medication_change",
      "hospital_discharge",
      "otc_use",
      "supplement_use",
      "symptom_onset",
      "symptom_resolution",
      "professional_review",
      "follow_up_task",
    ]),
    occurredAt: IsoDateTimeSchema.nullable(),
    datePrecision: z.enum(["exact", "approximate", "unknown"]),
    title: z.string().min(1),
    description: z.string().min(1),
    temporalLanguage: z.enum([
      "occurred_after",
      "reported_during_overlapping_exposure",
      "timing_requires_review",
      "not_applicable",
    ]),
    relatedMedicationEntryIds: z.array(DomainIdSchema),
    relatedSymptomId: DomainIdSchema.nullable(),
    sourceId: DomainIdSchema,
    synthetic: z.literal(true),
  })
  .strict();
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const ReviewDispositionSchema = z.enum([
  "accepted_action_required",
  "accepted_already_managed",
  "monitor",
  "not_relevant_due_to_context",
  "duplicate_or_data_error",
  "more_information_required",
  "escalated",
  "patient_declined_action",
]);
export type ReviewDisposition = z.infer<typeof ReviewDispositionSchema>;

const dispositionsRequiringReason = new Set<ReviewDisposition>([
  "not_relevant_due_to_context",
  "duplicate_or_data_error",
  "more_information_required",
  "escalated",
  "patient_declined_action",
]);

export const ReviewActionSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    concernId: DomainIdSchema,
    revision: z.number().int().positive().default(1),
    supersedesReviewActionId: DomainIdSchema.nullable().default(null),
    disposition: ReviewDispositionSchema,
    reason: z.string().min(1).nullable(),
    owner: z.string().min(1).nullable(),
    dueDate: IsoDateSchema.nullable(),
    followUpAction: z.string().min(1).nullable(),
    patientFacingMessage: z.string().min(1).nullable(),
    reviewerId: DomainIdSchema,
    reviewerName: z.string().min(1),
    reviewedAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((action, context) => {
    if (action.revision === 1 && action.supersedesReviewActionId !== null) {
      context.addIssue({
        code: "custom",
        message: "The first review revision cannot supersede another action",
        path: ["supersedesReviewActionId"],
      });
    }
    if (action.revision > 1 && action.supersedesReviewActionId === null) {
      context.addIssue({
        code: "custom",
        message: "A later review revision must identify the action it supersedes",
        path: ["supersedesReviewActionId"],
      });
    }
    if (
      dispositionsRequiringReason.has(action.disposition) &&
      action.reason === null
    ) {
      context.addIssue({
        code: "custom",
        message: `A reason is required for ${action.disposition}`,
        path: ["reason"],
      });
    }
    if (
      action.disposition === "accepted_action_required" &&
      action.followUpAction === null
    ) {
      context.addIssue({
        code: "custom",
        message: "An accepted action requires a follow-up action",
        path: ["followUpAction"],
      });
    }
  });
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const AuditActionSchema = z.enum([
  "source_imported",
  "extraction_created",
  "medication_confirmed",
  "medication_corrected",
  "caregiver_status_recorded",
  "episode_transitioned",
  "concern_created",
  "review_disposition_recorded",
  "patient_plan_published",
  "patient_plan_invalidated",
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditDetailSchema = z
  .object({
    key: z.string().min(1),
    value: z.string(),
  })
  .strict();

export const AuditEventSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    action: AuditActionSchema,
    entityType: z.enum([
      "source",
      "medication_entry",
      "episode",
      "concern",
      "review_action",
      "patient_plan",
    ]),
    entityId: DomainIdSchema,
    actor: ActorSchema,
    occurredAt: IsoDateTimeSchema,
    details: z.array(AuditDetailSchema),
  })
  .strict();
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const PatientPlanItemSchema = z
  .object({
    concernId: DomainIdSchema,
    disposition: ReviewDispositionSchema,
    whatCareTeamIsReviewing: z.string().min(1),
    patientFacingMessage: z.string().min(1),
    owner: z.string().min(1).nullable(),
    followUpDate: IsoDateSchema.nullable(),
  })
  .strict();
export type PatientPlanItem = z.infer<typeof PatientPlanItemSchema>;

export const PatientPlanSchema = z
  .object({
    id: DomainIdSchema,
    episodeId: DomainIdSchema,
    status: z.enum(["draft", "approved"]),
    version: z.number().int().positive(),
    verifiedMedicationEntryIds: z.array(DomainIdSchema),
    awaitingConfirmationEntryIds: z.array(DomainIdSchema),
    reviewItems: z.array(PatientPlanItemSchema),
    contactOwner: z.string().min(1).nullable(),
    followUpDate: IsoDateSchema.nullable(),
    questionsToAsk: z.array(z.string().min(1)),
    safetyStatement: z.string().min(1),
    approvedBy: z.string().min(1).nullable(),
    approvedAt: IsoDateTimeSchema.nullable(),
    lastUpdatedAt: IsoDateTimeSchema,
  })
  .strict();
export type PatientPlan = z.infer<typeof PatientPlanSchema>;

export const WorkflowStateSchema = z.enum([
  "draft",
  "awaiting_confirmation",
  "ready_for_review",
  "in_review",
  "resolved",
  "escalated",
  "archived",
]);
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

export const EpisodeStateSchema = z
  .object({
    id: DomainIdSchema,
    workflowState: WorkflowStateSchema,
    asOf: IsoDateTimeSchema,
    patient: PatientProfileSchema,
    medicationSources: z.array(MedicationSourceSchema),
    medicationEntries: z.array(MedicationEntrySchema),
    observations: z.array(ObservationSchema),
    symptoms: z.array(SymptomSchema),
    evidenceRecords: z.array(EvidenceRecordSchema),
    clinicalRules: z.array(ClinicalRuleSchema),
    concerns: z.array(ConcernSchema).max(3),
    timelineEvents: z.array(TimelineEventSchema),
    reviewActions: z.array(ReviewActionSchema),
    auditEvents: z.array(AuditEventSchema),
    patientPlan: PatientPlanSchema,
    synthetic: z.literal(true),
    demoLabel: z.literal("Synthetic demonstration data"),
  })
  .strict()
  .superRefine((episode, context) => {
    const auditEventIds = new Set<string>();
    episode.auditEvents.forEach((event, index) => {
      if (auditEventIds.has(event.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate audit event id: ${event.id}`,
          path: ["auditEvents", index, "id"],
        });
      }
      auditEventIds.add(event.id);
    });

    const reviewActionIds = new Set<string>();
    const actionsByConcern = new Map<string, typeof episode.reviewActions>();
    episode.reviewActions.forEach((action, index) => {
      if (reviewActionIds.has(action.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate review action id: ${action.id}`,
          path: ["reviewActions", index, "id"],
        });
      }
      reviewActionIds.add(action.id);
      const concernActions = actionsByConcern.get(action.concernId) ?? [];
      concernActions.push(action);
      actionsByConcern.set(action.concernId, concernActions);
    });

    for (const [concernId, concernActions] of actionsByConcern) {
      const orderedActions = [...concernActions].sort(
        (left, right) => left.revision - right.revision,
      );
      orderedActions.forEach((action, index) => {
        const expectedRevision = index + 1;
        const expectedSupersededId =
          index === 0 ? null : orderedActions[index - 1].id;
        const sourceIndex = episode.reviewActions.findIndex(
          (candidate) => candidate.id === action.id,
        );
        if (action.revision !== expectedRevision) {
          context.addIssue({
            code: "custom",
            message: `Review revisions for ${concernId} must be contiguous and unique`,
            path: ["reviewActions", sourceIndex, "revision"],
          });
        }
        if (action.supersedesReviewActionId !== expectedSupersededId) {
          context.addIssue({
            code: "custom",
            message: `Review revision ${action.revision} for ${concernId} must supersede the immediately preceding revision`,
            path: [
              "reviewActions",
              sourceIndex,
              "supersedesReviewActionId",
            ],
          });
        }
      });
    }
  });
export type EpisodeState = z.infer<typeof EpisodeStateSchema>;
