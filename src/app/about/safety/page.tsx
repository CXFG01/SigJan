import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Safety boundary",
  description: "What SignalRx does, what it never does, and where professional care begins.",
};

const boundaries = [
  ["Organises, never diagnoses", "SignalRx structures what you and your sources say. It does not diagnose a condition or decide what caused a symptom."],
  ["Suggests, then waits", "AI extraction produces candidates only. A candidate cannot update your health record until you confirm it."],
  ["No automatic medicine changes", "A new prescription can be compared with your record, but SignalRx never stops, replaces, or changes a medicine for you."],
  ["Timing is not causality", "Network edges and Yellow Card drafts describe chronology, source membership, measurements, and your reports—not proof of interaction or cause."],
  ["Sources stay visible", "Original wording, excerpts, extraction method, model and schema versions, corrections, and confirmation state remain attached to confirmed facts."],
];

export default function SafetyPage() {
  return (
    <main id="main-content">
      <header className="landing-header shell-width"><Brand /><Link className="button button-primary" href="/auth">Start with email <ArrowRight size={18} /></Link></header>
      <section className="landing-section shell-width">
        <div className="section-intro"><ShieldCheck size={30} /><p className="eyebrow">Safety boundary</p><h1>Clear limits are part of the product.</h1></div>
        <div>
          <p className="body-large">SignalRx is a personal health organiser. It does not replace a doctor, pharmacist, NHS 111, or emergency care.</p>
          <ol className="plain-steps">
            {boundaries.map(([title, copy], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}
          </ol>
          <p className="body-large">For severe or rapidly worsening symptoms, call NHS 111. Call 999 in an emergency.</p>
        </div>
      </section>
    </main>
  );
}
