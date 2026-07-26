import Link from "next/link";
import { ArrowRight, CalendarClock, Check, CirclePlus, Clock3, Pill } from "lucide-react";
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

  const [{ data: items }, { data: events }, { count: candidates }] = await Promise.all([
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
  const nextAction =
    candidates && candidates > 0
      ? { href: "/add?review=1", label: `Review ${candidates} suggested ${candidates === 1 ? "fact" : "facts"}` }
      : medicines.length === 0
        ? { href: "/add", label: "Add your first health item" }
        : { href: "/calendar", label: "Set up a medicine schedule" };

  return (
    <>
      <PageHeading
        eyebrow={new Intl.DateTimeFormat("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date())}
        title="Today"
        description="What needs your attention, without the noise."
        action={
          <Link className="button button-primary" href={nextAction.href}>
            {nextAction.label} <ArrowRight size={18} />
          </Link>
        }
      />

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
                    <p>No confirmed schedule yet</p>
                  </div>
                  <Link className="small-action" href="/calendar">Schedule</Link>
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
