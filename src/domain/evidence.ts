import type {
  Concern,
  EvidenceRecord,
  EvidenceTier,
  EvidenceType,
} from "./schemas";

const evidenceTierByType: Readonly<Record<EvidenceType, EvidenceTier>> = {
  authoritative_label: "authoritative",
  clinical_guideline: "authoritative",
  systematic_review: "clinical_evidence",
  controlled_study: "clinical_evidence",
  observational_study: "signal",
  case_report: "signal",
  expert_consensus: "clinical_evidence",
  synthetic_demo_summary: "clinical_evidence",
  mechanistic_research: "hypothesis",
  computational_hypothesis: "hypothesis",
};

export function mapEvidenceTypeToTier(type: EvidenceType): EvidenceTier {
  return evidenceTierByType[type];
}

export class MissingConcernEvidenceError extends Error {
  readonly concernId: string;
  readonly missingEvidenceIds: string[];

  constructor(concernId: string, missingEvidenceIds: string[]) {
    super(
      `Concern ${concernId} references missing evidence: ${missingEvidenceIds.join(
        ", ",
      )}`,
    );
    this.name = "MissingConcernEvidenceError";
    this.concernId = concernId;
    this.missingEvidenceIds = missingEvidenceIds;
  }
}

export function validateConcernEvidence(
  concern: Concern,
  evidenceRecords: readonly EvidenceRecord[],
): true {
  const availableIds = new Set(evidenceRecords.map((record) => record.id));
  const missingEvidenceIds = concern.evidenceIds.filter(
    (evidenceId) => !availableIds.has(evidenceId),
  );

  if (missingEvidenceIds.length > 0) {
    throw new MissingConcernEvidenceError(concern.id, missingEvidenceIds);
  }

  return true;
}

export function getEvidenceForConcern(
  concern: Concern,
  evidenceRecords: readonly EvidenceRecord[],
): EvidenceRecord[] {
  validateConcernEvidence(concern, evidenceRecords);
  const requiredIds = new Set(concern.evidenceIds);
  return evidenceRecords.filter((record) => requiredIds.has(record.id));
}
