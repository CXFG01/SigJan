"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  FlaskConical,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import styles from "./interaction-investigator-panel.module.css";

type Finding = {
  id: string;
  finding_type: "documented_concern" | "research_lead" | "could_not_assess";
  trigger_type: string;
  factor_names: string[];
  canonical_names: string[];
  source_severity: string | null;
};
type Source = { ref: string; url: string; title: string; organization: string; jurisdiction: string };
type Statement = { text: string; sourceRefs: string[] };
type InteractionBrief = {
  findingType: "documented_concern" | "research_lead";
  factors: Array<{ name: string; canonicalName: string }>;
  triggerType: string;
  sourceSeverity: string | null;
  evidenceState: string;
  evidenceStrength: string;
  whatThisIsAbout: Statement;
  potentialConsequence: Statement;
  mechanism: Statement;
  riskModifiers: Statement[];
  missingInformation: string[];
  warningSigns: Statement[];
  nextStep: string;
  nextStepExplanation: Statement;
  pharmacistQuestion: string;
  limitations: string[];
  sources: Source[];
};
type ProgressEvent = {
  runId: string;
  sequence: number;
  type: string;
  at: string;
  payload: Record<string, unknown>;
};

const eventLabels: Record<string, string> = {
  run_started: "Research started",
  graph_prepared: "Your private health information is ready",
  factor_pair_selected: "Items selected for checking",
  search_started: "Searching trusted clinical sources",
  source_discovered: "Authoritative sources found",
  source_reviewed: "Sources checked",
  evidence_conflict_found: "Differences between sources noted",
  validation_started: "Checking the evidence and citations",
  finding_validated: "Evidence checks passed",
  run_completed: "Research complete",
  run_failed: "Research could not be completed",
};

export function compactProgressEvents(events: ProgressEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (event.type === "reasoning_summary_delta") return false;
    const key =
      event.type === "source_discovered" || event.type === "source_reviewed"
        ? "authoritative_sources"
        : event.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? `Request failed (${response.status})`;
}

async function consumeEventStream(response: Response, onEvent: (event: ProgressEvent) => void) {
  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error("The investigation stream was unavailable.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
      if (data) onEvent(JSON.parse(data) as ProgressEvent);
    }
    if (done) break;
  }
}

