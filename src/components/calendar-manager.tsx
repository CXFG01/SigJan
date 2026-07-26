"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Clock3, Pill, Trash2, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CalendarEvent = {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  note: string | null;
};

type Medicine = {
  id: string;
  name: string;
  regimenId: string | null;
  schedule: string | null;
};

export function CalendarManager({
  userId,
  events,
  medicines,
  initialPanel,
  initialMedicineId,
}: {
  userId: string;
  events: CalendarEvent[];
  medicines: Medicine[];
  initialPanel?: "event" | "schedule";
  initialMedicineId?: string;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"event" | "schedule" | null>(initialPanel ?? null);
  const [selectedMedicineId, setSelectedMedicineId] = useState(initialMedicineId ?? medicines[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get("startsAt") ?? "");
    const endsAt = String(form.get("endsAt") ?? "");
    if (!startsAt) {
      setMessage("Choose a date and time.");
      setBusy(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase!.from("calendar_events").insert({
      user_id: userId,
      title: String(form.get("title") ?? "").trim(),
      event_type: String(form.get("eventType") ?? "appointment"),
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      note: String(form.get("note") ?? "").trim() || null,
    });
    setBusy(false);
    if (error) {
      setMessage(`We couldn’t save this event. ${error.message}`);
      return;
    }
    setPanel(null);
    router.replace("/calendar");
    router.refresh();
  }

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const medicineId = String(form.get("medicineId") ?? "");
    const medicine = medicines.find((item) => item.id === medicineId);
    const localTime = String(form.get("localTime") ?? "");
    const doseAmount = Number(form.get("doseAmount") ?? 1);
    if (!medicine || !localTime) {
      setMessage("Choose a medicine and a time.");
      setBusy(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let regimenId = medicine.regimenId;
    if (!regimenId) {
      const { data, error } = await supabase!
        .from("medication_regimens")
        .insert({
          user_id: userId,
          health_item_id: medicine.id,
          instructions: String(form.get("instructions") ?? "").trim() || null,
          active: true,
        })
        .select("id")
        .single();
      if (error) {
        setBusy(false);
        setMessage(`We couldn’t create this schedule. ${error.message}`);
        return;
      }
      regimenId = data.id;
    }

    const today = new Date();
    const startsOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const { error } = await supabase!.from("schedule_segments").insert({
      user_id: userId,
      regimen_id: regimenId,
      kind: "fixed_time",
      starts_on: startsOn,
      local_times: [localTime],
      dose_amount: Number.isFinite(doseAmount) && doseAmount > 0 ? doseAmount : 1,
      details: {
        label: String(form.get("instructions") ?? "").trim() || "Daily medicine",
      },
    });
    setBusy(false);
    if (error) {
      setMessage(`We couldn’t create this schedule. ${error.message}`);
      return;
    }
    setPanel(null);
    router.replace("/calendar");
    router.refresh();
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("Remove this event from your calendar?")) return;
    setBusy(true);
    setMessage(null);
    const { error } = await getSupabaseBrowserClient()!
      .from("calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      setMessage("The event could not be removed. Please try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="calendar-workspace">
      <div className="calendar-toolbar" aria-label="Calendar actions">
        <button className="button button-primary" type="button" onClick={() => setPanel("event")}>
          <CalendarPlus size={18} aria-hidden="true" /> Add an event
        </button>
        {medicines.length ? (
          <button className="button button-secondary" type="button" onClick={() => setPanel("schedule")}>
            <Pill size={18} aria-hidden="true" /> Schedule a medicine
          </button>
        ) : null}
      </div>

      {panel ? (
        <section className="calendar-editor" aria-labelledby={`${panel}-editor-heading`}>
          <div className="calendar-editor-heading">
            <div>
              <p className="eyebrow">{panel === "event" ? "Calendar item" : "Medicine routine"}</p>
              <h2 id={`${panel}-editor-heading`}>
                {panel === "event" ? "Add an event" : "Set a daily medicine time"}
              </h2>
            </div>
            <button className="icon-button" type="button" onClick={() => setPanel(null)} aria-label="Close form">
              <X size={20} />
            </button>
          </div>
          {panel === "event" ? (
            <form className="calendar-form" onSubmit={createEvent}>
              <label className="wide-field">Title <input name="title" required maxLength={160} autoFocus /></label>
              <label>
                Type
                <select name="eventType" defaultValue="appointment">
                  <option value="appointment">Appointment</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="reminder">Reminder</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>Starts <input name="startsAt" type="datetime-local" required /></label>
              <label>Ends <span className="optional">Optional</span><input name="endsAt" type="datetime-local" /></label>
              <label className="wide-field">Note <span className="optional">Optional</span><textarea name="note" rows={3} maxLength={1000} /></label>
              <button className="button button-primary" disabled={busy}>
                <Check size={18} /> {busy ? "Saving…" : "Save event"}
              </button>
            </form>
          ) : (
            <form className="calendar-form" onSubmit={createSchedule}>
              <label className="wide-field">
                Medicine
                <select name="medicineId" value={selectedMedicineId} onChange={(event) => setSelectedMedicineId(event.target.value)} required>
                  {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}
                </select>
              </label>
              <label>Daily time <input name="localTime" type="time" required /></label>
              <label>Dose amount <input name="doseAmount" type="number" min="0.1" max="100" step="0.1" defaultValue="1" required /></label>
              <label className="wide-field">
                Instructions <span className="optional">Optional</span>
                <input name="instructions" maxLength={300} placeholder="For example, take with breakfast" />
              </label>
              <p className="calendar-form-note">SignalRx records the routine you choose. It does not recommend a dose or change your prescription.</p>
              <button className="button button-primary" disabled={busy}>
                <Check size={18} /> {busy ? "Saving…" : "Save schedule"}
              </button>
            </form>
          )}
          {message ? <p className="form-message wide-field" role="alert">{message}</p> : null}
        </section>
      ) : null}

      <section aria-labelledby="upcoming-heading">
        <div className="section-line-heading">
          <div>
            <p className="eyebrow">Your plans</p>
            <h2 id="upcoming-heading">Upcoming</h2>
          </div>
        </div>
        {events.length ? (
          <ol className="calendar-events">
            {events.map((event) => (
              <li key={event.id}>
                <time>{new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(event.starts_at))}</time>
                <div className="event-icon">{event.event_type === "reminder" ? <Pill size={19} /> : <Clock3 size={19} />}</div>
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.note || event.event_type.replaceAll("_", " ")}</p>
                  <small>{event.timezone}</small>
                </div>
                <button className="icon-button event-delete" type="button" disabled={busy} onClick={() => void deleteEvent(event.id)} aria-label={`Remove ${event.title}`}>
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="teaching-empty">
            <CalendarPlus size={30} />
            <h3>Your calendar is clear</h3>
            <p>Add appointments and follow-ups here. Medicine routines appear once you confirm a daily time.</p>
            <button className="button button-secondary" type="button" onClick={() => setPanel("event")}>Add your first event</button>
          </div>
        )}
      </section>

      {medicines.length ? (
        <section className="medicine-routines" aria-labelledby="routines-heading">
          <div className="section-line-heading">
            <div><p className="eyebrow">Medicines</p><h2 id="routines-heading">Daily routines</h2></div>
          </div>
          <ul className="record-list">
            {medicines.map((medicine) => (
              <li key={medicine.id}>
                <div className="record-symbol medicine-symbol"><Pill size={19} /></div>
                <div><strong>{medicine.name}</strong><p>{medicine.schedule ?? "No confirmed time yet"}</p></div>
                <button className="small-action" type="button" onClick={() => {
                  setSelectedMedicineId(medicine.id);
                  setPanel("schedule");
                }}>
                  {medicine.schedule ? "Add time" : "Schedule"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
