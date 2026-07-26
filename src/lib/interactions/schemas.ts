import { z } from "zod";

export const interactionRunKindSchema = z.enum([
  "deterministic_check",
  "pair_investigation",
  "lifestyle_investigation",
]);

export const investigationEventTypes = [
  "run_started",
  "graph_prepared",
  "factor_pair_selected",
  "search_started",
  "source_discovered",
  "source_reviewed",
  "reasoning_summary_delta",
  "evidence_conflict_found",
  "validation_started",
  "finding_validated",
  "run_completed",
  "run_failed",
] as const;

export const investigationEventTypeSchema = z.enum(investigationEventTypes);

export const investigationRequestSchema = z.object({
  runId: z.string().uuid().optional(),
  findingId: z.string().uuid().optional(),
  factorA: z.string().trim().min(1).max(200).optional(),
  factorB: z.string().trim().min(1).max(200).optional(),
  jurisdiction: z.string().trim().length(2).default("GB"),
  consentConfirmed: z.literal(true).optional(),
});

const sourceRefSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/i);

export const interactionSourceSchema = z
  .object({
    ref: sourceRefSchema,
    url: z.string().url(),
    title: z.string().min(1).max(500),
    organization: z.string().min(1).max(200),
    jurisdiction: z.string().min(1).max(80),
    publicationOrUpdateDate: z.string().date().nullable(),
    documentSection: z.string().max(300).nullable(),
  })
  .strict();

export const sourcedStatementSchema = z
  .object({
    text: z.string().min(1).max(800),
    sourceRefs: z.array(sourceRefSchema).min(1).max(6),
  })
  .strict();

export const interactionBriefSchema = z
  .object({
    findingType: z.enum(["documented_concern", "research_lead"]),
    factors: z.tuple([
      z.object({
        name: z.string().min(1).max(200),
        canonicalName: z.string().min(1).max(200),
      }),
      z.object({
        name: z.string().min(1).max(200),
        canonicalName: z.string().min(1).max(200),
      }),
    ]),
    triggerType: z.enum([
      "ddinter",
      "curated_rule",
      "duplicate_ingredient",
      "duplicate_class",
      "agent_research_lead",
    ]),
    sourceSeverity: z.enum(["major", "moderate", "minor", "low", "unknown"]).nullable(),
    evidenceState: z.enum([
      "established",
      "context_dependent",
      "conflicting",
      "insufficient",
    ]),
    evidenceStrength: z.enum(["high", "moderate", "low", "insufficient"]),
    whatThisIsAbout: sourcedStatementSchema,
    potentialConsequence: sourcedStatementSchema,
    mechanism: sourcedStatementSchema,
    riskModifiers: z.array(sourcedStatementSchema).max(8),
    missingInformation: z.array(z.string().min(1).max(300)).max(8),
    warningSigns: z.array(sourcedStatementSchema).max(8),
    nextStep: z.enum([
      "contact_pharmacist",
      "contact_prescriber",
      "seek_urgent_help_if_source_signs",
      "information_only",
    ]),
    nextStepExplanation: sourcedStatementSchema,
    pharmacistQuestion: z.string().min(1).max(500),
    limitations: z.array(z.string().min(1).max(500)).min(1).max(8),
    sources: z.array(interactionSourceSchema).min(1).max(12),
  })
  .strict();

export const investigationOutputSchema = z
  .object({
    reports: z.array(interactionBriefSchema).min(1).max(5),
    overallLimitations: z.array(z.string().min(1).max(500)).min(1).max(8),
  })
  .strict();

export type InvestigationOutput = z.infer<typeof investigationOutputSchema>;
export type InteractionBrief = z.infer<typeof interactionBriefSchema>;
export type InvestigationEventType = z.infer<typeof investigationEventTypeSchema>;
export type InteractionRunKind = z.infer<typeof interactionRunKindSchema>;

export type InvestigationProgressEvent = {
  runId: string;
  sequence: number;
  type: InvestigationEventType;
  at: string;
  payload: Record<string, unknown>;
};

export const deterministicCheckRequestSchema = z.object({
  assessmentTime: z.string().datetime({ offset: true }).optional(),
});

