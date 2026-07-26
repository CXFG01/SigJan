import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeFactorName } from "./normalization";

const INCLUDED_TYPES = new Set([
  "prescribed_medication",
  "otc_medication",
  "supplement",
  "herb",
  "condition",
  "symptom",
  "laboratory_marker",
  "lifestyle_factor",
]);

type HealthItemRow = {
  id: string;
  item_type: string;
  display_name: string;
  normalized_name: string;
  details: Record<string, unknown> | null;
  dmd_code: string | null;
  dmd_match_state: string;
  starts_on: string | null;
  ends_on: string | null;
};

type RegimenRow = {
  health_item_id: string;
  strength: string | null;
  route: string | null;
  starts_on: string | null;
  ends_on: string | null;
};

type IdentityRow = {
  namespace: string;
  code: string;
  normalized_name: string;
  ingredient_normalized: string;
  therapeutic_class: string | null;
  aliases: string[];
};

export type PrivacySafeFactor = {
  ref: string;
  type: string;
  name: string;
  normalizedName: string;
  canonicalName: string;
  therapeuticClass: string | null;
  identityState: "matched" | "exact_knowledge_match" | "unresolved" | "not_applicable";
  dmdCode: string | null;
  startsOn: string | null;
  endsOn: string | null;
  context: Record<string, string | number | boolean | null>;
  regimen: {
    strength: string | null;
    route: string | null;
    startsOn: string | null;
    endsOn: string | null;
  } | null;
};

export type PrivacySafeGraph = {
  asOf: string;
  jurisdiction: "GB";
  ageBand: string;
  factors: PrivacySafeFactor[];
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    certainty: string;
  }>;
};

function ageBand(dateOfBirth: string | null) {
  if (!dateOfBirth) return "unknown";
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() &&
      now.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }
  if (age < 25) return "18-24";
  if (age < 40) return "25-39";
  if (age < 55) return "40-54";
  if (age < 65) return "55-64";
  if (age < 75) return "65-74";
  return "75+";
}

function safeContext(details: Record<string, unknown> | null) {
  const allowed = new Set([
    "amount",
    "frequency",
    "onset",
    "status",
    "value",
    "unit",
    "timing",
  ]);
  return Object.fromEntries(
    Object.entries(details ?? {})
      .filter(
        ([key, value]) =>
          allowed.has(key) &&
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean" ||
            value === null),
      )
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 200) : value,
      ]),
  ) as Record<string, string | number | boolean | null>;
}

export async function loadPrivacySafeGraph(
  admin: SupabaseClient,
  userId: string,
  assessmentTime = new Date(),
) {
  const [
    { data: profile },
    { data: items, error: itemError },
    { data: regimens },
    { data: relationships },
    { data: identities },
  ] =
    await Promise.all([
      admin.from("health_profiles").select("date_of_birth").eq("user_id", userId).single(),
      admin
        .from("health_items")
        .select(
          "id,item_type,display_name,normalized_name,details,dmd_code,dmd_match_state,starts_on,ends_on",
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at"),
      admin
        .from("medication_regimens")
        .select("health_item_id,strength,route,starts_on,ends_on")
        .eq("user_id", userId)
        .eq("active", true),
      admin
        .from("health_relationships")
        .select("from_item_id,to_item_id,relationship_type,certainty")
        .eq("user_id", userId),
      admin
        .from("medicine_identity_cache")
        .select(
          "namespace,code,normalized_name,ingredient_normalized,therapeutic_class,aliases",
        ),
    ]);

  if (itemError) throw new Error(`health_graph_unavailable:${itemError.code}`);
  const included = ((items ?? []) as HealthItemRow[]).filter((item) =>
    INCLUDED_TYPES.has(item.item_type),
  );
  const refById = new Map(included.map((item, index) => [item.id, `factor-${index + 1}`]));
  const regimenByItem = new Map(
    ((regimens ?? []) as RegimenRow[]).map((regimen) => [
      regimen.health_item_id,
      regimen,
    ]),
  );
  const identityRows = (identities ?? []) as IdentityRow[];
  const identityByDmd = new Map(
    identityRows
      .filter((identity) => identity.namespace === "dmd")
      .map((identity) => [identity.code, identity]),
  );
  const identityByName = new Map<string, IdentityRow>();
  for (const identity of identityRows) {
    identityByName.set(identity.normalized_name, identity);
    for (const alias of identity.aliases ?? []) {
      identityByName.set(normalizeFactorName(alias), identity);
    }
  }

  const factors: PrivacySafeFactor[] = included.map((item, index) => {
    const normalized = normalizeFactorName(item.normalized_name || item.display_name);
    const regimen = regimenByItem.get(item.id);
    const medication = ["prescribed_medication", "otc_medication"].includes(item.item_type);
    const identity = medication
      ? (item.dmd_code ? identityByDmd.get(item.dmd_code) : undefined) ??
        identityByName.get(normalized)
      : undefined;
    return {
      ref: `factor-${index + 1}`,
      type: item.item_type,
      name: item.display_name.slice(0, 200),
      normalizedName: normalized,
      canonicalName: identity?.ingredient_normalized ?? normalized,
      therapeuticClass: identity?.therapeutic_class ?? null,
      identityState: medication
        ? item.dmd_match_state === "matched" || identity
          ? "matched"
          : "unresolved"
        : "not_applicable",
      dmdCode: medication ? item.dmd_code : null,
      startsOn: item.starts_on,
      endsOn: item.ends_on,
      context: safeContext(item.details),
      regimen: regimen
        ? {
            strength: regimen.strength?.slice(0, 100) ?? null,
            route: regimen.route?.slice(0, 100) ?? null,
            startsOn: regimen.starts_on,
            endsOn: regimen.ends_on,
          }
        : null,
    };
  });

  const graph: PrivacySafeGraph = {
    asOf: assessmentTime.toISOString(),
    jurisdiction: "GB",
    ageBand: ageBand((profile as { date_of_birth?: string } | null)?.date_of_birth ?? null),
    factors,
    relationships: (relationships ?? [])
      .map((relationship) => ({
        from: refById.get(relationship.from_item_id),
        to: refById.get(relationship.to_item_id),
        type: relationship.relationship_type,
        certainty: relationship.certainty,
      }))
      .filter(
        (relationship): relationship is PrivacySafeGraph["relationships"][number] =>
          Boolean(relationship.from && relationship.to),
      ),
  };

  const hash = createHash("sha256")
    .update(JSON.stringify(graph))
    .digest("hex");

  return { graph, hash };
}

export function graphContainsDirectIdentifiers(graph: PrivacySafeGraph) {
  const serialized = JSON.stringify(graph);
  return (
    /preferred_name|family_name|email|emergency_contact|source_artifact|user_id/i.test(
      serialized,
    ) || /\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i.test(serialized)
  );
}
