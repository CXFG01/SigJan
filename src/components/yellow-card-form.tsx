"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileWarning, Printer } from "lucide-react";

type Item = { id: string; display_name: string };

export function YellowCardForm({ symptoms, medicines }: { symptoms: Item[]; medicines: Item[] }) {
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/yellow-cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        symptomItemId: form.get("symptom"),
        suspectedMedicineIds: form.getAll("medicine"),
        userSuspectsMedicine: form.get("suspect") === "on",
        notes: form.get("notes") || undefined,
      }),
    });
    const result = await response.json();
    if (response.ok) setDraft(result.draft);
    else setMessage(result.error || "The draft could not be prepared.");
    setBusy(false);
  }

  if (draft) {
    return (
      <article className="yellow-draft">
        <div className="draft-banner"><FileWarning size={23} /><p><strong>Draft only.</strong> This chronology does not prove cause and has not been submitted.</p></div>
        <label>Draft content<textarea rows={22} defaultValue={JSON.stringify(draft, null, 2)} /></label>
        <div className="review-actions">
          <button className="button button-secondary" onClick={() => window.print()}><Printer size={18} /> Print draft</button>
          <Link className="button button-primary" href="https://yellowcard.mhra.gov.uk/" target="_blank" rel="noreferrer">Open official MHRA service <ExternalLink size={18} /></Link>
        </div>
        <p>Contact an appropriate clinician. For severe or rapidly worsening symptoms, call NHS 111; call 999 in an emergency.</p>
      </article>
    );
  }

  return (
    <form className="yellow-form" onSubmit={createDraft}>
      <div className="draft-banner"><FileWarning size={23} /><p>Anyone may report a suspicion. SignalRx assembles only the chronology you select and never submits for you.</p></div>
      <label>Symptom you want to report<select name="symptom" required><option value="">Choose a confirmed symptom</option>{symptoms.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select></label>
      <fieldset><legend>Medicine or medicines you suspect</legend>{medicines.map((item) => <label className="check-row" key={item.id}><input type="checkbox" name="medicine" value={item.id} /><span>{item.display_name}</span></label>)}</fieldset>
      <label>Anything else to include <span className="optional">Optional</span><textarea name="notes" rows={5} /></label>
      <label className="check-row"><input type="checkbox" name="suspect" required /><span>I suspect that one or more selected medicines may be involved. I understand that timing does not prove cause.</span></label>
      {message ? <p className="form-message" role="alert">{message}</p> : null}
      <button className="button button-primary" disabled={busy || !symptoms.length || !medicines.length}>{busy ? "Preparing chronology…" : "Prepare my Yellow Card draft"}</button>
    </form>
  );
}
