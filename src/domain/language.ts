export type ProhibitedPhraseCode =
  | "binary_safety_claim"
  | "autonomous_treatment_change"
  | "causal_diagnosis"
  | "unqualified_confirmation"
  | "ai_recommendation";

export interface ProhibitedPhraseViolation {
  code: ProhibitedPhraseCode;
  match: string;
  index: number;
  description: string;
}

interface ProhibitedPattern {
  code: ProhibitedPhraseCode;
  expression: RegExp;
  description: string;
}

const PROHIBITED_PATTERNS: readonly ProhibitedPattern[] = [
  {
    code: "binary_safety_claim",
    expression:
      /\b(?:this|the|your|these|those)\s+(?:combination|regimen|medicine|medication|medicines|medications|treatment)\b[^.!?\n]{0,48}\b(?:is|are)\s+(?:completely\s+|definitively\s+)?(?:safe|unsafe)\b/giu,
    description: "Do not present a regimen as safe or unsafe",
  },
  {
    code: "binary_safety_claim",
    expression: /\bsafe\s+to\s+(?:take|use|combine|continue)\b/giu,
    description: "Do not provide an unbounded safe-to-use conclusion",
  },
  {
    code: "binary_safety_claim",
    expression: /\b(?:zero|no)\s+(?:interaction\s+)?risk\b/giu,
    description: "Absence of a documented concern does not establish no risk",
  },
  {
    code: "autonomous_treatment_change",
    expression:
      /\b(?:you\s+should|(?:the\s+)?patient\s+should|they\s+should|we\s+recommend(?:\s+that\s+(?:you|the\s+patient|they))?|signalrx\s+recommends(?:\s+that\s+(?:you|the\s+patient|they))?)\s+(?:immediately\s+)?(?:stop|reduce|increase|change|skip|substitute|replace)\b/giu,
    description:
      "Treatment-change instructions require an accountable professional",
  },
  {
    code: "autonomous_treatment_change",
    expression:
      /(?:^|[.!?]\s+)(?:please\s+|kindly\s+)?(?:stop|reduce|increase|change|skip|substitute|replace)\s+(?!the\s+(?:record|review|appointment|follow-up|note|status|date)\b)[^.!?\n]{1,80}/gimu,
    description:
      "Direct treatment-change imperatives require an accountable professional",
  },
  {
    code: "autonomous_treatment_change",
    expression:
      /\b(?:please\s+)?consider\s+(?:stopping|reducing|increasing|changing|skipping|substituting|replacing)\b[^.!?\n]{0,80}/giu,
    description:
      "Softened treatment-change instructions are still clinical recommendations",
  },
  {
    code: "autonomous_treatment_change",
    expression:
      /\b(?:dose|dosage|medicine|medication|treatment|drug)\s+should\s+be\s+(?:stopped|reduced|increased|changed|skipped|substituted|replaced)\b/giu,
    description:
      "Passive treatment-change instructions require an accountable professional",
  },
  {
    code: "ai_recommendation",
    expression: /\bai\s+recommends?\b/giu,
    description: "Do not attribute a clinical recommendation to AI",
  },
  {
    code: "causal_diagnosis",
    expression:
      /\b(?:this|the)\s+(?:drug|medicine|medication|product|supplement)\s+(?:definitely\s+)?caused\b/giu,
    description: "Chronology cannot establish medication causality",
  },
  {
    code: "causal_diagnosis",
    expression: /\bconfirmed\s+adverse(?:\s+drug)?\s+reaction\b/giu,
    description: "Do not diagnose an adverse reaction from this workflow",
  },
  {
    code: "causal_diagnosis",
    expression: /\b(?:symptom|bruising|dizziness)\s+resulted\s+from\b/giu,
    description: "Do not convert temporal association into causality",
  },
  {
    code: "unqualified_confirmation",
    expression: /\bconfirmed\s+interaction\b/giu,
    description:
      "Use established evidence or documented concern, not an unqualified confirmed-interaction claim",
  },
] as const;

export function findProhibitedPhrases(
  text: string,
): ProhibitedPhraseViolation[] {
  const violations: ProhibitedPhraseViolation[] = [];

  for (const pattern of PROHIBITED_PATTERNS) {
    const expression = new RegExp(
      pattern.expression.source,
      pattern.expression.flags,
    );
    for (const match of text.matchAll(expression)) {
      violations.push({
        code: pattern.code,
        match: match[0],
        index: match.index ?? 0,
        description: pattern.description,
      });
    }
  }

  return violations.sort(
    (left, right) =>
      left.index - right.index || left.code.localeCompare(right.code),
  );
}

export class ProhibitedClinicalLanguageError extends Error {
  readonly violations: ProhibitedPhraseViolation[];

  constructor(violations: ProhibitedPhraseViolation[]) {
    super(
      `Clinical language failed safety validation: ${violations
        .map((violation) => violation.match)
        .join(", ")}`,
    );
    this.name = "ProhibitedClinicalLanguageError";
    this.violations = violations;
  }
}

export function assertPermittedClinicalLanguage(text: string): void {
  const violations = findProhibitedPhrases(text);
  if (violations.length > 0) {
    throw new ProhibitedClinicalLanguageError(violations);
  }
}

export const REQUIRED_SAFETY_STATEMENT =
  "Do not start, stop, or change prescribed treatment based only on SignalRx. Contact a pharmacist, prescriber, or appropriate care service.";

export const INSUFFICIENT_EVIDENCE_STATEMENT =
  "SignalRx does not have enough verified information to classify this combination as safe or unsafe.";

export const NO_DOCUMENTED_CONCERN_STATEMENT =
  "No documented concern found in the sources searched.";
