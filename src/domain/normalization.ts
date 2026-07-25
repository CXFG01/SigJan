import { z } from "zod";

import { MEDICATION_CATALOG, type MedicationConcept } from "./catalog";
import {
  DomainIdSchema,
  MedicationCategorySchema,
  MedicationFormulationSchema,
  MedicationRouteSchema,
} from "./schemas";

const NormalizationCandidateSchema = z
  .object({
    conceptId: DomainIdSchema,
    normalizedName: z.string().min(1),
    ingredientId: DomainIdSchema,
    ingredient: z.string().min(1),
    formulation: MedicationFormulationSchema,
    route: MedicationRouteSchema,
    category: MedicationCategorySchema,
    aliasKind: z.enum(["generic", "brand"]),
  })
  .strict();

export const ProductNormalizationResultSchema = z
  .object({
    originalInput: z.string().min(1),
    status: z.enum(["matched", "ambiguous", "unknown"]),
    normalizedName: z.string().min(1).nullable(),
    conceptId: DomainIdSchema.nullable(),
    ingredientId: DomainIdSchema.nullable(),
    ingredient: z.string().min(1).nullable(),
    formulation: MedicationFormulationSchema,
    route: MedicationRouteSchema,
    category: MedicationCategorySchema.nullable(),
    confidence: z.number().min(0).max(1),
    requiresConfirmation: z.boolean(),
    candidates: z.array(NormalizationCandidateSchema),
  })
  .strict();
export type ProductNormalizationResult = z.infer<
  typeof ProductNormalizationResultSchema
>;

const nonIdentityTokens =
  /\b(?:\d+(?:\.\d+)?\s*(?:micrograms?|mcg|milligrams?|mg|grams?|g|millilitres?|ml)|tablets?|capsules?)\b/giu;

export function canonicalizeMedicationName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[®™]/gu, "")
    .replace(nonIdentityTokens, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-GB")
    .replace(/\s+/gu, " ");
}

function toCandidate(
  concept: MedicationConcept,
  aliasKind: "generic" | "brand",
): z.infer<typeof NormalizationCandidateSchema> {
  return {
    conceptId: concept.id,
    normalizedName: concept.preferredName,
    ingredientId: concept.ingredientId,
    ingredient: concept.ingredientName,
    formulation: concept.formulation,
    route: concept.route,
    category: concept.category,
    aliasKind,
  };
}

export function normalizeMedicationName(
  input: string,
  catalog: readonly MedicationConcept[] = MEDICATION_CATALOG,
): ProductNormalizationResult {
  const originalInput = input.trim();
  if (!originalInput) {
    throw new Error("Medication name cannot be empty");
  }

  const canonicalInput = canonicalizeMedicationName(originalInput);
  const candidates = catalog.flatMap((concept) =>
    concept.aliases
      .filter(
        (alias) =>
          canonicalizeMedicationName(alias.name) === canonicalInput ||
          canonicalizeMedicationName(concept.preferredName) === canonicalInput,
      )
      .map((alias) => toCandidate(concept, alias.kind)),
  );

  const uniqueCandidates = candidates.filter(
    (candidate, index, all) =>
      all.findIndex((other) => other.conceptId === candidate.conceptId) ===
      index,
  );

  if (uniqueCandidates.length === 1) {
    const match = uniqueCandidates[0];
    return ProductNormalizationResultSchema.parse({
      originalInput,
      status: "matched",
      normalizedName: match.normalizedName,
      conceptId: match.conceptId,
      ingredientId: match.ingredientId,
      ingredient: match.ingredient,
      formulation: match.formulation,
      route: match.route,
      category: match.category,
      confidence: 1,
      requiresConfirmation: true,
      candidates: uniqueCandidates,
    });
  }

  if (uniqueCandidates.length > 1) {
    const ingredientIds = new Set(
      uniqueCandidates.map((candidate) => candidate.ingredientId),
    );
    return ProductNormalizationResultSchema.parse({
      originalInput,
      status: "ambiguous",
      normalizedName:
        ingredientIds.size === 1 ? uniqueCandidates[0].ingredient : null,
      conceptId: null,
      ingredientId:
        ingredientIds.size === 1 ? uniqueCandidates[0].ingredientId : null,
      ingredient:
        ingredientIds.size === 1 ? uniqueCandidates[0].ingredient : null,
      formulation: "unknown",
      route: "unknown",
      category: null,
      confidence: 0.55,
      requiresConfirmation: true,
      candidates: uniqueCandidates,
    });
  }

  return ProductNormalizationResultSchema.parse({
    originalInput,
    status: "unknown",
    normalizedName: null,
    conceptId: null,
    ingredientId: null,
    ingredient: null,
    formulation: "unknown",
    route: "unknown",
    category: null,
    confidence: 0,
    requiresConfirmation: true,
    candidates: [],
  });
}
