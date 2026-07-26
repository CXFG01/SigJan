import { LifestyleNetwork } from "@/components/lifestyle-network";
import { InteractionInvestigatorPanel } from "@/components/interaction-investigator-panel";
import { PageHeading } from "@/components/page-heading";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const [{ data: profile }, { data: items }, { data: relationships }] = await Promise.all([
    supabase!.from("health_profiles").select("preferred_name").eq("user_id", user.id).single(),
    supabase!.from("health_items").select("id, display_name, item_type, dmd_match_state").eq("user_id", user.id).eq("status", "active").order("created_at"),
    supabase!.from("health_relationships").select("id, from_item_id, to_item_id, relationship_type, certainty").eq("user_id", user.id),
  ]);
  return (
    <>
      <PageHeading eyebrow="Your confirmed record" title="Lifestyle Network" description="Explore the people, products, conditions, measurements, and routines you’ve chosen to connect." />
      <LifestyleNetwork name={profile?.preferred_name ?? "You"} items={(items ?? []) as never[]} relationships={relationships ?? []} />
      <InteractionInvestigatorPanel />
    </>
  );
}
