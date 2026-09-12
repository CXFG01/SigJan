import type { InteractionBrief, InvestigationOutput } from "./schemas";

export const SOURCE_POLICY_VERSION = "authoritative-gb-v1";
export const PROMPT_VERSION = "interaction-investigator-v1";

export const AUTHORITATIVE_DOMAINS = [
  "nhs.uk",
  "nice.org.uk",
  "gov.uk",
  "medicines.org.uk",
  "dailymed.nlm.nih.gov",
  "fda.gov",
  "ema.europa.eu",
  "who.int",
  "pubmed.ncbi.nlm.nih.gov",
  "pmc.ncbi.nlm.nih.gov",
] as const;

const PROHIBITED_TREATMENT_INSTRUCTIONS = [
  /\b(stop|start|skip)\s+(taking|using)\b/i,
  /\b(change|increase|decrease|double|halve)\s+(your\s+)?dose\b/i,
  /\breplace\s+your\s+(medicine|medication)\b/i,
];

export function normalizeDomain(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

export function domainForUrl(value: string) {
  try {
    return normalizeDomain(new URL(value).hostname);
  } catch {
    return "";
  }
}

export function isAllowedSourceUrl(value: string) {
  try { if (new URL(value).protocol !== "https:") return false; } catch { return false; }
  const domain = domainForUrl(value);
  return AUTHORITATIVE_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

export type SourceType =
  | "primary_label"
  | "regulator"
  | "guideline"
  | "peer_reviewed"
  | "other_authoritative";

export function classifySource(value: string): SourceType {
  const domain = domainForUrl(value);
  if (
    domain.endsWith("dailymed.nlm.nih.gov") ||
    domain.endsWith("medicines.org.uk")
  ) {
    return "primary_label";
  }
  if (
    domain.endsWith("fda.gov") ||
    domain.endsWith("ema.europa.eu") ||
    domain.endsWith("gov.uk")
  ) {
    return "regulator";
  }
  if (domain.endsWith("nice.org.uk") || domain.endsWith("nhs.uk")) {
    return "guideline";
  }
  if (
    domain.endsWith("pubmed.ncbi.nlm.nih.gov") ||
    domain.endsWith("pmc.ncbi.nlm.nih.gov")
  ) {
    return "peer_reviewed";
  }
  return "other_authoritative";
}

function allPatientText(report: InteractionBrief) {
  return [
    report.whatThisIsAbout.text,
    report.potentialConsequence.text,
    report.mechanism.text,
    ...report.riskModifiers.map((entry) => entry.text),
    ...report.warningSigns.map((entry) => entry.text),
    report.nextStepExplanation.text,
    report.pharmacistQuestion,
    ...report.missingInformation,
    ...report.limitations,
  ].join("\n");
}

export function validateInvestigation(
  output: InvestigationOutput,
  consultedUrls: ReadonlySet<string>,
) {
  const failures: string[] = [];
  if (PROHIBITED_TREATMENT_INSTRUCTIONS.some(pattern => pattern.test(output.overallLimitations.join("\n")))) {
    failures.push("Overall limitations contain a treatment-change instruction");
  }

  for (const [reportIndex, report] of output.reports.entries()) {
    const prefix = `reports[${reportIndex}]`;
    const sourceByRef = new Map(report.sources.map((source) => [source.ref, source]));
    const statements = [
      report.whatThisIsAbout,
      report.potentialConsequence,
      report.mechanism,
      ...report.riskModifiers,
      ...report.warningSigns,
      report.nextStepExplanation,
    ];

    for (const source of report.sources) {
      if (!isAllowedSourceUrl(source.url)) {
        failures.push(`${prefix}: source domain is not allowed: ${source.url}`);
      }
      if (!consultedUrls.has(source.url)) {
        failures.push(`${prefix}: source was not present in the web-search trace: ${source.url}`);
      }
    }

    for (const statement of statements) {
      for (const sourceRef of statement.sourceRefs) {
        if (!sourceByRef.has(sourceRef)) {
          failures.push(`${prefix}: claim references unknown source ${sourceRef}`);
        }
      }
    }

    const distinctDomains = new Set(report.sources.map((source) => domainForUrl(source.url)));
    const strongSources = report.sources.filter((source) =>
      ["primary_label", "regulator", "guideline", "peer_reviewed"].includes(
        classifySource(source.url),
      ),
    );
    if (report.findingType === "research_lead") {
      if (distinctDomains.size < 2 || strongSources.length < 1) {
        failures.push(`${prefix}: a research lead needs two domains and a primary source`);
      }
    } else if (strongSources.length < 1) {
      failures.push(`${prefix}: a documented concern needs a primary source`);
    }

    if (
      PROHIBITED_TREATMENT_INSTRUCTIONS.some((pattern) =>
        pattern.test(allPatientText(report)),
      )
    ) {
      failures.push(`${prefix}: patient-facing text contains a treatment-change instruction`);
    }

    if (
      report.triggerType === "agent_research_lead" &&
      report.findingType !== "research_lead"
    ) {
      failures.push(`${prefix}: agent discoveries must remain research leads`);
    }
    if (
      report.findingType === "research_lead" &&
      report.triggerType !== "agent_research_lead"
    ) {
      failures.push(`${prefix}: deterministic triggers cannot be published as research leads`);
    }
  }

  return failures;
}

export function sanitizeTraceText(value: string, maxLength = 600) {
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[redacted email]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "[redacted id]")
    .slice(0, maxLength);
}
