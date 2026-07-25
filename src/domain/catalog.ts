import { z } from "zod";

import {
  DomainIdSchema,
  MedicationCategorySchema,
  MedicationFormulationSchema,
  MedicationRouteSchema,
} from "./schemas";

export const MedicationAliasSchema = z
  .object({
    name: z.string().min(1),
    kind: z.enum(["generic", "brand"]),
  })
  .strict();

export const MedicationConceptSchema = z
  .object({
    id: DomainIdSchema,
    preferredName: z.string().min(1),
    ingredientId: DomainIdSchema,
    ingredientName: z.string().min(1),
    category: MedicationCategorySchema,
    formulation: MedicationFormulationSchema,
    route: MedicationRouteSchema,
    aliases: z.array(MedicationAliasSchema).min(1),
  })
  .strict();

export type MedicationConcept = z.infer<typeof MedicationConceptSchema>;

export const MEDICATION_CATALOG: readonly MedicationConcept[] = [
  {
    id: "concept-apixaban-tablet",
    preferredName: "Apixaban",
    ingredientId: "ingredient-apixaban",
    ingredientName: "apixaban",
    category: "prescription",
    formulation: "tablet",
    route: "oral",
    aliases: [
      { name: "Apixaban", kind: "generic" },
      { name: "Eliquis", kind: "brand" },
    ],
  },
  {
    id: "concept-diltiazem-tablet",
    preferredName: "Diltiazem",
    ingredientId: "ingredient-diltiazem",
    ingredientName: "diltiazem",
    category: "prescription",
    formulation: "tablet",
    route: "oral",
    aliases: [
      { name: "Diltiazem", kind: "generic" },
      { name: "Cardizem", kind: "brand" },
    ],
  },
  {
    id: "concept-diltiazem-modified-release-tablet",
    preferredName: "Diltiazem modified-release",
    ingredientId: "ingredient-diltiazem",
    ingredientName: "diltiazem",
    category: "prescription",
    formulation: "modified_release_tablet",
    route: "oral",
    aliases: [
      { name: "Diltiazem MR", kind: "generic" },
      { name: "Cardizem SR", kind: "brand" },
      { name: "Tildiem LA", kind: "brand" },
    ],
  },
  {
    id: "concept-lisinopril-tablet",
    preferredName: "Lisinopril",
    ingredientId: "ingredient-lisinopril",
    ingredientName: "lisinopril",
    category: "prescription",
    formulation: "tablet",
    route: "oral",
    aliases: [{ name: "Lisinopril", kind: "generic" }],
  },
  {
    id: "concept-spironolactone-tablet",
    preferredName: "Spironolactone",
    ingredientId: "ingredient-spironolactone",
    ingredientName: "spironolactone",
    category: "prescription",
    formulation: "tablet",
    route: "oral",
    aliases: [
      { name: "Spironolactone", kind: "generic" },
      { name: "Aldactone", kind: "brand" },
    ],
  },
  {
    id: "concept-ibuprofen-tablet",
    preferredName: "Ibuprofen",
    ingredientId: "ingredient-ibuprofen",
    ingredientName: "ibuprofen",
    category: "otc",
    formulation: "tablet",
    route: "oral",
    aliases: [
      { name: "Ibuprofen", kind: "generic" },
      { name: "Nurofen", kind: "brand" },
    ],
  },
  {
    id: "concept-ginkgo-biloba-supplement",
    preferredName: "Ginkgo biloba supplement",
    ingredientId: "ingredient-ginkgo-biloba",
    ingredientName: "ginkgo biloba",
    category: "supplement",
    formulation: "unknown",
    route: "oral",
    aliases: [
      { name: "Ginkgo biloba", kind: "generic" },
      { name: "Ginkgo", kind: "generic" },
    ],
  },
] as const satisfies readonly MedicationConcept[];

for (const concept of MEDICATION_CATALOG) {
  MedicationConceptSchema.parse(concept);
}
