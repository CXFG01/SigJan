import { describe, expect, it } from "vitest";

import {
  DEMO_MEDICATION_ENTRIES,
  compareFormulations,
  detectDuplicateIngredients,
  normalizeMedicationName,
} from "@/domain";

describe("medication identity normalization", () => {
  it("maps a brand and generic name to the same governed ingredient", () => {
    const brand = normalizeMedicationName("Eliquis 5 mg tablets");
    const generic = normalizeMedicationName("Apixaban");

    expect(brand.status).toBe("matched");
    expect(generic.status).toBe("matched");
    expect(brand.ingredientId).toBe("ingredient-apixaban");
    expect(generic.ingredientId).toBe(brand.ingredientId);
    expect(brand.conceptId).toBe(generic.conceptId);
    expect(brand.requiresConfirmation).toBe(true);
  });

  it("preserves a clinically meaningful formulation distinction", () => {
    const generic = normalizeMedicationName("Diltiazem");
    const modifiedReleaseBrand = normalizeMedicationName("Cardizem SR 90 mg");

    expect(generic.ingredientId).toBe("ingredient-diltiazem");
    expect(modifiedReleaseBrand.ingredientId).toBe(
      "ingredient-diltiazem",
    );
    expect(generic.conceptId).not.toBe(modifiedReleaseBrand.conceptId);
    expect(generic.formulation).toBe("tablet");
    expect(modifiedReleaseBrand.formulation).toBe(
      "modified_release_tablet",
    );

    const diltiazem = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-diltiazem",
    );
    const homeSupply = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-cardizem-home-supply",
    );
    expect(diltiazem).toBeDefined();
    expect(homeSupply).toBeDefined();
    expect(compareFormulations(diltiazem!, homeSupply!)).toBe("different");
  });

  it("returns an explicit unknown state without guessing an ingredient", () => {
    const result = normalizeMedicationName("Mystery Green Wellness Blend");

    expect(result).toMatchObject({
      status: "unknown",
      conceptId: null,
      ingredientId: null,
      ingredient: null,
      requiresConfirmation: true,
      candidates: [],
    });
  });

  it("detects duplicate active ingredients while labelling formulation differences", () => {
    const diltiazemEntries = DEMO_MEDICATION_ENTRIES.filter((entry) =>
      entry.ingredientIds.includes("ingredient-diltiazem"),
    );
    const findings = detectDuplicateIngredients(
      diltiazemEntries,
      "2026-07-25T11:30:00Z",
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ingredientId: "ingredient-diltiazem",
      kind: "formulation_difference",
      exposureStatus: "unknown",
      requiresConfirmation: true,
    });
  });

  it("detects an overlapping brand/generic duplicate without merging records", () => {
    const apixaban = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-apixaban",
    )!;
    const genericCopy = {
      ...structuredClone(apixaban),
      id: "med-apixaban-generic-copy",
      enteredName: "Apixaban 5 mg",
      originalName: "Apixaban 5 mg",
    };

    const findings = detectDuplicateIngredients(
      [apixaban, genericCopy],
      "2026-07-25T11:30:00Z",
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("possible_duplicate");
    expect(findings[0].medicationEntryIds).toEqual([
      "med-apixaban",
      "med-apixaban-generic-copy",
    ]);
    expect(apixaban.enteredName).toBe("Eliquis 5 mg tablets");
  });
});
