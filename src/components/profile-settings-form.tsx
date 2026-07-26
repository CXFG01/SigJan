"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  preferred_name: string;
  family_name: string | null;
  date_of_birth: string;
  sex: string | null;
  weight_kg: number | null;
  accessibility_needs: string | null;
  freeform_about: string | null;
  emergency_contact: unknown;
};

function emergencyContactText(value: unknown) {
  if (!value || typeof value !== "object" || !("originalText" in value)) return "";
  return typeof value.originalText === "string" ? value.originalText : "";
}

export function ProfileSettingsForm({ userId, profile }: { userId: string; profile: Profile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const dateOfBirth = String(form.get("dateOfBirth") ?? "");
    const eighteenthBirthday = new Date(`${dateOfBirth}T00:00:00`);
    eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18);
    if (eighteenthBirthday > new Date()) {
      setMessage("SignalRx is currently for adults aged 18 or over.");
      setBusy(false);
      return;
    }

    const emergencyText = String(form.get("emergencyContact") ?? "").trim();
    let emergencyContact: unknown = null;
    if (emergencyText) {
      try {
        const response = await fetch("/api/onboarding/emergency-contacts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: emergencyText }),
        });
        const result = await response.json().catch(() => null);
        emergencyContact = {
          originalText: emergencyText,
          contacts: response.ok && Array.isArray(result?.contacts) ? result.contacts : [],
          parsingStatus: response.ok ? "parsed" : "unavailable",
          ...(response.ok ? { model: result.model, parserVersion: result.parserVersion } : {}),
        };
      } catch {
        emergencyContact = { originalText: emergencyText, contacts: [], parsingStatus: "unavailable" };
      }
    }

    const weight = String(form.get("weightKg") ?? "").trim();
    const { error } = await getSupabaseBrowserClient()!
      .from("health_profiles")
      .update({
        preferred_name: String(form.get("preferredName") ?? "").trim(),
        family_name: String(form.get("familyName") ?? "").trim() || null,
        date_of_birth: dateOfBirth,
        sex: String(form.get("sex") ?? "").trim() || null,
        weight_kg: weight ? Number(weight) : null,
        accessibility_needs: String(form.get("accessibilityNeeds") ?? "").trim() || null,
        emergency_contact: emergencyContact,
        freeform_about: String(form.get("freeformAbout") ?? "").trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      setMessage(`We couldn’t update your profile. ${error.message}`);
      return;
    }
    setEditing(false);
    setMessage("Your profile has been updated.");
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="profile-summary">
        <dl className="detail-list">
          <div><dt>Name</dt><dd>{profile.preferred_name} {profile.family_name}</dd></div>
          <div><dt>Date of birth</dt><dd>{new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(`${profile.date_of_birth}T00:00:00`))}</dd></div>
          <div><dt>Sex</dt><dd>{profile.sex || "Not provided"}</dd></div>
          <div><dt>Weight</dt><dd>{profile.weight_kg ? `${profile.weight_kg} kg` : "Not provided"}</dd></div>
          <div><dt>Accessibility needs</dt><dd>{profile.accessibility_needs || "None provided"}</dd></div>
          <div><dt>Emergency contacts</dt><dd>{emergencyContactText(profile.emergency_contact) || "None provided"}</dd></div>
        </dl>
        {message ? <p className="success-message" role="status">{message}</p> : null}
        <button className="button button-secondary" type="button" onClick={() => setEditing(true)}>
          <Pencil size={18} /> Edit profile
        </button>
      </div>
    );
  }

  return (
    <form className="profile-edit-form" onSubmit={save}>
      <div className="field-grid">
        <label>Preferred name <input name="preferredName" defaultValue={profile.preferred_name} required maxLength={80} autoComplete="given-name" /></label>
        <label>Family name <span className="optional">Optional</span><input name="familyName" defaultValue={profile.family_name ?? ""} maxLength={100} autoComplete="family-name" /></label>
        <label>Date of birth <input name="dateOfBirth" type="date" defaultValue={profile.date_of_birth} required autoComplete="bday" /></label>
        <label>
          Sex <span className="optional">Optional</span>
          <select name="sex" defaultValue={profile.sex ?? ""}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
            <option value="other">Another description</option>
          </select>
        </label>
        <label>Weight in kg <span className="optional">Optional</span><input name="weightKg" type="number" min="1" max="500" step="0.1" defaultValue={profile.weight_kg ?? ""} /></label>
        <label className="wide-field">Accessibility needs <span className="optional">Optional</span><textarea name="accessibilityNeeds" rows={3} defaultValue={profile.accessibility_needs ?? ""} /></label>
        <label className="wide-field">Emergency contacts <span className="optional">Optional</span><textarea name="emergencyContact" rows={4} defaultValue={emergencyContactText(profile.emergency_contact)} /></label>
        <label className="wide-field">Anything else about you? <span className="optional">Optional</span><textarea name="freeformAbout" rows={5} defaultValue={profile.freeform_about ?? ""} /></label>
      </div>
      {message ? <p className="form-message" role="alert">{message}</p> : null}
      <div className="form-actions">
        <button className="button button-primary" disabled={busy}><Check size={18} /> {busy ? "Saving…" : "Save changes"}</button>
        <button className="button button-ghost" type="button" onClick={() => { setEditing(false); setMessage(null); }}><X size={18} /> Cancel</button>
      </div>
    </form>
  );
}
