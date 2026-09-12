import { describe, expect, it } from "vitest";
import type { AgentSessionItem } from "openai/resources/beta/agents/agents";
import { reportFromItems } from "@/lib/checker/agents";
import { buildPairs } from "@/lib/checker/types";
const pair = buildPairs(["A","B"].map(name => ({ name, dose: "", route: "", frequency: "", ingredients: [name.toLowerCase()], identitySource: "fixture" })), { findings: [], coverage: [] })[0];
const urls = ["https://www.nhs.uk/medicines/example/", "https://dailymed.nlm.nih.gov/example/"];
function fixture() {
  const statement = { text: "Evidence needs context.", sourceRefs: ["s0","s1"] };
  return { reports: [{ findingType: "research_lead", triggerType: "agent_research_lead", factors: [{ name: "A", canonicalName: "a" },{ name: "B", canonicalName: "b" }], sourceSeverity: null, evidenceState: "insufficient", evidenceStrength: "insufficient", whatThisIsAbout: statement, potentialConsequence: statement, mechanism: statement, riskModifiers: [], missingInformation: [], warningSigns: [], nextStep: "information_only", nextStepExplanation: statement, pharmacistQuestion: "What context is needed?", limitations: ["Unresolved."], sources: urls.map((url,i) => ({ ref: `s${i}`, url, title: "Source", organization: "Authority", jurisdiction: "GB", publicationOrUpdateDate: null, documentSection: null })) }], overallLimitations: ["Incomplete evidence."] };
}
function items(report = fixture()): AgentSessionItem[] {
  return [...urls.map(url => ({ type: "web_search_call", status: "completed", action: { type: "open_page", url } })), { type: "message", role: "assistant", phase: "final_answer", content: [{ type: "output_text", text: JSON.stringify(report) }] }] as AgentSessionItem[];
}
describe("Agents API report publication", () => {
  it("accepts a structured report grounded in completed tool actions", () => {
    expect(reportFromItems(items(), pair).reports[0].evidenceState).toBe("insufficient");
  });
  it("does not treat model-written URLs as proof of source consultation", () => {
    expect(() => reportFromItems(items().slice(2), pair)).toThrow("validation");
  });
  it("rejects a report for a different pair", () => {
    const report = fixture(); report.reports[0].factors[0].name = "C";
    expect(() => reportFromItems(items(report), pair)).toThrow("validation");
  });
  it("rejects treatment instructions hidden in missing-information fields", () => {
    const report = fixture(); report.reports[0].missingInformation = ["Stop taking your medicine."] as never[];
    expect(() => reportFromItems(items(report), pair)).toThrow("validation");
  });
  it("does not publish commentary as a final answer", () => {
    const data = items(); const last = data.at(-1)!;
    if (last.type === "message") last.phase = "commentary";
    expect(() => reportFromItems(data, pair)).toThrow("final");
  });
});
