import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Leaf,
  Mic,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { LandingMotion } from "@/components/landing/landing-motion";
import { LifestyleMerge } from "@/components/landing/lifestyle-merge";
import "@/styles/landing.css";

const artefacts = [
  {
    id: "label",
    className: "signal-artefact-label",
    content: (
      <>
        <div className="signal-pharmacy-heading">
          <span>Community pharmacy</span>
          <Camera size={18} aria-hidden="true" />
        </div>
        <p className="signal-utility">Example pharmacy label</p>
        <strong data-source-fact>Metformin 500 mg tablets</strong>
        <p>Take one tablet twice a day with food.</p>
        <div className="signal-barcode" aria-hidden="true" />
      </>
    ),
    description:
      "A photographed pharmacy label for Metformin 500 milligram tablets.",
  },
  {
    id: "prescription-am",
    className: "signal-artefact-prescription signal-artefact-prescription-am",
    content: (
      <>
        <div className="signal-document-heading">
          <span aria-hidden="true">NHS</span>
          <div>
            <p className="signal-utility">Repeat prescription · 1 of 2</p>
            <strong>Morning medicines</strong>
          </div>
        </div>
        <ul>
          <li data-source-fact><span>Metformin</span><b>500 mg</b></li>
          <li><span>Amlodipine</span><b>5 mg</b></li>
        </ul>
      </>
    ),
    description: "An illustrative prescription containing two morning medicines.",
  },
  {
    id: "prescription-pm",
    className: "signal-artefact-prescription signal-artefact-prescription-pm",
    content: (
      <>
        <div className="signal-document-heading">
          <span aria-hidden="true">NHS</span>
          <div>
            <p className="signal-utility">Repeat prescription · 2 of 2</p>
            <strong>Evening medicines</strong>
          </div>
        </div>
        <ul>
          <li data-source-fact><span>Atorvastatin</span><b>20 mg</b></li>
          <li><span>Ramipril</span><b>2.5 mg</b></li>
        </ul>
      </>
    ),
    description: "An illustrative prescription containing two evening medicines.",
  },
  {
    id: "supplement",
    className: "signal-artefact-supplement",
    content: (
      <>
        <div className="signal-supplement-heading">
          <span><Leaf size={19} aria-hidden="true" /></span>
          <div>
            <p className="signal-utility">Supplement · added by you</p>
            <strong>Vitamin D3</strong>
          </div>
        </div>
        <p data-source-fact><b>1,000 IU</b> once each morning</p>
        <small>Brand and bottle photograph can stay attached.</small>
      </>
    ),
    description: "An example Vitamin D3 supplement entry.",
  },
  {
    id: "test",
    className: "signal-artefact-test",
    content: (
      <>
        <div className="signal-document-heading">
          <FileText size={22} aria-hidden="true" />
          <div>
            <p className="signal-utility">Blood test · PDF</p>
            <strong>Results summary</strong>
          </div>
        </div>
        <dl>
          <div data-source-fact><dt>HbA1c</dt><dd>48 mmol/mol</dd></div>
          <div><dt>Collected</dt><dd>12 July 2026</dd></div>
          <div><dt>Source</dt><dd>GP surgery</dd></div>
        </dl>
      </>
    ),
    description: "An example blood test PDF with an HbA1c result.",
  },
  {
    id: "letter",
    className: "signal-artefact-letter",
    content: (
      <>
        <p className="signal-letter-address">Northwick Park Hospital<br />Watford Road, Harrow</p>
        <div className="signal-letter-rule" />
        <p className="signal-utility">Outpatient appointment</p>
        <strong data-source-fact>Tuesday 18 August</strong>
        <p>Diabetes clinic · 10:30</p>
        <small>This example is not a real appointment.</small>
      </>
    ),
    description: "An illustrative hospital clinic appointment letter.",
  },
  {
    id: "voice",
    className: "signal-artefact-voice",
    content: (
      <>
        <div className="signal-voice-icon"><Mic size={24} aria-hidden="true" /></div>
        <div>
          <p className="signal-utility">Voice note · 00:18</p>
          <strong data-source-fact>“I’ve felt dizzy after lunch this week.”</strong>
          <div className="signal-waveform" aria-hidden="true">
            {[10, 22, 14, 31, 18, 38, 24, 15, 28, 12, 20, 9].map((height, index) => (
              <span key={index} style={{ height }} />
            ))}
          </div>
        </div>
      </>
    ),
    description: "An example voice note reporting dizziness after lunch.",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="signal-landing">
      <LandingMotion />
      <section className="signal-hero" aria-labelledby="signal-hero-title">
        <div className="signal-contours" aria-hidden="true" />
        <div className="signal-hero-fragments" aria-hidden="true">
          <span className="signal-fragment signal-fragment-label">500 mg</span>
          <span className="signal-fragment signal-fragment-date">18 AUG</span>
          <span className="signal-fragment signal-fragment-result">HbA1c 48</span>
          <span className="signal-fragment signal-fragment-note">“dizzy after lunch”</span>
          <span className="signal-fragment signal-fragment-list">Repeat medicines</span>
        </div>

        <div className="signal-hero-content">
          <p className="signal-kicker">A private health organiser for UK adults</p>
          <h1 id="signal-hero-title">Signal<span>Rx</span></h1>
          <p className="signal-hero-tagline">Your health, organised around you.</p>
          <Link className="signal-cta signal-cta-light" href="/auth">
            Create your record <ArrowRight size={21} aria-hidden="true" />
          </Link>
        </div>

        <div className="signal-hero-foot">
          <a className="signal-scroll-cue" href="#problem">
            See how it works <ArrowDown size={18} aria-hidden="true" />
          </a>
          <p>
            SignalRx organises information. It does not diagnose, change doses,
            or replace professional care.
          </p>
        </div>
      </section>

      <section id="problem" className="signal-problem signal-page-width" aria-labelledby="problem-heading">
        <p className="signal-section-label" data-signal-reveal>The whole picture</p>
        <h2 id="problem-heading" data-signal-reveal>
          Your repeat prescription is in the NHS App. Your latest dose is on a
          pharmacy label. Your symptoms are in your head.
          <span>Nobody has the whole picture—including you.</span>
        </h2>
      </section>

      <div className="signal-source-journey">
        <section className="signal-intake" aria-labelledby="intake-heading">
          <div className="signal-page-width signal-intake-grid">
            <div className="signal-intake-copy" data-signal-reveal>
              <p className="signal-section-label">Start with what you have</p>
              <h2 id="intake-heading">Tell it your way.</h2>
              <p>
                Speak naturally. Photograph a label. Add a letter, list, result,
                or note. SignalRx keeps the source attached to every suggested fact.
              </p>
              <ul className="signal-method-list" aria-label="Ways to add information">
                <li><Mic size={21} aria-hidden="true" /> Talk</li>
                <li><Camera size={21} aria-hidden="true" /> Photograph</li>
                <li><Upload size={21} aria-hidden="true" /> Upload</li>
                <li><FileText size={21} aria-hidden="true" /> Type</li>
              </ul>
            </div>

            <div className="signal-artefact-stage">
              {artefacts.map((artefact) => (
                <article
                  className={`signal-artefact ${artefact.className}`}
                  data-intake-source={artefact.id}
                  key={artefact.id}
                  aria-label={artefact.description}
                  data-signal-reveal
                >
                  {artefact.content}
                </article>
              ))}
            </div>
          </div>
        </section>

        <LifestyleMerge />
      </div>

      <section className="signal-trust signal-page-width" aria-labelledby="trust-heading">
        <div className="signal-trust-intro">
          <p className="signal-section-label">The trust step</p>
          <h2 id="trust-heading">AI can suggest it. Only you can add it.</h2>
          <p>
            Every proposed fact pauses here. Check the wording, source, dose, and
            date. Correct it or leave it out.
          </p>
        </div>

        <div className="signal-candidate">
          <div className="signal-candidate-status">
            <span>Suggested fact</span>
            <strong>Waiting for your approval</strong>
          </div>
          <div className="signal-candidate-body">
            <p className="signal-utility">Medicine · from pharmacy label</p>
            <h3>Metformin 500 mg tablets</h3>
            <dl>
              <div><dt>Instruction</dt><dd>Take one tablet twice a day with food</dd></div>
              <div><dt>Original wording</dt><dd>“ONE tablet TWICE daily with FOOD”</dd></div>
              <div><dt>Source</dt><dd>Label photograph · page 1</dd></div>
            </dl>
          </div>
          <div className="signal-candidate-actions">
            <Link className="signal-cta signal-cta-dark" href="/auth">
              Confirm in your record <Check size={21} aria-hidden="true" />
            </Link>
            <Link className="signal-text-link" href="/auth">Edit first</Link>
          </div>
        </div>
      </section>

      <section id="today-preview" className="signal-living-record" aria-labelledby="living-heading">
        <div className="signal-page-width">
          <div className="signal-living-heading">
            <div>
              <p className="signal-section-label">Your record in daily use</p>
              <h2 id="living-heading">What matters now. Nothing else competing.</h2>
            </div>
            <p>
              A calm Today view keeps the next medicine, later plans, supply, and
              evidence readable without decoding the graph.
            </p>
          </div>

          <div className="signal-today">
            <header className="signal-today-header">
              <div>
                <p className="signal-utility">Sunday 26 July</p>
                <h3>Today</h3>
              </div>
              <span className="signal-today-status"><CheckCircle2 size={19} /> 1 of 3 complete</span>
            </header>

            <div className="signal-next-dose">
              <time dateTime="08:00">08:00</time>
              <div className="signal-dose-main">
                <p className="signal-utility">Next medicine</p>
                <h4>Metformin <span>500 mg</span></h4>
                <p>Take one tablet with breakfast.</p>
                <Link href="/auth?next=/today">
                  <Check size={22} aria-hidden="true" /> Mark as taken
                </Link>
              </div>
              <div className="signal-dose-source">
                <ShieldCheck size={23} aria-hidden="true" />
                <div><strong>Confirmed</strong><span>Pharmacy label</span></div>
              </div>
            </div>

            <div className="signal-day-details">
              <div>
                <p className="signal-utility">Later today</p>
                <strong>18:00 · Amlodipine 5 mg</strong>
                <span>Take one tablet.</span>
              </div>
              <div>
                <p className="signal-utility">Supply</p>
                <strong>About 8 days remaining</strong>
                <span>Based on your confirmed schedule.</span>
              </div>
              <div>
                <p className="signal-utility">Appointment</p>
                <strong>18 August · 10:30</strong>
                <span>Diabetes clinic.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-boundaries" aria-labelledby="boundaries-heading">
        <div className="signal-page-width">
          <div className="signal-boundaries-heading" data-signal-reveal>
            <ShieldCheck size={34} aria-hidden="true" />
            <div data-signal-reveal>
              <p className="signal-section-label">Clear boundaries build trust</p>
              <h2 id="boundaries-heading">Careful by design.</h2>
            </div>
          </div>
          <div className="signal-boundary-rows">
            <div data-signal-reveal>
              <span>Sources</span>
              <strong>Original wording and corrections stay visible.</strong>
            </div>
            <div data-signal-reveal>
              <span>Reminders</span>
              <strong>Every estimate shows the assumptions behind it.</strong>
            </div>
            <div>
              <span>Timing</span>
              <strong>Sequence is never presented as proof of cause.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-close" aria-labelledby="close-heading">
        <div className="signal-contours signal-contours-close" aria-hidden="true" />
        <div className="signal-close-inner">
          <p className="signal-section-label" data-signal-reveal>Your information. Your decisions.</p>
          <h2 id="close-heading" data-signal-reveal>Put your health in one place. Keep the final say.</h2>
          <Link className="signal-cta signal-cta-light" href="/auth" data-signal-reveal>
            Create your record <ArrowRight size={21} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="signal-footer">
        <div className="signal-page-width">
          <div>
            <strong>SignalRx</strong>
            <span>Private health organisation for UK adults.</span>
          </div>
          <nav aria-label="Footer">
            <Link href="/about/safety">Safety</Link>
            <Link href="/settings">Data handling</Link>
            <Link href="/auth">Sign in</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
