import Link from "next/link";
import { ArrowRight, CalendarClock, Check, CheckCircle2, Circle, CirclePlus, Clock3, Pill } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [{ data: profile }, { data: items }, { data: events }, { count: candidates }] = await Promise.all([
    supabase!
      .from("health_profiles")
      .select("preferred_name")
      .eq("user_id", user.id)
      .single(),
    supabase!
      .from("health_items")
      .select("id, display_name, item_type, details, starts_on, ends_on")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase!
      .from("calendar_events")
      .select("id, title, starts_at, event_type")
      .eq("user_id", user.id)
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .order("starts_at"),
    supabase!
      .from("candidate_facts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("confirmation_state", "candidate"),
  ]);

  const medicines = (items ?? []).filter((item) =>
    ["prescribed_medication", "otc_medication", "supplement", "herb"].includes(item.item_type),
  );
  const medicineIds = medicines.map((medicine) => medicine.id);
  const { data: regimens } = medicineIds.length
    ? await supabase!
        .from("medication_regimens")
        .select("id, health_item_id")
        .eq("user_id", user.id)
        .eq("active", true)
        .in("health_item_id", medicineIds)
    : { data: [] };
  const regimenIds = (regimens ?? []).map((regimen) => regimen.id);
  const { data: segments } = regimenIds.length
    ? await supabase!
        .from("schedule_segments")
        .select("regimen_id, local_times")
        .eq("user_id", user.id)
        .in("regimen_id", regimenIds)
    : { data: [] };
  const medicineSchedules = new Map(
    medicines.map((medicine) => {
      const regimen = (regimens ?? []).find((candidate) => candidate.health_item_id === medicine.id);
      const times = (segments ?? [])
        .filter((segment) => segment.regimen_id === regimen?.id)
        .flatMap((segment) => segment.local_times ?? [])
        .map((time) => String(time).slice(0, 5));
      return [medicine.id, times] as const;
    }),
  );
  const scheduledMedicineCount = [...medicineSchedules.values()].filter((times) => times.length).length;
  const gettingStartedSteps = [
    { label: "Add your first health item", detail: "Type, photograph, upload, or record it.", href: "/add", complete: Boolean(items?.length) },
    { label: "Set a medicine time", detail: "Only if you take a medicine or supplement.", href: medicines[0] ? `/calendar?new=schedule&item=${medicines[0].id}` : "/add", complete: scheduledMedicineCount > 0 },
    { label: "Add an appointment or follow-up", detail: "Keep the next date in one place.", href: "/calendar?new=event", complete: Boolean(events?.length) },
  ];
  const gettingStartedComplete = gettingStartedSteps.every((step) => step.complete);
  const nextAction =
    candidates && candidates > 0
      ? { href: "/add?review=1", label: `Review ${candidates} suggested ${candidates === 1 ? "fact" : "facts"}` }
      : medicines.length === 0
        ? { href: "/add", label: "Add your first health item" }
        : scheduledMedicineCount < medicines.length
          ? { href: `/calendar?new=schedule&item=${medicines.find((medicine) => !(medicineSchedules.get(medicine.id)?.length))?.id ?? medicines[0].id}`, label: "Set up a medicine schedule" }
          : { href: "/add?mode=text", label: "Add something to your record" };

  return (
    <>
      <PageHeading
        eyebrow={new Intl.DateTimeFormat("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date())}
        title={`Today, ${profile?.preferred_name ?? ""}`.trim()}
        description="Your next steps, medicine routines, and plans in one place."
        action={
          <Link className="button button-primary" href={nextAction.href}>
            {nextAction.label} <ArrowRight size={18} />
          </Link>
        }
      />

      {!gettingStartedComplete ? (
        <section className="getting-started" aria-labelledby="getting-started-heading">
          <div className="getting-started-intro">
            <p className="eyebrow">Getting started</p>
            <h2 id="getting-started-heading">Build a useful record in three small steps</h2>
            <p>{gettingStartedSteps.filter((step) => step.complete).length} of {gettingStartedSteps.length} complete. You can do these in any order.</p>
          </div>
          <ol className="getting-started-list">
            {gettingStartedSteps.map((step) => (
              <li key={step.label} data-complete={step.complete}>
                {step.complete ? <CheckCircle2 size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}
                <div><strong>{step.label}</strong><p>{step.detail}</p></div>
                {step.complete ? <span>Done</span> : <Link className="text-link" href={step.href}>Start <ArrowRight size={16} /></Link>}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="today-focus" aria-labelledby="next-heading">
        <div className="today-focus-mark"><Clock3 size={24} aria-hidden="true" /></div>
        <div>
          <p className="eyebrow">Your next action</p>
          <h2 id="next-heading">{nextAction.label}</h2>
          <p>SignalRx only adds information to your record after you confirm it.</p>
        </div>
        <Link className="round-link" href={nextAction.href} aria-label={nextAction.label}>
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <div className="today-columns">
        <section aria-labelledby="medicines-heading">
          <div className="section-line-heading">
            <div>
              <p className="eyebrow">Medicines and supplements</p>
              <h2 id="medicines-heading">Due today</h2>
            </div>
            <Link className="text-link" href="/calendar">Open calendar</Link>
          </div>
          {medicines.length ? (
            <ul className="record-list">
              {medicines.map((medicine) => (
                <li key={medicine.id}>
                  <div className="record-symbol medicine-symbol"><Pill size={19} /></div>
                  <div>
                    <Link href={`/items/${medicine.id}`}><strong>{medicine.display_name}</strong></Link>
                    <p>{medicineSchedules.get(medicine.id)?.length ? `Daily at ${medicineSchedules.get(medicine.id)!.join(" and ")}` : "No confirmed schedule yet"}</p>
                  </div>
                  <Link className="small-action" href={`/calendar?new=schedule&item=${medicine.id}`}>
                    {medicineSchedules.get(medicine.id)?.length ? "Add time" : "Schedule"}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="teaching-empty">
              <Pill size={28} aria-hidden="true" />
              <h3>No medicines added yet</h3>
              <p>Add a label, prescription, list, or your own words. You’ll review every extracted detail.</p>
              <Link className="button button-secondary" href="/add">
                <CirclePlus size={18} /> Add health information
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="plans-heading">
          <div className="section-line-heading">
            <div>
              <p className="eyebrow">Plans</p>
              <h2 id="plans-heading">Later today</h2>
            </div>
          </div>
          {events?.length ? (
            <ul className="timeline-list">
              {events.map((event) => (
                <li key={event.id}>
                  <time>{new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.starts_at))}</time>
                  <span />
                  <div><strong>{event.title}</strong><p>{event.event_type.replace("_", " ")}</p></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="quiet-empty">
              <CalendarClock size={25} />
              <p>No appointments or follow-ups today.</p>
            </div>
          )}
        </section>
      </div>

      <section className="quick-capture" aria-labelledby="capture-heading">
        <div><Check size={23} /><h2 id="capture-heading">Notice something new?</h2></div>
        <p>Capture a symptom or note in your own words. SignalRx records what you report without deciding what caused it.</p>
        <Link className="button button-secondary" href="/add?mode=text">Add a note</Link>
      </section>
    </>
  );
}
