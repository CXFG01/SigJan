import { describe, expect, it } from "vitest";

import {
  DEMO_AS_OF,
  DEMO_CLINICAL_RULES,
  DEMO_CONCERNS,
  DEMO_EVIDENCE_RECORDS,
  DEMO_MEDICATION_ENTRIES,
  DEMO_OBSERVATIONS,
  DEMO_PATIENT,
  MissingConcernEvidenceError,
  applyClinicalRules,
  assessPairCoverage,
  validateConcernEvidence,
} from "@/domain";

describe("deterministic source-backed safety evaluation", () => {
  it("reproduces exactly the three approved Evelyn concerns", () => {
    const concerns = applyClinicalRules({
      episodeId: "episode-evelyn-post-discharge-2026-07",
      entries: DEMO_MEDICATION_ENTRIES,
      conditions: DEMO_PATIENT.conditions,
      observations: DEMO_OBSERVATIONS,
      rules: DEMO_CLINICAL_RULES,
      evidenceRecords: DEMO_EVIDENCE_RECORDS,
      asOf: DEMO_AS_OF,
    });

    expect(concerns).toEqual(DEMO_CONCERNS);
    expect(concerns).toHaveLength(3);
    expect(concerns.every((concern) => concern.evidenceIds.length > 0)).toBe(
      true,
    );
  });

  it("removes the pair concern when recorded exposure no longer overlaps", () => {
    const historicalEntries = DEMO_MEDICATION_ENTRIES.map((entry) =>
      entry.id === "med-ibuprofen"
        ? {
            ...structuredClone(entry),
            startDate: "2026-06-01",
            startDatePrecision: "exact" as const,
            stopDate: "2026-06-15",
            stopDatePrecision: "exact" as const,
            currentStatus: "stopped" as const,
          }
        : entry,
    );
    const concerns = applyClinicalRules({
      episodeId: "episode-evelyn-post-discharge-2026-07",
      entries: historicalEntries,
      conditions: DEMO_PATIENT.conditions,
      observations: DEMO_OBSERVATIONS,
      rules: DEMO_CLINICAL_RULES,
      evidenceRecords: DEMO_EVIDENCE_RECORDS,
      asOf: DEMO_AS_OF,
    });

    expect(
      concerns.find(
        (concern) =>
          concern.id === "concern-evelyn-apixaban-ibuprofen",
      ),
    ).toBeUndefined();
    expect(concerns).toHaveLength(2);
  });

  it("returns insufficient evidence for an unsupported pair, never clearance", () => {
    const lisinopril = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-lisinopril",
    )!;
    const ibuprofen = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-ibuprofen",
    )!;
    const result = assessPairCoverage(
      lisinopril,
      ibuprofen,
      DEMO_CLINICAL_RULES,
      DEMO_AS_OF,
    );

    expect(result).toMatchObject({
      state: "insufficient_evidence",
      coverageStatement:
        "No documented concern found in the sources searched.",
      matchedRuleIds: [],
      requiresProfessionalReview: true,
    });
    expect(result.message).toContain("does not have enough verified information");
    expect(result.message).not.toMatch(/\bis safe\b/iu);
  });

  it("rejects a concern whose referenced evidence is absent", () => {
    expect(() =>
      validateConcernEvidence(DEMO_CONCERNS[0], []),
    ).toThrow(MissingConcernEvidenceError);
  });
});
