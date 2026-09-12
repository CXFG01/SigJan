import { Brand } from "@/components/brand";
import { PrescriptionChecker } from "@/components/prescription-checker";
export default function Home() {
  return <div className="checker-shell"><header className="checker-header"><Brand /><a href="/about/safety">How we handle evidence</a></header>
    <main id="main-content"><section className="checker-intro"><p className="eyebrow">A clearer picture of your medicines</p>
      <h1>Start with your prescription.<br /><em>Understand what needs a closer look.</em></h1>
      <p>Check your medicine list against documented interactions. When the evidence is incomplete, we investigate further and show our sources.</p>
      <div className="checker-steps"><span>01 &nbsp; Paste</span><span>02 &nbsp; Confirm</span><span>03 &nbsp; Understand</span></div>
    </section><PrescriptionChecker /></main>
    <footer className="checker-footer">SignalRx · UK hackathon prototype · Synthetic prescriptions only. No account or personal history.</footer></div>;
}
