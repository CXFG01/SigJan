import { CalendarManager } from "@/components/calendar-manager";
import { PageHeading } from "@/components/page-heading";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; item?: string }>;
}) {
  const user = await requireUserOrRedirect();
  const { new: newPanel, item } = await searchParams;
  const supabase = await getSupabaseServerClient();
  const [{ data: events }, { data: healthItems }] = await Promise.all([
    supabase!
      .from("calendar_events")
      .select("id, title, event_type, starts_at, ends_at, timezone, note")
      .eq("user_id", user.id)
      .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("starts_at")
      .limit(50),
    supabase!
      .from("health_items")
      .select("id, display_name")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("item_type", ["prescribed_medication", "otc_medication", "supplement", "herb"])
      .order("display_name"),
  ]);

  const itemIds = (healthItems ?? []).map((healthItem) => healthItem.id);
  const { data: regimens } = itemIds.length
    ? await supabase!
        .from("medication_regimens")
        .select("id, health_item_id")
        .eq("user_id", user.id)
        .eq("active", true)
        .in("health_item_id", itemIds)
    : { data: [] };
  const regimenIds = (regimens ?? []).map((regimen) => regimen.id);
  const { data: segments } = regimenIds.length
    ? await supabase!
        .from("schedule_segments")
        .select("regimen_id, local_times, dose_amount")
        .eq("user_id", user.id)
        .in("regimen_id", regimenIds)
        .order("sequence")
    : { data: [] };

  const medicines = (healthItems ?? []).map((healthItem) => {
    const regimen = (regimens ?? []).find((candidate) => candidate.health_item_id === healthItem.id);
    const medicineSegments = (segments ?? []).filter((segment) => segment.regimen_id === regimen?.id);
    const times = medicineSegments.flatMap((segment) => segment.local_times ?? []).map((time) => String(time).slice(0, 5));
    return {
      id: healthItem.id,
      name: healthItem.display_name,
      regimenId: regimen?.id ?? null,
      schedule: times.length ? `Daily at ${times.join(" and ")}` : null,
    };
  });

  return (
    <>
      <PageHeading
        eyebrow="Times stay in your timezone"
        title="Calendar"
        description="Add appointments, follow-ups, and the medicine times you have chosen."
      />
      <CalendarManager
        userId={user.id}
        events={events ?? []}
        medicines={medicines}
        initialPanel={newPanel === "schedule" ? "schedule" : newPanel === "event" ? "event" : undefined}
        initialMedicineId={item}
      />
    </>
  );
}
