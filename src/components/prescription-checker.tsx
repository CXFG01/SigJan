"use client";
import { useEffect, useRef, useState } from "react";
import type { Candidate, PublicRun } from "@/lib/checker/types";
const sample = "Warfarin 3 mg, oral, once daily\nIbuprofen 200 mg, oral, as needed\nParacetamol 500 mg, oral, as needed";
const blank = (): Candidate => ({ name: "", original: "Manually entered", dose: "", route: "", frequency: "", ingredients: [], identitySource: "", issue: null });
const labels: Record<string, string> = { queued: "Waiting to investigate", running: "Investigating the evidence…", completed: "Investigation complete", insufficient: "Evidence remains insufficient", failed: "Investigation failed", unavailable: "Research unavailable", timed_out: "Investigation timed out", cancelled: "Investigation cancelled", skipped: "Not investigated in this run", not_needed: "Documented source result" };
export function PrescriptionChecker() {
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState<PublicRun | null>(null);
  const token = useRef<string | null>(null), requestKey = useRef<string | null>(null);
  const [pollError, setPollError] = useState("");
  useEffect(() => {
    if (!run || run.status !== "running" || !token.current) return;
    let disposed = false;
    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/checker/run", { headers: { Authorization: `Bearer ${token.current}` }, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!disposed) { setRun(result.run); setPollError(""); }
      } catch { if (!disposed) setPollError("Reconnecting to investigation progress. Your database findings are still shown below."); }
    }, 2500);
    return () => { disposed = true; clearInterval(timer); };
  }, [run]);
  function edit(index: number, field: "name" | "dose" | "route" | "frequency", value: string) {
    setCandidates(rows => rows.map((row, i) => i === index ? { ...row, [field]: value, ...(field === "name" ? { ingredients: [], identitySource: "", issue: null } : {}) } : row));
    setConfirmed(false); requestKey.current = null;
  }
  async function extract() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/checker/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!result.candidates.length) throw new Error("No medicine list was extracted. Enter two to ten medicines individually below.");
      setCandidates(result.candidates); setConfirmed(false); setText(""); requestKey.current = null;
    } catch (e) { setError(e instanceof Error ? e.message : "Extraction failed."); } finally { setBusy(false); }
  }
  async function check() {
    setBusy(true); setError(""); requestKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/checker/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idempotencyKey: requestKey.current, medicines: candidates.map(({ name, dose, route, frequency }) => ({ name, dose, route, frequency })) }) });
      const result = await response.json();
      if (!response.ok) {
        if (result.unresolved) setCandidates(rows => rows.map((row, i) => result.unresolved.includes(i) ? { ...row, issue: "Enter an exact ingredient name before checking." } : row));
        throw new Error(result.error);
      }
      token.current = result.token; setRun(result.run); setCandidates([]); setText("");
    } catch (e) { setError(e instanceof Error ? e.message : "Checking failed."); } finally { setBusy(false); }
  }
  async function cancel() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/checker/run", { method: "DELETE", headers: { Authorization: `Bearer ${token.current}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRun(result.run);
    } catch { setError("Cancellation was not confirmed. Please try again."); } finally { setBusy(false); }
  }
  return <section className="checker-workspace" aria-label="Prescription checker">
    {!run && <>{!candidates.length ? <div className="checker-input">
      <div className="section-heading"><div><p className="eyebrow">Your starting point</p><h2>What medicines are on the list?</h2></div><span className="small-tag">Text only · Up to 10 medicines</span></div>
      <label htmlFor="prescription">Paste a synthetic prescription</label><textarea id="prescription" value={text} onChange={e => setText(e.target.value)} maxLength={8000} rows={7} placeholder={sample} aria-describedby="prescription-help" />
      <p id="prescription-help" className="field-help">Include medicine names and any dose or timing details. Leave out names, addresses and other personal information.</p>
      <div className="checker-actions"><button className="button button-primary" disabled={busy || !text.trim()} onClick={extract}>{busy ? "Reading your list…" : "Review medicines →"}</button><button className="button button-ghost" disabled={busy} onClick={() => setText(sample)}>Try an example</button><button className="button button-ghost" disabled={busy} onClick={() => setCandidates([blank(), blank()])}>Enter individually</button></div>
    </div> : <div className="checker-input"><p className="eyebrow">Check the details</p><h2>Is this the medicine list you intended?</h2><p className="field-help">Correct names and details before continuing. Ingredient identities are verified again when you check.</p>
      <div className="medicine-list">{candidates.map((m, i) => <fieldset key={i} className="medicine-row"><legend>Medicine {i + 1}</legend><p className="original-wording">Original: {m.original}</p><div className="medicine-fields">{(["name", "dose", "route", "frequency"] as const).map(field => <label key={field}>{field === "name" ? "Medicine / ingredients" : field === "dose" ? "Dose or strength" : field === "route" ? "Route" : "Frequency"}<input value={m[field]} maxLength={field === "name" ? 160 : field === "route" ? 80 : 100} onChange={e => edit(i, field, e.target.value)} /></label>)}</div>
        {!!m.ingredients.length && <p className="identity-note">Recognised ingredients: {m.ingredients.join(" + ")}</p>}{m.issue && <p className="error-note">{m.issue}</p>}<button className="button button-ghost" onClick={() => { setCandidates(rows => rows.filter((_, n) => n !== i)); setConfirmed(false); requestKey.current = null; }}>Remove medicine {i + 1}</button></fieldset>)}</div>
      <button className="button button-secondary" disabled={candidates.length >= 10} onClick={() => { setCandidates(rows => [...rows, blank()]); setConfirmed(false); requestKey.current = null; }}>Add medicine</button>
      <label className="confirmation"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I have reviewed this synthetic medicine list. Investigate uncertain pairs automatically.</label>
      <div className="checker-actions"><button className="button button-primary" disabled={busy || !confirmed || candidates.length < 2 || candidates.some(m => !m.name.trim())} onClick={check}>{busy ? "Checking documented evidence…" : "Check interactions →"}</button><button className="button button-ghost" disabled={busy} onClick={() => { setCandidates([]); setConfirmed(false); }}>Back to text</button></div></div>}
      <aside className="checker-explainer"><p className="eyebrow">What happens next</p><h3>Evidence first.<br />A closer look when needed.</h3><p>We check documented medicine pairs, then investigate gaps or disagreements in the evidence.</p><p>Every result shows its sources. An unknown result stays unknown.</p><p className="field-help">This prototype does not recommend treatment changes or guarantee that a combination is safe.</p></aside></>}
    {error && <p role="alert" className="error-note checker-error">{error}</p>}
    {run && <div className="checker-results"><div className="section-heading"><div><p className="eyebrow">Your evidence review</p><h2>{run.pairs.length} medicine pairs checked</h2></div>{run.status === "running" ? <button className="button button-secondary" disabled={busy} onClick={cancel}>Cancel research</button> : <button className="button button-secondary" onClick={() => { setRun(null); token.current = null; requestKey.current = null; setError(""); setConfirmed(false); }}>Check another list</button>}</div>
      <p className="result-caution">No documented interaction found does not mean a combination is safe. Research findings are evidence summaries, not treatment advice.</p><p role="status" className="field-help">{pollError || (run.status === "running" ? "Database findings are ready. Selected pairs are being investigated." : "This review has finished.")}</p>
      <details className="coverage"><summary>Source coverage & temporary data</summary>{run.coverage.map((c, i) => <p key={i}>{c.source} {c.version} · {c.records.toLocaleString()} records · {c.status}. {c.message}</p>)}<p>Results expire at {new Date(run.expiresAt).toLocaleTimeString()}. This page does not save your list to browser storage. OpenAI retention is separate; see <a href="/about/safety">data handling</a>.</p></details>
      {run.pairs.map(pair => <article className="pair-card" key={pair.id}><div className="section-heading"><h3>{pair.medicines.map(m => m.name).join(" + ")}</h3><span className="small-tag">{labels[pair.research]}</span></div><p className="field-help">Ingredients: {pair.medicines.map(m => m.ingredients.join(" + ")).join(" / ")}</p>
        <div className="database-findings"><h4>Database findings</h4>{pair.findings.length ? pair.findings.map(f => <p key={f.id}><strong>{f.severity}</strong> · {f.ingredients.join(" + ")} · <a href={f.url} target="_blank" rel="noreferrer">{f.source} {f.version}</a></p>) : <p>No documented interaction found in the checked sources.</p>}{!!pair.duplicateIngredients.length && <p>Shared ingredient: {pair.duplicateIngredients.join(", ")}. This is a duplicate-ingredient flag.</p>}</div>
        {pair.reason && <p className="field-help">Reason for a closer look: {pair.reason === "conflicting" ? "sources disagree" : pair.reason === "incomplete" ? "incomplete or context-dependent evidence" : "missing pair evidence"}.</p>}{pair.message && <p className="research-note">{pair.message}</p>}
        {pair.report?.reports.map((report, i) => <div className="research-report" key={i}><p className="eyebrow">Agent research · {report.evidenceState.replaceAll("_", " ")}</p><h4>What the investigation found</h4><p>{report.whatThisIsAbout.text}</p><p>{report.potentialConsequence.text}</p><p className="field-help">Evidence strength: {report.evidenceStrength}</p><details><summary>Explanation, missing information & sources</summary><p>{report.mechanism.text}</p>{report.missingInformation.map(s => <p key={s}>Missing context: {s}</p>)}{report.limitations.map(s => <p key={s}>{s}</p>)}<p>{report.nextStepExplanation.text}</p><p>Question to discuss: {report.pharmacistQuestion}</p><ul>{report.sources.map(s => <li key={s.ref}><a target="_blank" rel="noreferrer" href={s.url}>{s.title}</a> · {s.organization}</li>)}</ul></details></div>)}
      </article>)}</div>}
  </section>;
}
