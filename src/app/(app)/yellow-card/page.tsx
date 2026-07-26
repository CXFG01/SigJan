import { PageHeading } from "@/components/page-heading";
import { YellowCardForm } from "@/components/yellow-card-form";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export default async function YellowCardPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const [{ data: symptoms }, { data: medicines }] = await Promise.all([
    supabase!.from("health_items").select("id, display_name").eq("user_id", user.id).eq("item_type", "symptom").neq("status", "archived"),
    supabase!.from("health_items").select("id, display_name").eq("user_id", user.id).in("item_type", ["prescribed_medication", "otc_medication"]).neq("status", "archived"),
  ]);
  return (
    <>
      <PageHeading eyebrow="User-led MHRA reporting" title="Prepare a Yellow Card draft" description="Structure a suspected reaction for your review. SignalRx records timing and your suspicion without deciding what caused it." />
      <YellowCardForm symptoms={symptoms ?? []} medicines={medicines ?? []} />
    </>
  );
}
