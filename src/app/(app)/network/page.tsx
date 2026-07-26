import { LifestyleNetwork } from "@/components/lifestyle-network";
import { InteractionInvestigatorPanel } from "@/components/interaction-investigator-panel";
import { PageHeading } from "@/components/page-heading";
import {
  loadDdinterNetworkRelationships,
  type NetworkItem,
} from "@/lib/interactions/network-relationships";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const [{ data: profile }, { data: items }, { data: relationships }] = await Promise.all([
    supabase!.from("health_profiles").select("preferred_name").eq("user_id", user.id).single(),
    supabase!.from("health_items").select("id, display_name, normalized_name, item_type, dmd_match_state").eq("user_id", user.id).eq("status", "active").order("created_at"),
    supabase!.from("health_relationships").select("id, from_item_id, to_item_id, relationship_type, certainty").eq("user_id", user.id),
  ]);
  const networkItems = (items ?? []) as NetworkItem[];
  const ddinterRelationships = await loadDdinterNetworkRelationships(
    getSupabaseAdminClient(),
    networkItems,
  );
  const allRelationships = [
    ...(relationships ?? []).map((relationship) => ({
      ...relationship,
      source: "record" as const,
    })),
    ...ddinterRelationships,
  ];
  return (
    <>
      <PageHeading eyebrow="Your confirmed record" title="Lifestyle Network" description="Explore the people, products, conditions, measurements, and routines you’ve chosen to connect." />
      <LifestyleNetwork name={profile?.preferred_name ?? "You"} items={networkItems} relationships={allRelationships} />
      <InteractionInvestigatorPanel itemCount={(items ?? []).length} />
    </>
  );
}
