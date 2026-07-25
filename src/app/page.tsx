import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";

export default function HomePage() {
  return (
    <main id="main-content" className="landing">
      <header className="landing-header shell-width">
        <Brand />
        <Link className="button button-primary" href="/auth">
          Start with email <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner shell-width">
          <div className="landing-copy">
            <p className="eyebrow">A private health organiser for UK adults</p>
            <h1>Your health, organised around you.</h1>
            <p className="body-large">
              Medicines, symptoms, tests, appointments, and daily life in one
              calm record that you control.
            </p>
            <div className="landing-actions">
              <Link className="button button-primary" href="/auth">
                Create your record <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="text-link" href="/about/safety">
                Read our safety boundary
              </Link>
            </div>
            <p className="landing-note">
              SignalRx organises information. It does not diagnose, change doses,
              or replace professional care.
            </p>
          </div>

          <div
            className="constellation"
            role="img"
            aria-label="Illustration of a personal Lifestyle Network"
          >
            <span className="constellation-line line-a" />
            <span className="constellation-line line-b" />
            <span className="constellation-line line-c" />
            <span className="network-orbit orbit-a" />
            <span className="network-orbit orbit-b" />
            <div className="constellation-node node-person">
              <HeartPulse size={22} aria-hidden="true" />
              <strong>You</strong>
            </div>
            <div className="constellation-node node-medicine">Medicines</div>
            <div className="constellation-node node-routine">Daily life</div>
            <div className="constellation-node node-symptom">Symptoms</div>
            <div className="constellation-node node-test">Tests</div>
          </div>
        </div>
      </section>

      <section className="landing-section shell-width">
        <div className="section-intro">
          <p className="eyebrow">A record that earns your trust</p>
          <h2>Bring it in. Check it. Use it.</h2>
        </div>
        <ol className="plain-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Tell it your way</h3>
              <p>Type, speak, photograph a label, or add a document.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Confirm every fact</h3>
              <p>AI suggests candidates. Nothing joins your record until you approve it.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>See what matters today</h3>
              <p>Track doses, appointments, supply, and the evidence behind each item.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="boundary-band">
        <div className="shell-width boundary-band-inner">
          <div>
            <ShieldCheck size={30} aria-hidden="true" />
            <h2>Careful by design.</h2>
          </div>
          <div className="boundary-points">
            <p><FileCheck2 size={20} /> Sources and corrections stay visible.</p>
            <p><CalendarDays size={20} /> Reminders show their assumptions.</p>
            <p><HeartPulse size={20} /> Timing is never presented as proof of cause.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