export function InteractionInvestigatorPanel({ itemCount }: { itemCount: number }) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<InteractionBrief[]>([]);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [sources, setSources] = useState<Array<{ url: string; title: string; domain: string }>>([]);
  const [reasoningSummary, setReasoningSummary] = useState("");
  const [safetyStatement, setSafetyStatement] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "investigating" | "complete" | "error">(
    itemCount < 2 ? "ready" : "checking",
  );
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState<{
    path: string;
    body: Record<string, unknown>;
  } | null>(null);

  const checkKnownInteractions = useCallback(async () => {
    setStatus("checking");
    setError("");
    const response = await fetch("/api/interactions/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) {
      setStatus("error");
      setError(await readError(response));
      return;
    }
    const payload = (await response.json()) as { findings: Finding[]; safetyStatement: string };
    setFindings(payload.findings);
    setSafetyStatement(payload.safetyStatement);
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (itemCount < 2) return;
    const timer = window.setTimeout(() => {
      void checkKnownInteractions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkKnownInteractions, itemCount]);

  const handleProgress = useCallback((event: ProgressEvent) => {
    setEvents((current) => [...current, event]);
    if (event.type === "source_discovered" && typeof event.payload.url === "string") {
      setSources((current) =>
        current.some((source) => source.url === event.payload.url)
          ? current
          : [...current, {
              url: event.payload.url as string,
              title: String(event.payload.title ?? event.payload.domain ?? "Source"),
              domain: String(event.payload.domain ?? ""),
            }],
      );
    }
    if (event.type === "reasoning_summary_delta" && typeof event.payload.text === "string") {
      setReasoningSummary((current) => `${current}${event.payload.text}`);
    }
    if (event.type === "finding_validated" && Array.isArray(event.payload.reports)) {
      setReports(event.payload.reports as InteractionBrief[]);
    }
    if (event.type === "run_completed") setStatus("complete");
    if (event.type === "run_failed") {
      setStatus("error");
      setError(String(event.payload.message ?? "The investigation could not be published."));
    }
  }, []);

  const runInvestigation = useCallback(async (path: string, body: Record<string, unknown>) => {
    setLastRequest({ path, body });
    setStatus("investigating");
    setError("");
    setEvents([]);
    setSources([]);
    setReports([]);
    setReasoningSummary("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await consumeEventStream(response, handleProgress);
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "The investigation could not be completed.");
    }
  }, [handleProgress]);

  const documented = findings.filter(
    (finding) =>
      finding.finding_type === "documented_concern" &&
      !(
        finding.trigger_type === "ddinter" &&
        finding.source_severity?.toLowerCase() === "unknown"
      ),
  );
  const unresolved = findings.filter((finding) => finding.finding_type === "could_not_assess");
  const progressEvents = useMemo(() => compactProgressEvents(events), [events]);
  const latestStage = progressEvents.at(-1);
  const canInvestigate = itemCount >= 2 && status !== "checking" && status !== "investigating";
  const sourceCount = useMemo(() => new Set(sources.map((source) => source.url)).size, [sources]);

  return (
    <section className={styles.shell} aria-labelledby="interaction-checker-heading">
      <header className={styles.header}>
        <div>
          <p className="eyebrow">Evidence-aware interaction checker</p>
          <h2 id="interaction-checker-heading">What in your network is worth checking?</h2>
          <p>Known sources flag possible concerns. An AI investigator can research what they mean using authoritative clinical sources.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => void checkKnownInteractions()} disabled={!canInvestigate}>
          <RefreshCw size={17} aria-hidden="true" /> Check again
        </button>
      </header>

      <div className={styles.safetyLine} role="status">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>{itemCount < 2 ? "Add at least two active items before checking for documented interactions." : status === "checking" ? "Checking confirmed, currently active items…" : safetyStatement || "The checker reports source coverage, never a guarantee of safety."}</span>
      </div>

      {documented.length ? (
        <div className={styles.findingGroup}>
          <h3>Documented concerns</h3>
          {documented.map((finding) => (
            <article className={styles.finding} key={finding.id}>
              <div className={styles.findingTitle}>
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>{finding.factor_names.join(" + ")}</strong>
                  <span>
                    {finding.trigger_type.replaceAll("_", " ")}
                    {finding.source_severity ? ` · ${finding.source_severity} severity` : ""}
                  </span>
                </div>
              </div>
              <button className="button button-secondary" type="button" disabled={!canInvestigate} onClick={() => void runInvestigation("/api/interactions/investigate", { findingId: finding.id, jurisdiction: "GB" })}>
                <Search size={17} aria-hidden="true" /> Investigate this
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {unresolved.length ? (
        <div className={styles.unresolved}>
          <details>
            <summary>
              {unresolved.length} {unresolved.length === 1 ? "product name needs" : "product names need"} ingredient confirmation
            </summary>
            <p>
              SignalRx recognised these labels, but could not safely map them to a
              specific active ingredient. They were excluded from interaction checking.
            </p>
            <ul>
              {unresolved.map((finding) => (
                <li key={finding.id}>{finding.factor_names.join(" + ")}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}

      <div className={styles.lifestyleAction}>
        <div>
          <FlaskConical size={22} aria-hidden="true" />
          <div><h3>Check my Lifestyle</h3><p>Investigate the full confirmed graph for documented concerns and separately labelled research leads.</p></div>
        </div>
        <label className={styles.consent}>
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>I understand that a privacy-minimized copy of my confirmed health graph will be processed for this investigation.</span>
        </label>
        <button className="button button-primary" type="button" disabled={!consent || !canInvestigate} onClick={() => void runInvestigation("/api/interactions/check-lifestyle", { consentConfirmed: true, jurisdiction: "GB" })}>
          {status === "investigating" ? <LoaderCircle className={styles.spin} size={18} aria-hidden="true" /> : <BookOpenCheck size={18} aria-hidden="true" />}
          {status === "investigating" ? "Investigating…" : "Check my Lifestyle"}
        </button>
      </div>

      {events.length ? (
        <div className={styles.trace} aria-live="polite">
          <div className={styles.traceHeader}>
            <div><p className="eyebrow">Research progress</p><h3>{latestStage ? eventLabels[latestStage.type] ?? "Research in progress" : "Starting research"}</h3></div>
            {sourceCount ? <span>{sourceCount} {sourceCount === 1 ? "source" : "sources"} found</span> : null}
          </div>
          <ol>{progressEvents.map((event) => <li key={`${event.runId}-${event.sequence}`}><CheckCircle2 size={16} aria-hidden="true" /><span>{eventLabels[event.type] ?? "Research in progress"}</span></li>)}</ol>
          {reasoningSummary ? <details className={styles.reasoning}><summary>Research notes</summary><p>{reasoningSummary}</p><small>These notes describe the search process. They are not a clinical conclusion.</small></details> : null}
          {sources.length ? <details className={styles.liveSources}><summary><span>Sources consulted</span><span>{sourceCount}</span></summary><ul>{sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span>{source.domain}</span></li>)}</ul></details> : null}
        </div>
      ) : null}

      {reports.map((report, index) => <ValidatedReport report={report} key={`${report.triggerType}-${index}`} />)}
      {error ? (
        <div className={styles.error} role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{error}</span>
          {lastRequest ? (
            <button
              className="button button-secondary"
              type="button"
              disabled={status === "investigating"}
              onClick={() => void runInvestigation(lastRequest.path, lastRequest.body)}
            >
              <RefreshCw size={17} aria-hidden="true" /> Resume research
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ValidatedReport({ report }: { report: InteractionBrief }) {
  const sourceByRef = new Map(report.sources.map((source) => [source.ref, source]));
  return (
    <article className={styles.report} data-kind={report.findingType}>
      <div className={styles.reportHeading}>
        <div><p className="eyebrow">{report.findingType === "research_lead" ? "Worth checking" : "Documented concern"}</p><h3>{report.factors.map((factor) => factor.name).join(" + ")}</h3></div>
        <div className={styles.badges}><span>Severity {report.sourceSeverity ?? "not assigned"}</span><span>Evidence {report.evidenceStrength}</span></div>
      </div>
      <p className={styles.aiLabel}>AI-generated research summary · publication gates passed</p>
      <ReportStatement title="What is this about?" statement={report.whatThisIsAbout} sources={sourceByRef} />
      <ReportStatement title="What could happen?" statement={report.potentialConsequence} sources={sourceByRef} />
      <ReportStatement title="Why might it happen?" statement={report.mechanism} sources={sourceByRef} />
      {report.riskModifiers.length ? <div className={styles.reportSection}><h4>What changes the relevance?</h4><ul>{report.riskModifiers.map((statement, index) => <li key={index}>{statement.text} <CitationLinks refs={statement.sourceRefs} sources={sourceByRef} /></li>)}</ul></div> : null}
      <div className={styles.question}><strong>Question to ask a pharmacist</strong><p>“{report.pharmacistQuestion}”</p></div>
      <ReportStatement title="Suggested next step" statement={report.nextStepExplanation} sources={sourceByRef} />
      <details className={styles.evidence}><summary>Sources and limitations</summary><ul>{report.sources.map((source) => <li key={source.ref}><a href={source.url} target="_blank" rel="noreferrer">{source.organization}: {source.title}</a><span>{source.jurisdiction}</span></li>)}</ul><ul>{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></details>
    </article>
  );
}

function ReportStatement({ title, statement, sources }: { title: string; statement: Statement; sources: Map<string, Source> }) {
  return <div className={styles.reportSection}><h4>{title}</h4><p>{statement.text} <CitationLinks refs={statement.sourceRefs} sources={sources} /></p></div>;
}

function CitationLinks({ refs, sources }: { refs: string[]; sources: Map<string, Source> }) {
  return <span className={styles.citations}>{refs.map((ref) => { const source = sources.get(ref); return source ? <a key={ref} href={source.url} target="_blank" rel="noreferrer" aria-label={`Source: ${source.title}`}>[{ref}]</a> : null; })}</span>;
}
