import { describe, expect, it } from "vitest";

import {
  DEMO_COMPLETENESS,
  DEMO_MEDICATION_ENTRIES,
  DEMO_OBSERVATIONS,
  calculateCompleteness,
  calculateExposureOverlap,
} from "@/domain";

const asOf = "2026-07-25T11:30:00Z";

describe("temporal exposure and completeness", () => {
  it("identifies current reported co-exposure", () => {
    const apixaban = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-apixaban",
    )!;
    const ibuprofen = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-ibuprofen",
    )!;

    expect(calculateExposureOverlap(apixaban, ibuprofen, asOf)).toMatchObject({
      status: "overlap",
      overlapEnd: "2026-07-25",
    });
  });

  it("returns no overlap for non-intersecting recorded intervals", () => {
    const apixaban = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-apixaban",
    )!;
    const historicalIbuprofen = {
      ...structuredClone(
        DEMO_MEDICATION_ENTRIES.find(
          (entry) => entry.id === "med-ibuprofen",
        )!,
      ),
      startDate: "2026-06-01",
      startDatePrecision: "exact" as const,
      stopDate: "2026-06-15",
      stopDatePrecision: "exact" as const,
      currentStatus: "stopped" as const,
    };

    expect(
      calculateExposureOverlap(apixaban, historicalIbuprofen, asOf).status,
    ).toBe("no_overlap");
  });

  it("keeps an unknown overlap explicit when dates and current use are unresolved", () => {
    const diltiazem = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-diltiazem",
    )!;
    const homeSupply = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-cardizem-home-supply",
    )!;

    expect(calculateExposureOverlap(diltiazem, homeSupply, asOf).status).toBe(
      "unknown",
    );
  });

  it("calculates medication-list and context completeness separately", () => {
    const result = calculateCompleteness(DEMO_MEDICATION_ENTRIES, {
      observations: DEMO_OBSERVATIONS,
      requiredObservationCodes: ["egfr"],
    });

    expect(result).toEqual(DEMO_COMPLETENESS);
    expect(result.medicationListCompleteness).toBeGreaterThan(0);
    expect(result.medicationListCompleteness).toBeLessThan(100);
    expect(result.contextCompleteness).toBe(0);
    expect(result.missingContextCodes).toEqual(["egfr"]);
    expect(result.itemsAwaitingConfirmation).toEqual(
      expect.arrayContaining([
        "med-diltiazem",
        "med-ginkgo",
        "med-cardizem-home-supply",
      ]),
    );
  });

  it("does not treat a missing context value as reassuring", () => {
    const staleObservation = {
      ...structuredClone(DEMO_OBSERVATIONS[0]),
      value: 51,
      status: "stale" as const,
    };
    const result = calculateCompleteness(DEMO_MEDICATION_ENTRIES, {
      observations: [staleObservation],
      requiredObservationCodes: ["egfr"],
    });

    expect(result.contextCompleteness).toBe(0);
    expect(result.missingContextCodes).toEqual(["egfr"]);
  });
});
