import { z } from "zod";

import { validateConcernEvidence } from "./evidence";
import {
  INSUFFICIENT_EVIDENCE_STATEMENT,
  NO_DOCUMENTED_CONCERN_STATEMENT,
} from "./language";
import { calculateExposureOverlap } from "./medications";
import {
  ClinicalRuleSchema,
  ConcernSchema,
  EvidenceRecordSchema,
  MedicationEntrySchema,
  ObservationSchema,
  type ClinicalRule,
  type Concern,
  type Condition,
  type EvidenceRecord,
  type MedicationEntry,
  type Observation,
} from "./schemas";

const categoryRank: Readonly<Record<Concern["category"], number>> = {
  established_evidence: 3,
  context_dependent: 2,
  insufficient_evidence: 1,
};

const severityRank: Readonly<Record<Concern["potentialSeverity"], number>> = {
  major: 4,
  moderate: 3,
  low: 2,
  unknown: 1,
};

const evidenceRank: Readonly<Record<Concern["evidenceStrength"], number>> = {
  high: 4,
  moderate: 3,
  low: 2,
  insufficient: 1,
};

const contextRank: Readonly<Record<Concern["patientContextMatch"], number>> = {
  high: 4,
  moderate: 3,
  low: 2,
  unknown: 1,
};

const completenessRank: Readonly<Record<Concern["dataCompleteness"], number>> =
  {
    complete: 3,
    partial: 2,
    insufficient: 1,
  };

export function compareConcerns(left: Concern, right: Concern): number {
  return (
    categoryRank[right.category] - categoryRank[left.category] ||
    severityRank[right.potentialSeverity] -
      severityRank[left.potentialSeverity] ||
    evidenceRank[right.evidenceStrength] -
      evidenceRank[left.evidenceStrength] ||
    contextRank[right.patientContextMatch] -
      contextRank[left.patientContextMatch] ||
    completenessRank[right.dataCompleteness] -
      completenessRank[left.dataCompleteness] ||
    right.priority - left.priority ||
    left.id.localeCompare(right.id)
  );
}

export function orderConcerns(
  concerns: readonly Concern[],
): Concern[] {
  return concerns.map((concern) => ConcernSchema.parse(concern)).sort(compareConcerns);
}

function entriesWithIngredient(
  entries: readonly MedicationEntry[],
  ingredientId: string,
): MedicationEntry[] {
  return entries.filter((entry) => entry.ingredientIds.includes(ingredientId));
}

function productFieldKnown(
  entry: MedicationEntry,
  field: "identity" | "strength" | "dose" | "formulation" | "startDate",
): boolean {
  switch (field) {
    case "identity":
      return (
        entry.normalizationStatus === "matched" &&
        entry.conceptId !== null &&
        entry.ingredientIds.length > 0
      );
    case "strength":
      return entry.strength !== null && entry.unit !== null;
    case "dose":
      return entry.dose !== null;
    case "formulation":
      return entry.formulation !== "unknown";
    case "startDate":
      return entry.startDate !== null;
  }
}

interface RuleMatchResult {
  entries: MedicationEntry[];
  exposureStatus: Concern["inputSnapshot"]["exposureStatus"];
  contextValues: Concern["inputSnapshot"]["contextValues"];
}

function matchRule(
  rule: ClinicalRule,
  entries: readonly MedicationEntry[],
  conditions: readonly Condition[],
  observations: readonly Observation[],
  asOf: string,
): RuleMatchResult | null {
  switch (rule.match.kind) {
    case "ingredient_pair": {
      const [leftIngredient, rightIngredient] = rule.match.ingredientIds;
      const leftEntries = entriesWithIngredient(entries, leftIngredient);
      const rightEntries = entriesWithIngredient(entries, rightIngredient);

      for (const left of leftEntries) {
        for (const right of rightEntries) {
          if (left.id === right.id) {
            continue;
          }
          const exposure = calculateExposureOverlap(left, right, asOf);
          if (
            rule.match.requireExposureOverlap &&
            exposure.status === "no_overlap"
          ) {
            continue;
          }
          return {
            entries: [left, right],
            exposureStatus: exposure.status,
            contextValues: [
              { key: "exposure", value: exposure.rationale },
            ],
          };
        }
      }
      return null;
    }

    case "regimen_context": {
      const matchingEntries = rule.match.ingredientIds.flatMap(
        (ingredientId) => entriesWithIngredient(entries, ingredientId).slice(0, 1),
      );
      if (matchingEntries.length !== rule.match.ingredientIds.length) {
        return null;
      }
      const activeConditionIds = new Set(
        conditions
          .filter((condition) => condition.status === "active")
          .map((condition) => condition.id),
      );
      if (
        !rule.match.conditionIds.every((conditionId) =>
          activeConditionIds.has(conditionId),
        )
      ) {
        return null;
      }
      const observationByCode = new Map(
        observations.map((observation) => [observation.code, observation]),
      );
      const missingCodes = rule.match.observationCodes.filter((code) => {
        const observation = observationByCode.get(code);
        return (
          !observation ||
          observation.status !== "available" ||
          observation.value === null
        );
      });
      if (missingCodes.length === 0) {
        return null;
      }
      return {
        entries: matchingEntries,
        exposureStatus: matchingEntries.every(
          (entry) =>
            entry.currentStatus === "active" ||
            entry.currentStatus === "intermittent",
        )
          ? "overlap"
          : "unknown",
        contextValues: [
          {
            key: "active-conditions",
            value: rule.match.conditionIds.join(", "),
          },
          { key: "missing-observations", value: missingCodes.join(", ") },
        ],
      };
    }

    case "product_uncertainty": {
      const productMatch = rule.match;
      const matchingEntry = entries.find(
        (entry) =>
          productMatch.categories.includes(entry.category) &&
          (productMatch.ingredientId === null ||
            entry.ingredientIds.includes(productMatch.ingredientId)) &&
          productMatch.fieldsThatMustBeKnown.some(
            (field) => !productFieldKnown(entry, field),
          ),
      );
      if (!matchingEntry) {
        return null;
      }
      const missingFields = productMatch.fieldsThatMustBeKnown.filter(
        (field) => !productFieldKnown(matchingEntry, field),
      );
      return {
        entries: [matchingEntry],
        exposureStatus:
          matchingEntry.currentStatus === "active" ||
          matchingEntry.currentStatus === "intermittent"
            ? "overlap"
            : "unknown",
        contextValues: [
          { key: "unverified-product-fields", value: missingFields.join(", ") },
        ],
      };
    }
  }
}

