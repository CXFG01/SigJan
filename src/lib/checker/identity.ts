import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeFactorName } from "@/lib/interactions/normalization";
import type { Medicine, ResolvedMedicine } from "./types";

// Product identities only; these entries assert no interaction or safety claims.
const combinations: Record<string, string[]> = {
  "co codamol": ["acetaminophen", "codeine"],
  "co amoxiclav": ["amoxicillin", "clavulanic acid"],
};
export async function resolveMedicine(db: SupabaseClient, medicine: Medicine): Promise<ResolvedMedicine | null> {
  const name = normalizeFactorName(medicine.name);
  const parts = combinations[name] ?? medicine.name.split(/\s*[+/]\s*/).map(normalizeFactorName);
  if (parts.length > 3 || parts.some(p => !p)) return null;
  const ingredients: string[] = [];
  for (const part of parts) {
    const identity = await db.from("medicine_identity_cache").select("ingredient_normalized,interaction_source_releases!inner(active)").eq("interaction_source_releases.active", true).eq("normalized_name", part).limit(10);
    if (identity.error) throw new Error("Medicine identity service unavailable.");
    const matches = [...new Set((identity.data ?? []).map(r => r.ingredient_normalized as string))];
    if (matches.length > 1) return null;
    if (matches.length === 1) { ingredients.push(matches[0]); continue; }
    const [left, right] = await Promise.all([
      db.from("ddi_interactions").select("id,interaction_source_releases!inner(active)").eq("interaction_source_releases.active", true).eq("factor_a_normalized", part).limit(1),
      db.from("ddi_interactions").select("id,interaction_source_releases!inner(active)").eq("interaction_source_releases.active", true).eq("factor_b_normalized", part).limit(1),
    ]);
    if (left.error || right.error) throw new Error("Medicine identity service unavailable.");
    if (!left.data?.length && !right.data?.length) return null;
    ingredients.push(part);
  }
  return { ...medicine, ingredients: [...new Set(ingredients)], identitySource: combinations[name] ? "Curated product composition; ingredients matched to knowledge" : "Exact ingredient or curated identity match" };
}
