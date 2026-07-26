import type { SupabaseClient } from "@supabase/supabase-js";
import type { HealthItemType } from "@/lib/health/labels";
import { normalizeFactorName } from "./normalization";

export type NetworkItem = {
  id: string;
  display_name: string;
  normalized_name?: string | null;
  item_type: HealthItemType;
  dmd_match_state: string;
};

export type NetworkRelationship = {
  id: string;
  from_item_id: string;
  to_item_id: string;
  relationship_type: string;
  certainty: string;
  source?: "record" | "ddinter";
  severity?: string | null;
};

const MEDICINE_TYPES = new Set<HealthItemType>([
  "prescribed_medication",
  "otc_medication",
]);

export async function loadDdinterNetworkRelationships(
  admin: SupabaseClient | null,
  items: NetworkItem[],
): Promise<NetworkRelationship[]> {
  if (!admin) return [];
  const medicines = items.filter((item) => MEDICINE_TYPES.has(item.item_type));
  if (medicines.length < 2) return [];

  const names = medicines.map((item) =>
    normalizeFactorName(item.normalized_name || item.display_name),
  );
  const { data: identities } = await admin
    .from("medicine_identity_cache")
    .select("normalized_name,ingredient_normalized")
    .in("normalized_name", names);
  const ingredientByName = new Map(
    (identities ?? []).map((identity) => [
      identity.normalized_name as string,
      identity.ingredient_normalized as string,
    ]),
  );
  const canonicalByItem = new Map(
    medicines.map((item) => {
      const name = normalizeFactorName(item.normalized_name || item.display_name);
      return [item.id, ingredientByName.get(name) ?? name];
    }),
  );
  const canonicalNames = [...new Set(canonicalByItem.values())].filter(Boolean);
  if (canonicalNames.length < 2) return [];

  const { data: interactions, error } = await admin
    .from("ddi_interactions")
    .select("external_record_id,factor_a_normalized,factor_b_normalized,severity")
    .neq("severity", "Unknown")
    .in("factor_a_normalized", canonicalNames)
    .in("factor_b_normalized", canonicalNames);
  if (error) {
    console.error("DDInter network projection unavailable", error.code);
    return [];
  }

  const itemIdsByCanonical = new Map<string, string[]>();
  for (const [itemId, canonical] of canonicalByItem) {
    itemIdsByCanonical.set(canonical, [
      ...(itemIdsByCanonical.get(canonical) ?? []),
      itemId,
    ]);
  }

  return (interactions ?? []).flatMap((interaction) => {
    const leftIds =
      itemIdsByCanonical.get(interaction.factor_a_normalized as string) ?? [];
    const rightIds =
      itemIdsByCanonical.get(interaction.factor_b_normalized as string) ?? [];
    return leftIds.flatMap((leftId) =>
      rightIds.map((rightId) => ({
        id: `ddinter:${interaction.external_record_id}:${leftId}:${rightId}`,
        from_item_id: leftId,
        to_item_id: rightId,
        relationship_type: "documented medicine interaction",
        certainty: "DDInter source match",
        source: "ddinter" as const,
        severity: interaction.severity as string,
      })),
    );
  });
}
