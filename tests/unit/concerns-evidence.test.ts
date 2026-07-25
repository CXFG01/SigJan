import { describe, expect, it } from "vitest";

import {
  ConcernSchema,
  DEMO_CONCERNS,
  mapEvidenceTypeToTier,
  orderConcerns,
} from "@/domain";

describe("deterministic concern records", () => {
  it("ships exactly three demo concerns in the required order", () => {
    expect(DEMO_CONCERNS).toHaveLength(3);
    expect(DEMO_CONCERNS.map((concern) => concern.category)).toEqual([
      "established_evidence",
      "context_dependent",
      "insufficient_evidence",
    ]);
    expect(orderConcerns([...DEMO_CONCERNS].reverse())).toEqual(DEMO_CONCERNS);
  });

  it("requires every clinical concern to contain evidence identifiers", () => {
    const invalidConcern = {
      ...structuredClone(DEMO_CONCERNS[0]),
      evidenceIds: [],
    };

    expect(ConcernSchema.safeParse(invalidConcern).success).toBe(false);
  });

  it("keeps severity, evidence, context, and completeness independent", () => {
    const concern = DEMO_CONCERNS[1];

    expect(concern).toMatchObject({
      potentialSeverity: "major",
      evidenceStrength: "moderate",
      patientContextMatch: "high",
      dataCompleteness: "insufficient",
    });
  });

  it.each([
    ["authoritative_label", "authoritative"],
    ["clinical_guideline", "authoritative"],
    ["systematic_review", "clinical_evidence"],
    ["controlled_study", "clinical_evidence"],
    ["expert_consensus", "clinical_evidence"],
    ["synthetic_demo_summary", "clinical_evidence"],
    ["observational_study", "signal"],
    ["case_report", "signal"],
    ["mechanistic_research", "hypothesis"],
    ["computational_hypothesis", "hypothesis"],
  ] as const)("maps %s to the governed %s tier", (type, expectedTier) => {
    expect(mapEvidenceTypeToTier(type)).toBe(expectedTier);
  });
});
