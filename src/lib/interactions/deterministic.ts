import type { PrivacySafeFactor, PrivacySafeGraph } from "./graph";
import { orderedPair } from "./normalization";

export type DdiKnowledge = {
  id: string;
  external_record_id: string;
  factor_a_normalized: string;
  factor_b_normalized: string;
  severity: string;
  interaction_source_releases?: {
    source_key?: string;
    version?: string;
    source_url?: string;
  } | null;
};

export type LifestyleRule = {
  id: string;
  version: string;
  factor_a_normalized: string;
  factor_b_normalized: string;
  title: string;
  severity: string;
  concern: string;
  source_url: string;
  source_organization: string;
  jurisdiction: string;
};

export type DeterministicFinding = {
  findingType: "documented_concern" | "could_not_assess";
  triggerType:
    | "ddinter"
    | "curated_rule"
    | "duplicate_ingredient"
    | "duplicate_class"
    | "unresolved_identity";
  factorRefs: string[];
  factorNames: string[];
  canonicalNames: string[];
  sourceSeverity: string | null;
  deterministicSource: Record<string, unknown>;
};

function overlaps(factor: PrivacySafeFactor, asOf: Date) {
  const start = factor.regimen?.startsOn ?? factor.startsOn;
  const end = factor.regimen?.endsOn ?? factor.endsOn;
  return (
    (!start || new Date(`${start}T00:00:00Z`) <= asOf) &&
    (!end || new Date(`${end}T23:59:59Z`) >= asOf)
  );
}

function pairKey(left: string, right: string) {
  return orderedPair(left, right).join("::");
}

export function screenDeterministically(
  graph: PrivacySafeGraph,
  ddi: DdiKnowledge[],
  rules: LifestyleRule[],
) {
  const findings: DeterministicFinding[] = [];
  const asOf = new Date(graph.asOf);
  const active = graph.factors.filter((factor) => overlaps(factor, asOf));
  const knownNames = new Set<string>();
  ddi.forEach((entry) => {
    knownNames.add(entry.factor_a_normalized);
    knownNames.add(entry.factor_b_normalized);
  });
  rules.forEach((rule) => {
    knownNames.add(rule.factor_a_normalized);
    knownNames.add(rule.factor_b_normalized);
  });

  for (const factor of active) {
    if (
      ["prescribed_medication", "otc_medication"].includes(factor.type) &&
      factor.identityState === "unresolved"
    ) {
      if (knownNames.has(factor.normalizedName)) {
        factor.identityState = "exact_knowledge_match";
        factor.canonicalName = factor.normalizedName;
      } else {
        findings.push({
          findingType: "could_not_assess",
          triggerType: "unresolved_identity",
          factorRefs: [factor.ref],
          factorNames: [factor.name],
          canonicalNames: [],
          sourceSeverity: null,
          deterministicSource: {
            reason:
              "Medication identity has not been confirmed against dm+d or an exact knowledge match.",
          },
        });
      }
    }
  }

  const ddiByPair = new Map(
    ddi.map((entry) => [
      pairKey(entry.factor_a_normalized, entry.factor_b_normalized),
      entry,
    ]),
  );
  const ruleByPair = new Map(
    rules.map((rule) => [
      pairKey(rule.factor_a_normalized, rule.factor_b_normalized),
      rule,
    ]),
  );

  for (let leftIndex = 0; leftIndex < active.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < active.length; rightIndex += 1) {
      const left = active[leftIndex];
      const right = active[rightIndex];
      const key = pairKey(left.canonicalName, right.canonicalName);
      const ddiEntry = ddiByPair.get(key);
      if (ddiEntry) {
        findings.push({
          findingType: "documented_concern",
          triggerType: "ddinter",
          factorRefs: [left.ref, right.ref],
          factorNames: [left.name, right.name],
          canonicalNames: [left.canonicalName, right.canonicalName],
          sourceSeverity: ddiEntry.severity.toLowerCase(),
          deterministicSource: {
            recordId: ddiEntry.external_record_id,
            source: "DDInter",
            version: ddiEntry.interaction_source_releases?.version ?? "unknown",
            url:
              ddiEntry.interaction_source_releases?.source_url ??
              "https://ddinter2.scbdd.com/",
          },
        });
      }

      const rule = ruleByPair.get(key);
      if (rule) {
        findings.push({
          findingType: "documented_concern",
          triggerType: "curated_rule",
          factorRefs: [left.ref, right.ref],
          factorNames: [left.name, right.name],
          canonicalNames: [left.canonicalName, right.canonicalName],
          sourceSeverity: rule.severity,
          deterministicSource: {
            ruleId: rule.id,
            title: rule.title,
            concern: rule.concern,
            source: rule.source_organization,
            version: rule.version,
            url: rule.source_url,
            jurisdiction: rule.jurisdiction,
          },
        });
      }

      const bothMedicines = [left, right].every((factor) =>
        ["prescribed_medication", "otc_medication"].includes(factor.type),
      );
      if (bothMedicines && left.canonicalName === right.canonicalName) {
        findings.push({
          findingType: "documented_concern",
          triggerType: "duplicate_ingredient",
          factorRefs: [left.ref, right.ref],
          factorNames: [left.name, right.name],
          canonicalNames: [left.canonicalName],
          sourceSeverity: "unknown",
          deterministicSource: {
            source: "SignalRx deterministic duplicate check",
            explanation: "Both confirmed items resolve to the same ingredient.",
          },
        });
      }
      if (
        bothMedicines &&
        left.canonicalName !== right.canonicalName &&
        left.therapeuticClass &&
        left.therapeuticClass === right.therapeuticClass
      ) {
        findings.push({
          findingType: "documented_concern",
          triggerType: "duplicate_class",
          factorRefs: [left.ref, right.ref],
          factorNames: [left.name, right.name],
          canonicalNames: [left.canonicalName, right.canonicalName],
          sourceSeverity: "unknown",
          deterministicSource: {
            source: "SignalRx deterministic therapeutic-class check",
            therapeuticClass: left.therapeuticClass,
            explanation:
              "Both confirmed items are mapped to the same governed therapeutic class.",
          },
        });
      }
    }
  }

  return findings;
}
