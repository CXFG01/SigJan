import Link from "next/link";
import { CalendarPlus, Clock3, Pill } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { getSupabaseServerClient, requireUserOrRedirect } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireUserOrRedirect();
  const supabase = await getSupabaseServerClient();
  const { data: events } = await supabase!
    .from("calendar_events")
    .select("id, title, event_type, starts_at, ends_at, timezone, note")
    .eq("user_id", user.id)
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at")
    .limit(50);
  return (
    <>
      <PageHeading eyebrow="Times stay in your timezone" title="Calendar" description="Medicines, appointments, follow-ups, and notes in one daily rhythm." action={<Link href="/add?mode=event" className="button button-primary"><CalendarPlus size={18} /> Add event</Link>} />
      <div className="calendar-layout">
        <aside className="date-marker">
          <span>{new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date())}</span>
          <strong>{new Date().getDate()}</strong>
          <p>Today</p>
        </aside>
        <section aria-label="Upcoming calendar items">
          {events?.length ? (
            <ol className="calendar-events">
              {events.map((event) => (
                <li key={event.id}>
                  <time>{new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(event.starts_at))}</time>
                  <div className="event-icon">{event.event_type === "reminder" ? <Pill size={19} /> : <Clock3 size={19} />}</div>
                  <div><h2>{event.title}</h2><p>{event.note || event.event_type.replaceAll("_", " ")}</p><small>{event.timezone}</small></div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="teaching-empty">
              <CalendarPlus size={30} />
              <h2>Your calendar is clear</h2>
              <p>Add an appointment or confirm a medicine schedule. Due states are calculated in your local timezone, including daylight-saving changes.</p>
              <Link href="/add?mode=event" className="button button-secondary">Add an event</Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
