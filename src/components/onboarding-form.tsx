"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { onboardingSchema } from "@/lib/health/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const parsed = onboardingSchema.safeParse({
      preferredName: form.get("preferredName"),
      familyName: form.get("familyName") || undefined,
      dateOfBirth: form.get("dateOfBirth"),
      ukResident: form.get("ukResident") === "on",
      adultConfirmed: form.get("adultConfirmed") === "on",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      privacyAccepted: form.get("privacyAccepted") === "on",
      healthDataConsent: form.get("healthDataConsent") === "on",
      sex: form.get("sex") || undefined,
      weightKg: form.get("weightKg") || undefined,
      accessibilityNeeds: form.get("accessibilityNeeds") || undefined,
      emergencyContact: form.get("emergencyContact") || undefined,
      freeformAbout: form.get("freeformAbout") || undefined,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Please check your answers.");
      setBusy(false);
      return;
    }
    const value = parsed.data;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase!.from("health_profiles").upsert({
      user_id: userId,
      preferred_name: value.preferredName,
      family_name: value.familyName || null,
      date_of_birth: value.dateOfBirth,
      uk_resident: value.ukResident,
      adult_confirmed: value.adultConfirmed,
      timezone: value.timezone,
      privacy_accepted_at: new Date().toISOString(),
      health_data_consent_at: new Date().toISOString(),
      sex: value.sex || null,
      weight_kg: value.weightKg || null,
      accessibility_needs: value.accessibilityNeeds || null,
      emergency_contact: value.emergencyContact
        ? { summary: value.emergencyContact }
        : null,
      freeform_about: value.freeformAbout || null,
    });
    if (error) {
      setMessage(`We couldn’t create your record. ${error.message}`);
      setBusy(false);
      return;
    }
    router.replace("/today");
    router.refresh();
  }

  return (
    <form className="onboarding-form" onSubmit={save}>
      <div className="onboarding-section">
        <p className="eyebrow">1 of 2 · About you</p>
        <h1>Let’s make this yours.</h1>
        <p>Only the essentials are required. You can change optional details later.</p>
        <div className="field-grid">
          <label>
            Preferred name <span aria-hidden="true">*</span>
            <input name="preferredName" required autoComplete="given-name" />
          </label>
          <label>
            Family name <span className="optional">Optional</span>
            <input name="familyName" autoComplete="family-name" />
          </label>
          <label>
            Date of birth <span aria-hidden="true">*</span>
            <input name="dateOfBirth" type="date" required autoComplete="bday" />
          </label>
          <label>
            Sex <span className="optional">Optional</span>
            <select name="sex" defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="other">Another description</option>
            </select>
          </label>
          <label>
            Weight in kg <span className="optional">Optional</span>
            <input name="weightKg" type="number" min="1" max="500" step="0.1" inputMode="decimal" />
          </label>
          <label className="wide-field">
            Accessibility needs <span className="optional">Optional</span>
            <textarea name="accessibilityNeeds" rows={3} />
          </label>
          <label className="wide-field">
            Emergency contact <span className="optional">Optional</span>
            <textarea name="emergencyContact" rows={2} placeholder="Name, relationship, and how to reach them" />
          </label>
          <label className="wide-field freeform-field">
            Anything else about you? <span className="optional">Optional</span>
            <textarea
              name="freeformAbout"
              rows={6}
              placeholder="Share anything that helps describe your health, routines, work, food, sleep, exercise, or what matters to you."
            />
          </label>
        </div>
      </div>

      <div className="onboarding-section consent-section">
        <div className="consent-heading">
          <ShieldCheck size={27} aria-hidden="true" />
          <div>
            <p className="eyebrow">2 of 2 · Your choices</p>
            <h2>Before we create your record</h2>
          </div>
        </div>
        <label className="check-row">
          <input type="checkbox" name="ukResident" required />
          <span>I confirm that I live in the United Kingdom.</span>
        </label>
        <label className="check-row">
          <input type="checkbox" name="adultConfirmed" required />
          <span>I confirm that I am aged 18 or over.</span>
        </label>
        <label className="check-row">
          <input type="checkbox" name="privacyAccepted" required />
          <span>I accept the privacy notice and understand how SignalRx stores my data.</span>
        </label>
        <label className="check-row">
          <input type="checkbox" name="healthDataConsent" required />
          <span>
            I explicitly consent to SignalRx processing the health information I choose
            to add. I can withdraw this consent and delete my account.
          </span>
        </label>
        {message ? <p className="form-message" role="alert">{message}</p> : null}
        <button className="button button-primary" disabled={busy}>
          {busy ? "Creating your record…" : "Create my health record"}
          {!busy ? <ArrowRight size={18} aria-hidden="true" /> : null}
        </button>
      </div>
    </form>
  );
}