export interface ApplyClinicalRulesInput {
  episodeId: string;
  entries: readonly MedicationEntry[];
  conditions: readonly Condition[];
  observations: readonly Observation[];
  rules: readonly ClinicalRule[];
  evidenceRecords: readonly EvidenceRecord[];
  asOf: string;
}

export function applyClinicalRules(
  input: ApplyClinicalRulesInput,
): Concern[] {
  const entries = input.entries.map((entry) => MedicationEntrySchema.parse(entry));
  const observations = input.observations.map((observation) =>
    ObservationSchema.parse(observation),
  );
  const rules = input.rules.map((rule) => ClinicalRuleSchema.parse(rule));
  const evidenceRecords = input.evidenceRecords.map((record) =>
    EvidenceRecordSchema.parse(record),
  );

  const concerns = rules.flatMap((rule): Concern[] => {
    if (!rule.enabled) {
      return [];
    }
    const match = matchRule(
      rule,
      entries,
      input.conditions,
      observations,
      input.asOf,
    );
    if (!match) {
      return [];
    }

    const concern = ConcernSchema.parse({
      id: rule.outputConcernId,
      episodeId: input.episodeId,
      ruleId: rule.id,
      ruleVersion: rule.version,
      type: rule.type,
      category: rule.category,
      categoryLabel: rule.categoryLabel,
      title: rule.title,
      status: rule.status,
      productEntryIds: match.entries.map((entry) => entry.id),
      productNames: match.entries.map(
        (entry) => entry.normalizedName ?? entry.enteredName,
      ),
      potentialConsequence: rule.potentialConsequence,
      whyItMayMatter: rule.whyItMayMatter,
      mechanismSummary: rule.mechanismSummary,
      potentialSeverity: rule.potentialSeverity,
      evidenceStrength: rule.evidenceStrength,
      patientContextMatch:
        match.exposureStatus === "unknown" &&
        rule.patientContextMatch === "high"
          ? "moderate"
          : rule.patientContextMatch,
      dataCompleteness: rule.dataCompleteness,
      missingInformation: rule.missingInformation,
      evidenceIds: rule.evidenceIds,
      suggestedQuestion: rule.suggestedQuestion,
      reviewStatus: "unreviewed",
      reviewerDisposition: null,
      resolutionReason: null,
      priority: rule.priority,
      inputSnapshot: {
        medicationEntryIds: match.entries.map((entry) => entry.id),
        ingredientIds: [
          ...new Set(
            match.entries.flatMap((entry) => entry.ingredientIds),
          ),
        ],
        exposureStatus: match.exposureStatus,
        contextValues: match.contextValues,
      },
      contentVersion: rule.contentVersion,
      explanationVersion: rule.explanationVersion,
      auditEventIds: [
        `audit-concern-created-${rule.outputConcernId.replace(/^concern-/u, "")}`,
      ],
      createdAt: input.asOf,
    });
    validateConcernEvidence(concern, evidenceRecords);
    return [concern];
  });

  return orderConcerns(concerns);
}

export const PairCoverageAssessmentSchema = z
  .object({
    state: z.enum(["documented_concern", "insufficient_evidence"]),
    message: z.string().min(1),
    coverageStatement: z.string().min(1),
    matchedRuleIds: z.array(z.string().min(1)),
    requiresProfessionalReview: z.boolean(),
  })
  .strict();
export type PairCoverageAssessment = z.infer<
  typeof PairCoverageAssessmentSchema
>;

export function assessPairCoverage(
  left: MedicationEntry,
  right: MedicationEntry,
  rules: readonly ClinicalRule[],
  asOf: string,
): PairCoverageAssessment {
  const sharedRuleIds = rules
    .filter(
      (rule) =>
        rule.enabled &&
        rule.match.kind === "ingredient_pair" &&
        rule.match.ingredientIds.every((ingredientId) =>
          [...left.ingredientIds, ...right.ingredientIds].includes(
            ingredientId,
          ),
        ),
    )
    .map((rule) => rule.id);
  const exposure = calculateExposureOverlap(left, right, asOf);

  if (sharedRuleIds.length > 0 && exposure.status !== "no_overlap") {
    return PairCoverageAssessmentSchema.parse({
      state: "documented_concern",
      message: "A governed rule found a potential concern for professional review.",
      coverageStatement: "The result is limited to the seeded sources and rule set.",
      matchedRuleIds: sharedRuleIds,
      requiresProfessionalReview: true,
    });
  }

  return PairCoverageAssessmentSchema.parse({
    state: "insufficient_evidence",
    message: INSUFFICIENT_EVIDENCE_STATEMENT,
    coverageStatement: NO_DOCUMENTED_CONCERN_STATEMENT,
    matchedRuleIds: [],
    requiresProfessionalReview: true,
  });
}
