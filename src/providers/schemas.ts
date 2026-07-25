import { z } from "zod";

import {
  DomainIdSchema,
  EvidenceRecordSchema,
  IsoDateTimeSchema,
  MedicationCategorySchema,
  MedicationFormulationSchema,
  MedicationRouteSchema,
  ProductNormalizationResultSchema,
  type Concern,
  type EvidenceRecord,
} from "../domain";
import {
  findProhibitedPhrases,
  validateConcernEvidence,
} from "../domain";

export const ProviderMetadataSchema = z
  .object({
    provider: z.enum(["deterministic_fixture", "external_validated"]),
    model: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: IsoDateTimeSchema,
    usedFallback: z.boolean(),
  })
  .strict();
export type ProviderMetadata = z.infer<typeof ProviderMetadataSchema>;

export const ExtractionRequestSchema = z
  .object({
    requestId: DomainIdSchema,
    sourceId: DomainIdSchema,
    sourceType: z.enum([
      "discharge_document",
      "medicine_box_image",
      "voice_transcript",
      "patient_statement",
      "caregiver_statement",
      "manual_entry",
    ]),
    content: z.string().min(1).max(12_000),
    requestedAt: IsoDateTimeSchema,
  })
  .strict();
export type ExtractionRequest = z.infer<typeof ExtractionRequestSchema>;

const extractionConfirmationSchema = z.enum([
  "needs_confirmation",
  "uncertain_match",
  "missing_information",
]);

export const ExtractedMedicationCandidateSchema = z
  .object({
    id: DomainIdSchema,
    enteredName: z.string().min(1),
    normalization: ProductNormalizationResultSchema,
    strength: z.number().positive().nullable(),
    unit: z.string().min(1).nullable(),
    dose: z.string().min(1).nullable(),
    frequency: z.string().min(1).nullable(),
    route: MedicationRouteSchema,
    formulation: MedicationFormulationSchema,
    category: MedicationCategorySchema,
    sourceId: DomainIdSchema,
    sourceExcerpt: z.string().min(1),
    confidence: z.number().min(0).max(1),
    confirmationStatus: extractionConfirmationSchema,
    clarificationQuestions: z.array(z.string().min(1)),
  })
  .strict()
  .superRefine((candidate, context) => {
    if (
      candidate.normalization.status !== "matched" &&
      candidate.confirmationStatus === "needs_confirmation"
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Ambiguous or unknown identities must be marked uncertain or missing",
        path: ["confirmationStatus"],
      });
    }
  });
export type ExtractedMedicationCandidate = z.infer<
  typeof ExtractedMedicationCandidateSchema
>;

export const ExtractionResponseSchema = z
  .object({
    requestId: DomainIdSchema,
    candidates: z.array(ExtractedMedicationCandidateSchema),
    metadata: ProviderMetadataSchema,
  })
  .strict();
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

const ApprovedConcernForExplanationSchema = z
  .object({
    id: DomainIdSchema,
    title: z.string().min(1),
    category: z.enum([
      "established_evidence",
      "context_dependent",
      "insufficient_evidence",
    ]),
    whyItMayMatter: z.string().min(1),
    mechanismSummary: z.string().min(1),
    missingInformation: z.array(z.string().min(1)),
    suggestedQuestion: z.string().min(1),
    evidenceIds: z.array(DomainIdSchema).min(1),
    contentVersion: z.string().min(1),
    explanationVersion: z.string().min(1),
  })
  .strict();

const ApprovedEvidenceSnippetSchema = z
  .object({
    id: EvidenceRecordSchema.shape.id,
    title: EvidenceRecordSchema.shape.title,
    exactSupportingExcerpt: EvidenceRecordSchema.shape.exactSupportingExcerpt,
    applicabilityNotes: EvidenceRecordSchema.shape.applicabilityNotes,
    limitations: EvidenceRecordSchema.shape.limitations,
    version: EvidenceRecordSchema.shape.version,
  })
  .strict();

export const ExplanationRequestSchema = z
  .object({
    requestId: DomainIdSchema,
    audience: z.enum(["patient", "caregiver", "professional"]),
    approvedConcern: ApprovedConcernForExplanationSchema,
    approvedEvidence: z.array(ApprovedEvidenceSnippetSchema).min(1),
    requestedAt: IsoDateTimeSchema,
  })
  .strict();
export type ExplanationRequest = z.infer<typeof ExplanationRequestSchema>;

export function buildExplanationRequest(
  concern: Concern,
  evidenceRecords: readonly EvidenceRecord[],
  audience: ExplanationRequest["audience"],
  requestedAt: string,
): ExplanationRequest {
  validateConcernEvidence(concern, evidenceRecords);
  const evidenceIds = new Set(concern.evidenceIds);
  return ExplanationRequestSchema.parse({
    requestId: `explanation-request-${concern.id.replace(/^concern-/u, "")}`,
    audience,
    approvedConcern: {
      id: concern.id,
      title: concern.title,
      category: concern.category,
      whyItMayMatter: concern.whyItMayMatter,
      mechanismSummary: concern.mechanismSummary,
      missingInformation: concern.missingInformation,
      suggestedQuestion: concern.suggestedQuestion,
      evidenceIds: concern.evidenceIds,
      contentVersion: concern.contentVersion,
      explanationVersion: concern.explanationVersion,
    },
    approvedEvidence: evidenceRecords
      .filter((record) => evidenceIds.has(record.id))
      .map((record) => ({
        id: record.id,
        title: record.title,
        exactSupportingExcerpt: record.exactSupportingExcerpt,
        applicabilityNotes: record.applicabilityNotes,
        limitations: record.limitations,
        version: record.version,
      })),
    requestedAt,
  });
}

export const GeneratedExplanationSchema = z
  .object({
    id: DomainIdSchema,
    sourceConcernId: DomainIdSchema,
    plainLanguageSummary: z.string().min(1),
    uncertaintyStatement: z.string().min(1),
    professionalQuestion: z.string().min(1),
    evidenceIds: z.array(DomainIdSchema).min(1),
    metadata: ProviderMetadataSchema,
  })
  .strict()
  .superRefine((explanation, context) => {
    for (const [field, text] of [
      ["plainLanguageSummary", explanation.plainLanguageSummary],
      ["uncertaintyStatement", explanation.uncertaintyStatement],
      ["professionalQuestion", explanation.professionalQuestion],
    ] as const) {
      for (const violation of findProhibitedPhrases(text)) {
        context.addIssue({
          code: "custom",
          message: violation.description,
          path: [field],
        });
      }
    }
  });
export type GeneratedExplanation = z.infer<
  typeof GeneratedExplanationSchema
>;

export const ConcernExplanationPresentationSchema = z
  .object({
    concernId: DomainIdSchema,
    explanation: GeneratedExplanationSchema,
  })
  .strict();
export type ConcernExplanationPresentation = z.infer<
  typeof ConcernExplanationPresentationSchema
>;

export function attachGeneratedExplanation(
  concern: Concern,
  rawExplanation: unknown,
): ConcernExplanationPresentation {
  const explanation = GeneratedExplanationSchema.parse(rawExplanation);
  if (explanation.sourceConcernId !== concern.id) {
    throw new Error("Generated explanation belongs to a different concern");
  }
  if (
    explanation.evidenceIds.some(
      (evidenceId) => !concern.evidenceIds.includes(evidenceId),
    )
  ) {
    throw new Error(
      "Generated explanation referenced evidence outside the approved concern",
    );
  }
  return ConcernExplanationPresentationSchema.parse({
    concernId: concern.id,
    explanation,
  });
}
