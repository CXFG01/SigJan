import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleHelp,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main id="main-content">
        <section className="hero">
          <div className="hero-inner shell-width">
            <div className="hero-copy">
              <p className="eyebrow">Medication reconciliation, made human</p>
              <h1 className="display-title">One accurate medication story.</h1>
              <p className="body-large">
                Bring together prescriptions, over-the-counter medicines,
                vitamins, supplements, and what you actually take. SignalRx
                prepares the details that need professional review.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/demo">
                  Review a medication list <ArrowRight size={18} />
                </Link>
                <Link
                  className="button button-secondary"
                  href="/professional"
                >
                  Open pharmacist demo
                </Link>
              </div>
              <div className="hero-assurance">
                <ShieldCheck aria-hidden="true" size={21} />
                <span>
                  SignalRx supports a pharmacist or clinician review. It does
                  not replace one, and it never tells you to change prescribed
                  treatment on its own.
                </span>
              </div>
            </div>

            <div
              className="story-visual"
              aria-label="Illustration of fragmented medication sources becoming one verified record"
            >
              <div className="story-sheet story-sheet-a" aria-hidden="true">
                <div className="sheet-header">
                  <span>Hospital discharge</span>
                  <span>24 Jul</span>
                </div>
                <div className="sheet-body">
                  <div className="sheet-line" />
                  <div className="sheet-line" />
                  <div className="medicine-label">
                    <strong>Apixaban</strong>
                    <small>Strength copied from discharge letter</small>
                  </div>
                  <div className="medicine-label">
                    <strong>Diltiazem</strong>
                    <small>Formulation needs confirmation</small>
                  </div>
                  <div className="sheet-line" />
                  <div className="sheet-line" />
                </div>
              </div>

              <div className="story-sheet story-sheet-b" aria-hidden="true">
                <div className="sheet-header">
                  <span>At home</span>
                  <span>Patient report</span>
                </div>
                <div className="sheet-body">
                  <div className="medicine-label">
                    <strong>Ibuprofen</strong>
                    <small>Sometimes, for knee pain</small>
                  </div>
                  <div className="medicine-label">
                    <strong>Ginkgo</strong>
                    <small>Daily — exact product missing</small>
                  </div>
                  <div className="sheet-line" />
                  <div className="sheet-line" />
                  <div className="sheet-line" />
                </div>
              </div>

              <div className="story-sheet story-sheet-c" aria-hidden="true">
                <div className="sheet-header">
                  <span>Medication story</span>
                  <span>Ready for review</span>
                </div>
                <div className="sheet-body">
                  <div className="medicine-label">
                    <strong>6 current products</strong>
                    <small>4 prescriptions · 1 OTC · 1 supplement</small>
                  </div>
                  <div className="medicine-label">
                    <strong>3 focused questions</strong>
                    <small>Each linked to source evidence and missing context</small>
                  </div>
                  <div className="medicine-label">
                    <strong>One accountable plan</strong>
                    <small>Published only after professional review</small>
                  </div>
                </div>
              </div>

              <div className="source-thread" aria-hidden="true">
                <span className="source-thread-dot" />
                Source preserved
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell-width">
            <div className="section-heading">
              <p className="eyebrow">How it works</p>
              <div>
                <h2 className="section-title">
                  The list comes first. Then the evidence.
                </h2>
                <p className="body-copy">
                  SignalRx turns scattered boxes, lists, and recollections into
                  a reviewable record—without silently guessing what is true.
                </p>
              </div>
            </div>

            <div className="workflow-steps">
              <article className="workflow-step">
                <span className="workflow-index">01</span>
                <h3>Bring every source together</h3>
                <p>
                  Add discharge paperwork, medicine boxes, a voice recap, or
                  manual entries. Prescriptions, OTC products, supplements, and
                  food exposures remain distinct.
                </p>
              </article>
              <article className="workflow-step">
                <span className="workflow-index">02</span>
                <h3>Confirm what you actually take</h3>
                <p>
                  See the original wording beside each interpretation. Correct
                  strength, dose, formulation, timing, and current-use status
                  before anything is trusted.
                </p>
              </article>
              <article className="workflow-step">
                <span className="workflow-index">03</span>
                <h3>Close the loop with a professional</h3>
                <p>
                  Focus on a few source-backed concerns, answer missing-context
                  questions, and receive a reviewed plan with a named owner and
                  follow-up date.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section-ink">
          <div className="shell-width evidence-stage">
            <div className="evidence-record">
              <div className="evidence-record-header">
                <span>Demo evidence record · SRX-EV-001</span>
                <span>Synthetic, paraphrased</span>
              </div>
              <div className="evidence-record-body">
                <p className="eyebrow">Established evidence</p>
                <h3>
                  Anticoagulant use and intermittent ibuprofen need a
                  pharmacist’s attention.
                </h3>
                <p className="muted">
                  Potential severity, evidence strength, patient-context match,
                  and data completeness remain separate—never collapsed into a
                  single score.
                </p>
                <dl className="evidence-provenance">
                  <div>
                    <dt>Source type</dt>
                    <dd>Seeded clinical rule</dd>
                  </div>
                  <div>
                    <dt>Context gap</dt>
                    <dd>Use frequency</dd>
                  </div>
                  <div>
                    <dt>Next step</dt>
                    <dd>Professional review</dd>
                  </div>
                  <div>
                    <dt>Coverage</dt>
                    <dd>Bounded demo set</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <p className="eyebrow">Evidence with edges</p>
              <h2 className="section-title">
                Every concern shows its source—and its limits.
              </h2>
              <p className="body-large">
                Exact provenance, applicability notes, missing information, and
                evidence tier stay visible. Research hypotheses never enter the
                patient result.
              </p>
              <Link className="text-link" href="/about/safety">
                See how SignalRx separates evidence <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell-width boundary-grid">
            <div>
              <p className="eyebrow">A clear boundary</p>
              <h2 className="section-title">
                Built to support a conversation—not replace it.
              </h2>
              <p className="body-large">
                SignalRx can organise, compare, and explain. A qualified
                professional decides what is clinically relevant and publishes
                the plan.
              </p>
            </div>
            <div className="boundary-list">
              <article className="boundary-item">
                <FileCheck2 aria-hidden="true" size={22} />
                <div>
                  <h3>Nothing extracted is silently trusted</h3>
                  <p className="muted">
                    Uncertain identity, missing strength, and conflicting
                    sources remain visible until confirmed.
                  </p>
                </div>
              </article>
              <article className="boundary-item">
                <CircleHelp aria-hidden="true" size={22} />
                <div>
                  <h3>Missing information is never reassuring</h3>
                  <p className="muted">
                    The interface says what is unknown and turns it into a
                    focused question for the care team.
                  </p>
                </div>
              </article>
              <article className="boundary-item">
                <Check aria-hidden="true" size={22} />
                <div>
                  <h3>The reviewed plan has an owner</h3>
                  <p className="muted">
                    Dispositions, reasons, follow-up actions, and patient-facing
                    wording create an accountable audit trail.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section final-cta">
          <div className="shell-width final-cta-inner">
            <div>
              <p className="eyebrow">Synthetic demonstration</p>
              <h2 className="section-title">
                Help Evelyn make sense of what came home.
              </h2>
              <p className="body-large">
                Walk through the patient, caregiver, or pharmacist experience.
                No real health information or account is needed.
              </p>
            </div>
            <Link className="button button-primary" href="/demo">
              Choose a demo role <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
