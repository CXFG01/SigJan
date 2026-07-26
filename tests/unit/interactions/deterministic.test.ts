import { describe, expect, it } from "vitest";
import {
  screenDeterministically,
  type DdiKnowledge,
  type LifestyleRule,
} from "@/lib/interactions/deterministic";
import type { PrivacySafeGraph } from "@/lib/interactions/graph";

function graph(
  factors: PrivacySafeGraph["factors"],
  asOf = "2026-07-26T12:00:00.000Z",
): PrivacySafeGraph {
  return {
    asOf,
    jurisdiction: "GB",
    ageBand: "40-54",
    factors,
    relationships: [],
  };
}

function factor(
  ref: string,
  name: string,
  overrides: Partial<PrivacySafeGraph["factors"][number]> = {},
): PrivacySafeGraph["factors"][number] {
  return {
    ref,
    type: "prescribed_medication",
    name,
    normalizedName: name.toLowerCase(),
    canonicalName: name.toLowerCase(),
    therapeuticClass: null,
    identityState: "unresolved",
    dmdCode: null,
    startsOn: null,
    endsOn: null,
    context: {},
    regimen: null,
    ...overrides,
  };
}

const ddi: DdiKnowledge[] = [
  {
    id: "ddi-1",
    external_record_id: "DDInter108-DDInter900",
    factor_a_normalized: "apixaban",
    factor_b_normalized: "ibuprofen",
    severity: "Major",
    interaction_source_releases: {
      version: "2.0-hackathon-seed",
      source_url: "https://ddinter2.scbdd.com/download/",
    },
  },
];

describe("deterministic interaction screening", () => {
  it("finds the documented apixaban and ibuprofen pair regardless of order", () => {
    const findings = screenDeterministically(
      graph([factor("factor-1", "Ibuprofen"), factor("factor-2", "Apixaban")]),
      ddi,
      [],
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        findingType: "documented_concern",
        triggerType: "ddinter",
        sourceSeverity: "major",
      }),
    );
  });

  it("does not create a current finding after exposure ended", () => {
    const findings = screenDeterministically(
      graph([
        factor("factor-1", "Ibuprofen", { endsOn: "2026-06-01" }),
        factor("factor-2", "Apixaban"),
      ]),
      ddi,
      [],
    );
    expect(findings.some((finding) => finding.triggerType === "ddinter")).toBe(false);
  });

  it("reports unresolved identity rather than clearance", () => {
    const findings = screenDeterministically(
      graph([factor("factor-1", "Mystery capsule"), factor("factor-2", "Apixaban")]),
      ddi,
      [],
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        findingType: "could_not_assess",
        triggerType: "unresolved_identity",
        factorNames: ["Mystery capsule"],
      }),
    );
  });

  it("detects duplicate confirmed ingredients", () => {
    const findings = screenDeterministically(
      graph([
        factor("factor-1", "Ibuprofen", { identityState: "matched" }),
        factor("factor-2", "Ibuprofen", {
          type: "otc_medication",
          identityState: "matched",
        }),
      ]),
      [],
      [],
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ triggerType: "duplicate_ingredient" }),
    );
  });

  it("detects a governed therapeutic-class duplicate", () => {
    const findings = screenDeterministically(
      graph([
        factor("factor-1", "Ibuprofen", {
          identityState: "matched",
          therapeuticClass: "nsaid",
        }),
        factor("factor-2", "Naproxen", {
          type: "otc_medication",
          identityState: "matched",
          therapeuticClass: "nsaid",
        }),
      ]),
      [],
      [],
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ triggerType: "duplicate_class" }),
    );
  });

  it("applies a curated lifestyle rule", () => {
    const rules: LifestyleRule[] = [
      {
        id: "rule-1",
        version: "v1",
        factor_a_normalized: "grapefruit juice",
        factor_b_normalized: "simvastatin",
        title: "Grapefruit juice can affect simvastatin",
        severity: "moderate",
        concern: "NHS concern",
        source_url: "https://www.nhs.uk/medicines/simvastatin/",
        source_organization: "NHS",
        jurisdiction: "GB",
      },
    ];
    const findings = screenDeterministically(
      graph([
        factor("factor-1", "Simvastatin"),
        factor("factor-2", "Grapefruit juice", {
          type: "lifestyle_factor",
          identityState: "not_applicable",
        }),
      ]),
      [],
      rules,
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ triggerType: "curated_rule" }),
    );
  });
});
