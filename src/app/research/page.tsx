import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Research hypothesis",
  description:
    "An isolated, precomputed research hypothesis that does not affect the SignalRx patient plan.",
};

export default function ResearchPage() {
  return (
    <div className="content-page">
      <MarketingHeader />
      <main id="main-content">
        <section className="content-hero research-hero">
          <div className="shell-width">
            <div className="content-hero-inner">
              <div className="content-hero-copy">
                <p className="eyebrow">Separate research environment</p>
                <h1 className="page-title">
                  A mechanism worth testing—not a clinical conclusion.
                </h1>
                <p className="body-large">
                  This precomputed demonstration shows how a candidate
                  relationship might be documented for expert follow-up. It is
                  technically and visually isolated from Evelyn’s medication
                  review.
                </p>
              </div>
              <div className="research-boundary">
                <strong>
                  <FlaskConical
                    aria-hidden="true"
                    size={18}
                    style={{ display: "inline", marginRight: "0.45rem" }}
                  />
                  Research hypothesis only
                </strong>
                <p>
                  This output does not establish a clinical interaction and does
                  not affect the patient’s medication plan.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-3xl)" }}>
              <div
                className="mechanism-stage"
                role="img"
                aria-label="Conceptual diagram of two compounds considered separately against a candidate protein target"
              >
                <div className="mechanism-orbit" aria-hidden="true" />
                <div className="mechanism-node" data-node="compound-a">
                  <span>Compound A</span>
                  <strong>Apixaban</strong>
                </div>
                <div className="mechanism-node" data-node="target">
                  <span>Candidate mediator</span>
                  <strong>Protein X</strong>
                </div>
                <div className="mechanism-node" data-node="compound-b">
                  <span>Compound B</span>
                  <strong>Ginkgo constituent</strong>
                </div>
              </div>
              <div className="research-caption">
                <span>
                  Conceptual precomputed visual · no live molecular inference
                </span>
                <span>Protocol SRX-RH-01 · synthetic demonstration</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell-width">
            <div className="section-heading">
              <p className="eyebrow">Interpretation boundary</p>
              <div>
                <h2 className="section-title">
                  The visual can rank a question. It cannot answer the clinical
                  one.
                </h2>
                <p className="body-copy">
                  A computational prediction would need independent assay,
                  exposure, clinical, and expert validation before it could move
                  beyond research.
                </p>
              </div>
            </div>
            <div className="research-grid">
              <div className="research-fact">
                <span>Permitted statement</span>
                <strong>
                  A candidate shared mediator may be worth laboratory study.
                </strong>
              </div>
              <div className="research-fact">
                <span>Not established</span>
                <strong>
                  Binding, competition, exposure, or an interaction in patients.
                </strong>
              </div>
              <div className="research-fact">
                <span>Clinical boundary</span>
                <strong>
                  No research edge can become a patient concern automatically.
                </strong>
              </div>
            </div>
            <div style={{ marginTop: "var(--space-2xl)" }}>
              <Link className="button button-secondary" href="/patient/concerns">
                <ArrowLeft aria-hidden="true" size={17} />
                Return to clinical concerns
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
