import { describe, expect, it } from "vitest";
import {
  classifySource,
  isAllowedSourceUrl,
  validateInvestigation,
} from "@/lib/interactions/policy";
import type { InvestigationOutput } from "@/lib/interactions/schemas";

function output(urls: string[], findingType: "documented_concern" | "research_lead" = "documented_concern"): InvestigationOutput {
  const sources = urls.map((url, index) => ({
    ref: `source-${index + 1}`,
    url,
    title: `Source ${index + 1}`,
    organization: "Authority",
    jurisdiction: "GB",
    publicationOrUpdateDate: null,
    documentSection: null,
  }));
  const sourceRefs = sources.map((source) => source.ref);
  const statement = { text: "A source-supported explanation.", sourceRefs };
  return {
    reports: [
      {
        findingType,
        factors: [
          { name: "A", canonicalName: "a" },
          { name: "B", canonicalName: "b" },
        ],
        triggerType: findingType === "research_lead" ? "agent_research_lead" : "ddinter",
        sourceSeverity: findingType === "research_lead" ? null : "major",
        evidenceState: "context_dependent",
        evidenceStrength: "moderate",
        whatThisIsAbout: statement,
        potentialConsequence: statement,
        mechanism: statement,
        riskModifiers: [],
        missingInformation: [],
        warningSigns: [],
        nextStep: "contact_pharmacist",
        nextStepExplanation: statement,
        pharmacistQuestion: "Could you review this combination for me?",
        limitations: ["This summary does not replace professional review."],
        sources,
      },
    ],
    overallLimitations: ["Authoritative web-source coverage is incomplete."],
  };
}

describe("investigation publication policy", () => {
  it("recognizes allowed authoritative domains and source classes", () => {
    expect(isAllowedSourceUrl("https://www.nhs.uk/medicines/example")).toBe(true);
    expect(isAllowedSourceUrl("https://example.com/health")).toBe(false);
    expect(classifySource("https://dailymed.nlm.nih.gov/example")).toBe("primary_label");
    expect(classifySource("https://pubmed.ncbi.nlm.nih.gov/123")).toBe("peer_reviewed");
  });

  it("rejects a URL that was not in the provider search trace", () => {
    const report = output(["https://www.nhs.uk/medicines/example"]);
    expect(validateInvestigation(report, new Set())).toContainEqual(
      expect.stringContaining("web-search trace"),
    );
  });

  it("requires two independent domains for a research lead", () => {
    const report = output(
      [
        "https://www.nhs.uk/medicines/example",
        "https://www.nhs.uk/conditions/example",
      ],
      "research_lead",
    );
    const urls = new Set(report.reports[0].sources.map((source) => source.url));
    expect(validateInvestigation(report, urls)).toContainEqual(
      expect.stringContaining("two domains"),
    );
  });

  it("rejects treatment-change instructions", () => {
    const report = output(["https://www.nhs.uk/medicines/example"]);
    report.reports[0].nextStepExplanation.text = "Stop taking your medicine now.";
    const urls = new Set(report.reports[0].sources.map((source) => source.url));
    expect(validateInvestigation(report, urls)).toContainEqual(
      expect.stringContaining("treatment-change instruction"),
    );
  });

  it("does not allow a deterministic trigger to be relabelled as a research lead", () => {
    const report = output(
      [
        "https://www.nhs.uk/medicines/example",
        "https://pubmed.ncbi.nlm.nih.gov/123",
      ],
      "research_lead",
    );
    report.reports[0].triggerType = "ddinter";
    const urls = new Set(report.reports[0].sources.map((source) => source.url));
    expect(validateInvestigation(report, urls)).toContainEqual(
      expect.stringContaining("deterministic triggers"),
    );
  });
});
