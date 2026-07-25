import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Safety and evidence",
  description:
    "How SignalRx separates evidence, uncertainty, generated language, deterministic logic, and professional judgement.",
};

const principles = [
  {
    title: "Reality before reasoning",
    copy: "Identity, strength, formulation, dose, route, timing, and current use stay provisional until a person confirms them.",
  },
  {
    title: "Evidence before fluency",
    copy: "A polished explanation cannot create a concern, choose severity, add a mechanism, or invent management guidance.",
  },
  {
    title: "Uncertainty stays visible",
    copy: "Missing product details, dates, context, and source coverage reduce confidence and become explicit review questions.",
  },
  {
    title: "Human decisions close the loop",
    copy: "Medication changes, final relevance, escalation, causality, and treatment recommendations remain professional decisions.",
  },
];

const tiers = [
  {
    title: "Authoritative",
    copy: "A governed label, licensed knowledge source, or approved clinical guidance. The demo uses synthetic paraphrases rather than official quotations.",
  },
  {
    title: "Clinical evidence",
    copy: "Published evidence that supports a relationship within a defined population or context, with applicability and limitations shown.",
  },
  {
    title: "Signal",
    copy: "Observational information that may justify expert review but does not estimate personal risk or establish causality.",
  },
  {
    title: "Hypothesis",
    copy: "Mechanistic or computational research that can prioritise further study. It cannot affect the patient plan.",
  },
];

export default function SafetyPage() {
  return (
    <div className="content-page">
      <MarketingHeader />
      <main id="main-content">
        <section className="content-hero">
          <div className="content-hero-inner shell-width">
            <div className="content-hero-copy">
              <p className="eyebrow">Safety and evidence</p>
              <h1 className="page-title">
                Clear limits are part of the product.
              </h1>
              <p className="body-large">
                SignalRx supports medication reconciliation, evidence
                navigation, communication, and professional review. It does not
                diagnose, prescribe, determine causality, or independently
                direct treatment changes.
              </p>
            </div>
            <p className="content-hero-note">
              This hackathon build uses synthetic patient data, deterministic
              fixtures, and a bounded evidence set. It is not clinically
              validated or intended for real care.
            </p>
          </div>
        </section>

        <section className="content-body">
          <div className="content-body-grid shell-width">
            <nav className="content-nav" aria-label="Safety page sections">
              <p className="eyebrow">On this page</p>
              <ol>
                <li>
                  <a href="#principles">Product principles</a>
                </li>
                <li>
                  <a href="#boundaries">System boundaries</a>
                </li>
                <li>
                  <a href="#evidence">Evidence tiers</a>
                </li>
                <li>
                  <a href="#language">Safety language</a>
                </li>
                <li>
                  <a href="#urgent-help">Urgent help</a>
                </li>
              </ol>
            </nav>

            <div className="content-sections">
              <section className="content-section" id="principles">
                <p className="eyebrow">Product principles</p>
                <h2>The safeguards begin before a concern appears.</h2>
                <div className="principle-list">
                  {principles.map((principle, index) => (
                    <article className="principle-row" key={principle.title}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{principle.title}</strong>
                      <p>{principle.copy}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-section" id="boundaries">
                <p className="eyebrow">System boundaries</p>
                <h2>Different work belongs to different systems.</h2>
                <h3>Generated language may help with</h3>
                <ul>
                  <li>
                    Candidate field extraction, subject to visible confirmation.
                  </li>
                  <li>
                    Plain-language restatement of an approved evidence package.
                  </li>
                  <li>
                    A clinician handoff draft or structured symptom narrative.
                  </li>
                </ul>
                <h3>Deterministic code controls</h3>
                <ul>
                  <li>
                    Confirmed identity, duplicate ingredients, exposure overlap,
                    rule lookup, evidence tiers, ordering, workflow transitions,
                    and audit events.
                  </li>
                  <li>
                    Prohibited-phrase checks and separation of research data from
                    clinical output.
                  </li>
                </ul>
                <h3>A professional remains responsible for</h3>
                <ul>
                  <li>
                    Final relevance, medication changes, escalation, causality,
                    treatment recommendations, and publishing the patient plan.
                  </li>
                </ul>
              </section>

              <section className="content-section" id="evidence">
                <p className="eyebrow">Evidence tiers</p>
                <h2>Evidence type and potential severity are not the same.</h2>
                <p>
                  SignalRx also keeps patient-context match and data completeness
                  separate. A potentially serious issue can still have incomplete
                  context, and a well-documented source does not automatically
                  apply to one patient.
                </p>
                <div className="tier-list">
                  {tiers.map((tier) => (
                    <article className="tier-row" key={tier.title}>
                      <strong>{tier.title}</strong>
                      <p>{tier.copy}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-section" id="language">
                <p className="eyebrow">Safety language</p>
                <h2>Wording must not outrun the evidence.</h2>
                <div className="allowed-language">
                  <div className="language-column" data-kind="use">
                    <h3>SignalRx uses</h3>
                    <ul>
                      <li>Needs professional review</li>
                      <li>Potential concern</li>
                      <li>Context incomplete</li>
                      <li>Insufficient evidence</li>
                      <li>
                        No documented concern found in the sources searched
                      </li>
                      <li>
                        This does not prove that the medicine caused the symptom
                      </li>
                    </ul>
                  </div>
                  <div className="language-column" data-kind="avoid">
                    <h3>SignalRx avoids</h3>
                    <ul>
                      <li>Binary “safe” or “unsafe” conclusions</li>
                      <li>“This drug caused…”</li>
                      <li>“You should stop…”</li>
                      <li>“You should reduce…”</li>
                      <li>“AI recommends…”</li>
                      <li>Research predictions presented as clinical proof</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="content-section" id="urgent-help">
                <p className="eyebrow">Urgent help boundary</p>
                <h2>SignalRx does not perform autonomous triage.</h2>
                <p>
                  Seek urgent medical help for severe or rapidly worsening
                  symptoms, major bleeding, difficulty breathing, collapse,
                  severe confusion, or other symptoms that feel immediately
                  dangerous. This list is not exhaustive.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
