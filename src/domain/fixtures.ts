import { createAuditEvent } from "./audit";
import { calculateCompleteness } from "./medications";
import {
  INSUFFICIENT_EVIDENCE_STATEMENT,
  REQUIRED_SAFETY_STATEMENT,
} from "./language";
import {
  applyReviewActionToConcern,
  applyReviewActionToPatientPlan,
  createReviewAction,
  createReviewActionAuditEvent,
  publishPatientPlan,
} from "./review";
import { applyClinicalRules } from "./safety";
import {
  ClinicalRuleSchema,
  EpisodeStateSchema,
  EvidenceRecordSchema,
  FieldProvenanceSchema,
  MedicationEntrySchema,
  MedicationSourceSchema,
  ObservationSchema,
  PatientPlanSchema,
  PatientProfileSchema,
  ReviewActionSchema,
  SymptomSchema,
  TimelineEventSchema,
  type Actor,
  type AuditEvent,
  type ClinicalRule,
  type EvidenceRecord,
  type MedicationEntry,
  type MedicationField,
  type MedicationSource,
  type ReviewAction,
} from "./schemas";

export const DEMO_EPISODE_ID = "episode-evelyn-post-discharge-2026-07";
export const DEMO_PATIENT_ID = "patient-evelyn-carter";
export const DEMO_AS_OF = "2026-07-25T11:30:00Z";

export const DEMO_PATIENT_ACTOR: Actor = {
  id: "actor-patient-evelyn",
  name: "Evelyn Carter",
  role: "patient",
};

export const DEMO_CAREGIVER_ACTOR: Actor = {
  id: "actor-caregiver-daniel",
  name: "Daniel Carter",
  role: "caregiver",
};

export const DEMO_PHARMACIST_ACTOR: Actor = {
  id: "actor-pharmacist-amina",
  name: "Amina Shah, pharmacist",
  role: "pharmacist",
};

export const DEMO_SYSTEM_ACTOR: Actor = {
  id: "actor-system-rules",
  name: "SignalRx deterministic rule engine",
  role: "system",
};

export const DEMO_SOURCES: MedicationSource[] = [
  {
    id: "source-discharge-letter",
    episodeId: DEMO_EPISODE_ID,
    type: "discharge_document",
    label: "Hospital discharge medication list",
    originalExcerpt:
      "Apixaban 5 mg twice daily. Diltiazem — strength unclear (120 mg or 180 mg) once daily. Lisinopril 10 mg once daily. Spironolactone 25 mg once daily.",
    capturedAt: "2026-07-22T15:10:00Z",
    suppliedBy: "St Anne's Hospital discharge team",
    synthetic: true,
  },
  {
    id: "source-patient-voice-note",
    episodeId: DEMO_EPISODE_ID,
    type: "voice_transcript",
    label: "Evelyn's editable voice transcript",
    originalExcerpt:
      "I sometimes take two ibuprofen tablets for my knee. I also take a ginkgo supplement every morning. I noticed new bruising and have felt dizzy since coming home.",
    capturedAt: "2026-07-24T09:30:00Z",
    suppliedBy: "Evelyn Carter",
    synthetic: true,
  },
  {
    id: "source-ginkgo-box-photo",
    episodeId: DEMO_EPISODE_ID,
    type: "medicine_box_image",
    label: "Ginkgo supplement box photograph",
    originalExcerpt:
      "Ginkgo Complex — front label visible; the exact ingredient panel and dose are not legible.",
    capturedAt: "2026-07-24T09:35:00Z",
    suppliedBy: "Evelyn Carter",
    synthetic: true,
  },
  {
    id: "source-cardizem-home-photo",
    episodeId: DEMO_EPISODE_ID,
    type: "medicine_box_image",
    label: "Cardizem SR box found in home supply",
    originalExcerpt:
      "Cardizem SR 90 mg modified-release tablets. An older opened box remains at home; current use is uncertain.",
    capturedAt: "2026-07-24T09:38:00Z",
    suppliedBy: "Daniel Carter",
    synthetic: true,
  },
  {
    id: "source-professional-demo-record",
    episodeId: DEMO_EPISODE_ID,
    type: "manual_entry",
    label: "SignalRx professional demo record",
    originalExcerpt:
      "Synthetic review record prepared for the SignalRx hackathon demonstration.",
    capturedAt: "2026-07-25T11:00:00Z",
    suppliedBy: "SignalRx demo team",
    synthetic: true,
  },
].map((source) => MedicationSourceSchema.parse(source));

type SeedMedicationInput = Omit<
  MedicationEntry,
  "provenance" | "createdAt" | "updatedAt"
>;

const trackedMedicationFields: readonly MedicationField[] = [
  "enteredName",
  "normalizedName",
  "ingredient",
  "strength",
  "unit",
  "dose",
  "frequency",
  "route",
  "formulation",
  "category",
  "startDate",
  "stopDate",
  "currentStatus",
  "sourceId",
  "sourceExcerpt",
  "reportedBy",
  "administeredBy",
  "confirmationStatus",
  "confidence",
  "administrationStatus",
  "notes",
];

function provenanceSlug(field: MedicationField): string {
  return field
    .replace(/([a-z])([A-Z])/gu, "$1-$2")
    .toLocaleLowerCase("en-GB");
}

function makeSeedMedication(input: SeedMedicationInput): MedicationEntry {
  const editor =
    input.reportedByRole === "document"
      ? DEMO_SYSTEM_ACTOR
      : input.reportedByRole === "caregiver"
        ? DEMO_CAREGIVER_ACTOR
        : DEMO_PATIENT_ACTOR;
  const provenance = trackedMedicationFields.map((field) => {
    const value = input[field] as string | number | boolean | null;
    const originalValue =
      field === "normalizedName" || field === "ingredient"
        ? input.enteredName
        : value;
    return FieldProvenanceSchema.parse({
      id: `provenance-${input.id.replace(/^med-/u, "")}-${provenanceSlug(field)}-1`,
      field,
      originalValue,
      normalizedValue: value,
      sourceId: input.sourceId,
      confidence: input.confidence,
      confirmationStatus: input.confirmationStatus,
      editorId: editor.id,
      editorRole: editor.role,
      recordedAt: "2026-07-24T10:00:00Z",
      supersedesProvenanceId: null,
    });
  });

  return MedicationEntrySchema.parse({
    ...input,
    provenance,
    createdAt: "2026-07-24T10:00:00Z",
    updatedAt: "2026-07-24T10:00:00Z",
  });
}

export const DEMO_MEDICATION_ENTRIES: MedicationEntry[] = [
  makeSeedMedication({
    id: "med-apixaban",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Eliquis 5 mg tablets",
    originalName: "Eliquis 5 mg tablets",
    normalizedName: "Apixaban",
    conceptId: "concept-apixaban-tablet",
    ingredient: "apixaban",
    ingredientIds: ["ingredient-apixaban"],
    normalizationStatus: "matched",
    strength: 5,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Twice daily",
    route: "oral",
    formulation: "tablet",
    category: "prescription",
    startDate: "2026-07-22",
    startDatePrecision: "exact",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "active",
    sourceId: "source-discharge-letter",
    sourceLabel: "Hospital discharge medication list",
    sourceExcerpt: "Apixaban 5 mg twice daily.",
    additionalSourceIds: [],
    reportedBy: "St Anne's Hospital discharge team",
    reportedByRole: "document",
    administeredBy: "Evelyn Carter",
    confirmationStatus: "confirmed",
    confidence: 1,
    administrationStatus: "taken",
    notes: "Brand name on the box was reconciled to the generic ingredient.",
  }),
  makeSeedMedication({
    id: "med-diltiazem",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Diltiazem — 120 mg or 180 mg?",
    originalName: "Diltiazem — 120 mg or 180 mg?",
    normalizedName: "Diltiazem",
    conceptId: "concept-diltiazem-tablet",
    ingredient: "diltiazem",
    ingredientIds: ["ingredient-diltiazem"],
    normalizationStatus: "matched",
    strength: null,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Once daily",
    route: "oral",
    formulation: "tablet",
    category: "prescription",
    startDate: "2026-07-22",
    startDatePrecision: "exact",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "active",
    sourceId: "source-discharge-letter",
    sourceLabel: "Hospital discharge medication list",
    sourceExcerpt:
      "Diltiazem — strength unclear (120 mg or 180 mg) once daily.",
    additionalSourceIds: ["source-cardizem-home-photo"],
    reportedBy: "St Anne's Hospital discharge team",
    reportedByRole: "document",
    administeredBy: "Evelyn Carter",
    confirmationStatus: "needs_confirmation",
    confidence: 0.61,
    administrationStatus: "unknown",
    notes: "Strength requires confirmation against the dispensed pack.",
  }),
  makeSeedMedication({
    id: "med-lisinopril",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Lisinopril 10 mg",
    originalName: "Lisinopril 10 mg",
    normalizedName: "Lisinopril",
    conceptId: "concept-lisinopril-tablet",
    ingredient: "lisinopril",
    ingredientIds: ["ingredient-lisinopril"],
    normalizationStatus: "matched",
    strength: 10,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Once daily",
    route: "oral",
    formulation: "tablet",
    category: "prescription",
    startDate: "2026-07-22",
    startDatePrecision: "exact",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "active",
    sourceId: "source-discharge-letter",
    sourceLabel: "Hospital discharge medication list",
    sourceExcerpt: "Lisinopril 10 mg once daily.",
    additionalSourceIds: [],
    reportedBy: "St Anne's Hospital discharge team",
    reportedByRole: "document",
    administeredBy: "Evelyn Carter",
    confirmationStatus: "confirmed",
    confidence: 1,
    administrationStatus: "taken",
    notes: "",
  }),
  makeSeedMedication({
    id: "med-spironolactone",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Spironolactone 25 mg",
    originalName: "Spironolactone 25 mg",
    normalizedName: "Spironolactone",
    conceptId: "concept-spironolactone-tablet",
    ingredient: "spironolactone",
    ingredientIds: ["ingredient-spironolactone"],
    normalizationStatus: "matched",
    strength: 25,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Once daily",
    route: "oral",
    formulation: "tablet",
    category: "prescription",
    startDate: "2026-07-22",
    startDatePrecision: "exact",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "active",
    sourceId: "source-discharge-letter",
    sourceLabel: "Hospital discharge medication list",
    sourceExcerpt: "Spironolactone 25 mg once daily.",
    additionalSourceIds: [],
    reportedBy: "St Anne's Hospital discharge team",
    reportedByRole: "document",
    administeredBy: "Evelyn Carter",
    confirmationStatus: "confirmed",
    confidence: 1,
    administrationStatus: "taken",
    notes: "",
  }),
  makeSeedMedication({
    id: "med-ibuprofen",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Ibuprofen 200 mg",
    originalName: "Ibuprofen tablets",
    normalizedName: "Ibuprofen",
    conceptId: "concept-ibuprofen-tablet",
    ingredient: "ibuprofen",
    ingredientIds: ["ingredient-ibuprofen"],
    normalizationStatus: "matched",
    strength: 200,
    unit: "mg",
    dose: "2 tablets when knee pain is troublesome",
    frequency: "Intermittent; exact frequency uncertain",
    route: "oral",
    formulation: "tablet",
    category: "otc",
    startDate: null,
    startDatePrecision: "unknown",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "intermittent",
    sourceId: "source-patient-voice-note",
    sourceLabel: "Evelyn's editable voice transcript",
    sourceExcerpt: "I sometimes take two ibuprofen tablets for my knee.",
    additionalSourceIds: [],
    reportedBy: "Evelyn Carter",
    reportedByRole: "patient",
    administeredBy: "Evelyn Carter",
    confirmationStatus: "confirmed",
    confidence: 0.94,
    administrationStatus: "unknown",
    notes: "Not present on the hospital discharge list.",
  }),
  makeSeedMedication({
    id: "med-ginkgo",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Ginkgo Complex",
    originalName: "Ginkgo Complex",
    normalizedName: "Ginkgo biloba (reported)",
    conceptId: null,
    ingredient: "ginkgo biloba (reported, composition unverified)",
    ingredientIds: ["ingredient-ginkgo-biloba"],
    normalizationStatus: "ambiguous",
    strength: null,
    unit: null,
    dose: null,
    frequency: "Daily",
    route: "oral",
    formulation: "unknown",
    category: "supplement",
    startDate: null,
    startDatePrecision: "unknown",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "active",
    sourceId: "source-ginkgo-box-photo",
    sourceLabel: "Ginkgo supplement box photograph",
    sourceExcerpt:
      "Ginkgo Complex — exact ingredient panel and dose are not legible.",
    additionalSourceIds: ["source-patient-voice-note"],
    reportedBy: "Evelyn Carter",
    reportedByRole: "patient",
    administeredBy: "Evelyn Carter",
    confirmationStatus: "missing_information",
    confidence: 0.42,
    administrationStatus: "taken",
    notes: "Exact product, composition, and dose remain unverified.",
  }),
  makeSeedMedication({
    id: "med-cardizem-home-supply",
    episodeId: DEMO_EPISODE_ID,
    patientId: DEMO_PATIENT_ID,
    enteredName: "Cardizem SR 90 mg",
    originalName: "Cardizem SR 90 mg",
    normalizedName: "Diltiazem modified-release",
    conceptId: "concept-diltiazem-modified-release-tablet",
    ingredient: "diltiazem",
    ingredientIds: ["ingredient-diltiazem"],
    normalizationStatus: "matched",
    strength: 90,
    unit: "mg",
    dose: "Unknown",
    frequency: null,
    route: "oral",
    formulation: "modified_release_tablet",
    category: "prescription",
    startDate: null,
    startDatePrecision: "unknown",
    stopDate: null,
    stopDatePrecision: "unknown",
    currentStatus: "possibly_stopped",
    sourceId: "source-cardizem-home-photo",
    sourceLabel: "Cardizem SR box found in home supply",
    sourceExcerpt:
      "Cardizem SR 90 mg modified-release tablets; current use is uncertain.",
    additionalSourceIds: [],
    reportedBy: "Daniel Carter",
    reportedByRole: "caregiver",
    administeredBy: "Unknown",
    confirmationStatus: "possibly_stopped",
    confidence: 0.68,
    administrationStatus: "unknown",
    notes:
      "Brand/generic relationship and different formulation require professional confirmation.",
  }),
];

export const DEMO_PATIENT = PatientProfileSchema.parse({
  id: DEMO_PATIENT_ID,
  name: "Evelyn Carter",
  age: 72,
  recentEvent: "Recently discharged from hospital",
  conditions: [
    {
      id: "condition-atrial-fibrillation",
      name: "Atrial fibrillation",
      status: "active",
      sourceId: "source-discharge-letter",
    },
    {
      id: "condition-ckd-stage-three",
      name: "Stage 3 chronic kidney disease",
      status: "active",
      sourceId: "source-discharge-letter",
    },
    {
      id: "condition-hypertension",
      name: "Hypertension",
      status: "active",
      sourceId: "source-discharge-letter",
    },
  ],
  synthetic: true,
});

export const DEMO_OBSERVATIONS = [
  ObservationSchema.parse({
    id: "observation-egfr-current",
    episodeId: DEMO_EPISODE_ID,
    code: "egfr",
    label: "Current estimated glomerular filtration rate",
    value: null,
    unit: "mL/min/1.73m2",
    status: "missing",
    observedAt: null,
    sourceId: "source-discharge-letter",
  }),
];

export const DEMO_SYMPTOMS = [
  SymptomSchema.parse({
    id: "symptom-new-bruising",
    episodeId: DEMO_EPISODE_ID,
    name: "New bruising",
    patientWords: "I noticed some new bruises after I came home.",
    onsetDate: "2026-07-24",
    datePrecision: "approximate",
    status: "new",
    sourceId: "source-patient-voice-note",
    causalAssessment: "not_assessed",
  }),
  SymptomSchema.parse({
    id: "symptom-dizziness",
    episodeId: DEMO_EPISODE_ID,
    name: "Dizziness",
    patientWords: "I have felt dizzy since coming home.",
    onsetDate: "2026-07-24",
    datePrecision: "approximate",
    status: "ongoing",
    sourceId: "source-patient-voice-note",
    causalAssessment: "not_assessed",
  }),
];

export const DEMO_EVIDENCE_RECORDS: EvidenceRecord[] = [
  {
    id: "evidence-apixaban-ibuprofen-demo",
    title: "Anticoagulant and NSAID co-exposure — seeded demo evidence",
    organization: "SignalRx synthetic evidence set",
    evidenceType: "synthetic_demo_summary",
    tier: "clinical_evidence",
    state: "established",
    publicationDate: null,
    updatedDate: "2026-07-24",
    retrievedDate: "2026-07-25",
    exactSupportingExcerpt:
      "Synthetic paraphrase: Governed product information commonly identifies concurrent anticoagulant and NSAID exposure as a bleeding-risk concern requiring professional review.",
    applicabilityNotes: [
      "Applies to the confirmed apixaban entry and patient-reported intermittent ibuprofen entry while exposure may overlap.",
    ],
    limitations: [
      "This is synthetic demonstration content, not a licensed clinical monograph or official quotation.",
      "It does not establish that either product caused Evelyn's bruising.",
    ],
    sourceUrl: null,
    jurisdiction: "UK demo",
    version: "demo-evidence-1.0",
    quotationStatus: "synthetic_paraphrase",
    synthetic: true,
  },
  {
    id: "evidence-ckd-regimen-monitoring-demo",
    title: "Kidney context and regimen monitoring — seeded demo evidence",
    organization: "SignalRx synthetic evidence set",
    evidenceType: "synthetic_demo_summary",
    tier: "clinical_evidence",
    state: "context_dependent",
    publicationDate: null,
    updatedDate: "2026-07-24",
    retrievedDate: "2026-07-25",
    exactSupportingExcerpt:
      "Synthetic paraphrase: Kidney function is material context when reviewing this seeded post-discharge regimen; a current value is required for a patient-specific assessment.",
    applicabilityNotes: [
      "Evelyn's stage 3 chronic kidney disease is confirmed, while the current eGFR value is missing.",
    ],
    limitations: [
      "The demo rule identifies missing context and does not recommend a dose or treatment change.",
    ],
    sourceUrl: null,
    jurisdiction: "UK demo",
    version: "demo-evidence-1.0",
    quotationStatus: "synthetic_paraphrase",
    synthetic: true,
  },
  {
    id: "evidence-ginkgo-uncertainty-demo",
    title: "Variable herbal-product composition — seeded demo evidence",
    organization: "SignalRx synthetic evidence set",
    evidenceType: "synthetic_demo_summary",
    tier: "clinical_evidence",
    state: "insufficient_evidence",
    publicationDate: null,
    updatedDate: "2026-07-24",
    retrievedDate: "2026-07-25",
    exactSupportingExcerpt:
      "Synthetic paraphrase: Herbal-product assessment depends on the exact product, ingredients, formulation, and dose; those details are not verified in this case.",
    applicabilityNotes: [
      "The photograph does not show a legible ingredient panel or dose.",
    ],
    limitations: [
      "No conclusion about the exact product can be drawn from the seeded source coverage.",
      "Natural origin is not treated as evidence of harmlessness.",
    ],
    sourceUrl: null,
    jurisdiction: "UK demo",
    version: "demo-evidence-1.0",
    quotationStatus: "synthetic_paraphrase",
    synthetic: true,
  },
].map((record) => EvidenceRecordSchema.parse(record));

export const DEMO_CLINICAL_RULES: ClinicalRule[] = [
  {
    id: "rule-apixaban-ibuprofen-overlap",
    version: "1.0.0",
    outputConcernId: "concern-evelyn-apixaban-ibuprofen",
    type: "interaction",
    category: "established_evidence",
    categoryLabel: "Established evidence, current review needed",
    title: "Apixaban and reported ibuprofen use need review",
    status: "needs_professional_review",
    match: {
      kind: "ingredient_pair",
      ingredientIds: ["ingredient-apixaban", "ingredient-ibuprofen"],
      requireExposureOverlap: true,
    },
    potentialConsequence:
      "Overlapping exposure may increase the chance of bleeding or bruising.",
    whyItMayMatter:
      "The discharge list contains apixaban and Evelyn reports intermittent ibuprofen use at home.",
    mechanismSummary:
      "Both products can affect haemostasis through different pathways. This does not prove that either medicine caused the reported bruising.",
    potentialSeverity: "major",
    evidenceStrength: "high",
    patientContextMatch: "high",
    dataCompleteness: "partial",
    missingInformation: [
      "How often ibuprofen is taken",
      "Exact dates of recent ibuprofen doses",
      "Whether bruising is worsening",
    ],
    evidenceIds: ["evidence-apixaban-ibuprofen-demo"],
    suggestedQuestion:
      "Could you review my intermittent ibuprofen use alongside apixaban and advise what information or follow-up is needed?",
    priority: 100,
    contentVersion: "demo-content-1.0",
    explanationVersion: "patient-explanation-1.0",
    enabled: true,
  },
  {
    id: "rule-ckd-regimen-missing-egfr",
    version: "1.0.0",
    outputConcernId: "concern-evelyn-ckd-monitoring",
    type: "monitoring",
    category: "context_dependent",
    categoryLabel: "Context-dependent monitoring",
    title: "Current kidney-function context is missing",
    status: "context_incomplete",
    match: {
      kind: "regimen_context",
      ingredientIds: ["ingredient-lisinopril", "ingredient-spironolactone"],
      conditionIds: ["condition-ckd-stage-three"],
      observationCodes: ["egfr"],
    },
    potentialConsequence:
      "Changes in kidney function can alter how this regimen is reviewed and monitored.",
    whyItMayMatter:
      "Stage 3 chronic kidney disease is recorded, but a current eGFR result is not available in the demo sources.",
    mechanismSummary:
      "This is a context-completeness rule. It does not infer kidney function or select a treatment change.",
    potentialSeverity: "major",
    evidenceStrength: "moderate",
    patientContextMatch: "high",
    dataCompleteness: "insufficient",
    missingInformation: ["Current eGFR result and result date"],
    evidenceIds: ["evidence-ckd-regimen-monitoring-demo"],
    suggestedQuestion:
      "Do you have a current kidney-function result, and does this post-discharge regimen need any planned monitoring?",
    priority: 80,
    contentVersion: "demo-content-1.0",
    explanationVersion: "patient-explanation-1.0",
    enabled: true,
  },
  {
    id: "rule-ginkgo-product-uncertainty",
    version: "1.0.0",
    outputConcernId: "concern-evelyn-ginkgo-uncertainty",
    type: "product_uncertainty",
    category: "insufficient_evidence",
    categoryLabel: "Insufficient evidence",
    title: "Exact ginkgo product details are unavailable",
    status: "insufficient_evidence",
    match: {
      kind: "product_uncertainty",
      ingredientId: "ingredient-ginkgo-biloba",
      categories: ["supplement", "herbal"],
      fieldsThatMustBeKnown: [
        "identity",
        "strength",
        "dose",
        "formulation",
        "startDate",
      ],
    },
    potentialConsequence:
      "The available sources cannot determine how the exact supplement relates to the current regimen.",
    whyItMayMatter: INSUFFICIENT_EVIDENCE_STATEMENT,
    mechanismSummary:
      "Exact constituents and dose are not verified, so SignalRx does not assign a product-specific mechanism.",
    potentialSeverity: "unknown",
    evidenceStrength: "insufficient",
    patientContextMatch: "unknown",
    dataCompleteness: "insufficient",
    missingInformation: [
      "Exact product name and manufacturer",
      "Complete ingredient list",
      "Dose and formulation",
      "Approximate start date",
    ],
    evidenceIds: ["evidence-ginkgo-uncertainty-demo"],
    suggestedQuestion:
      "Can I bring the exact ginkgo packaging so you can check the ingredients and dose with my current medicines?",
    priority: 60,
    contentVersion: "demo-content-1.0",
    explanationVersion: "patient-explanation-1.0",
    enabled: true,
  },
].map((rule) => ClinicalRuleSchema.parse(rule));

export const DEMO_CONCERNS = applyClinicalRules({
  episodeId: DEMO_EPISODE_ID,
  entries: DEMO_MEDICATION_ENTRIES,
  conditions: DEMO_PATIENT.conditions,
  observations: DEMO_OBSERVATIONS,
  rules: DEMO_CLINICAL_RULES,
  evidenceRecords: DEMO_EVIDENCE_RECORDS,
  asOf: DEMO_AS_OF,
});

if (DEMO_CONCERNS.length !== 3) {
  throw new Error(
    `The Evelyn demo must deterministically produce exactly three concerns; received ${DEMO_CONCERNS.length}`,
  );
}

export const DEMO_TIMELINE_EVENTS = [
  {
    id: "timeline-hospital-discharge",
    episodeId: DEMO_EPISODE_ID,
    type: "hospital_discharge",
    occurredAt: "2026-07-22T15:00:00Z",
    datePrecision: "exact",
    title: "Hospital discharge",
    description:
      "A new discharge medication list was supplied for confirmation at home.",
    temporalLanguage: "not_applicable",
    relatedMedicationEntryIds: [
      "med-apixaban",
      "med-diltiazem",
      "med-lisinopril",
      "med-spironolactone",
    ],
    relatedSymptomId: null,
    sourceId: "source-discharge-letter",
    synthetic: true,
  },
  {
    id: "timeline-apixaban-start",
    episodeId: DEMO_EPISODE_ID,
    type: "medication_start",
    occurredAt: "2026-07-22T18:00:00Z",
    datePrecision: "exact",
    title: "Apixaban listed after discharge",
    description: "Apixaban was listed as current on the discharge record.",
    temporalLanguage: "not_applicable",
    relatedMedicationEntryIds: ["med-apixaban"],
    relatedSymptomId: null,
    sourceId: "source-discharge-letter",
    synthetic: true,
  },
  {
    id: "timeline-ibuprofen-use",
    episodeId: DEMO_EPISODE_ID,
    type: "otc_use",
    occurredAt: null,
    datePrecision: "unknown",
    title: "Intermittent ibuprofen reported",
    description:
      "Reported during overlapping exposure; exact recent dose dates are uncertain.",
    temporalLanguage: "reported_during_overlapping_exposure",
    relatedMedicationEntryIds: ["med-ibuprofen", "med-apixaban"],
    relatedSymptomId: null,
    sourceId: "source-patient-voice-note",
    synthetic: true,
  },
  {
    id: "timeline-ginkgo-use",
    episodeId: DEMO_EPISODE_ID,
    type: "supplement_use",
    occurredAt: null,
    datePrecision: "unknown",
    title: "Daily ginkgo supplement reported",
    description:
      "Timing requires review because the exposure start date is not known.",
    temporalLanguage: "timing_requires_review",
    relatedMedicationEntryIds: ["med-ginkgo"],
    relatedSymptomId: null,
    sourceId: "source-patient-voice-note",
    synthetic: true,
  },
  {
    id: "timeline-bruising-onset",
    episodeId: DEMO_EPISODE_ID,
    type: "symptom_onset",
    occurredAt: "2026-07-24T08:00:00Z",
    datePrecision: "approximate",
    title: "New bruising reported",
    description:
      "Occurred after discharge and during reported medication exposure. This does not prove that a medicine caused the symptom.",
    temporalLanguage: "occurred_after",
    relatedMedicationEntryIds: ["med-apixaban", "med-ibuprofen"],
    relatedSymptomId: "symptom-new-bruising",
    sourceId: "source-patient-voice-note",
    synthetic: true,
  },
  {
    id: "timeline-dizziness-onset",
    episodeId: DEMO_EPISODE_ID,
    type: "symptom_onset",
    occurredAt: "2026-07-24T08:00:00Z",
    datePrecision: "approximate",
    title: "Dizziness reported",
    description:
      "Occurred after discharge. Timing requires professional review and does not establish causality.",
    temporalLanguage: "occurred_after",
    relatedMedicationEntryIds: [],
    relatedSymptomId: "symptom-dizziness",
    sourceId: "source-patient-voice-note",
    synthetic: true,
  },
  {
    id: "timeline-professional-review",
    episodeId: DEMO_EPISODE_ID,
    type: "professional_review",
    occurredAt: "2026-07-25T11:00:00Z",
    datePrecision: "exact",
    title: "Pharmacist demo review opened",
    description:
      "The synthetic concern queue was opened for professional disposition.",
    temporalLanguage: "not_applicable",
    relatedMedicationEntryIds: [],
    relatedSymptomId: null,
    sourceId: "source-professional-demo-record",
    synthetic: true,
  },
  {
    id: "timeline-follow-up-task",
    episodeId: DEMO_EPISODE_ID,
    type: "follow_up_task",
    occurredAt: "2026-07-29T09:00:00Z",
    datePrecision: "exact",
    title: "Synthetic follow-up task",
    description:
      "Review outstanding product details and current laboratory context.",
    temporalLanguage: "not_applicable",
    relatedMedicationEntryIds: ["med-ginkgo", "med-diltiazem"],
    relatedSymptomId: null,
    sourceId: "source-professional-demo-record",
    synthetic: true,
  },
].map((event) => TimelineEventSchema.parse(event));

export const DEMO_COMPLETENESS = calculateCompleteness(
  DEMO_MEDICATION_ENTRIES,
  {
    observations: DEMO_OBSERVATIONS,
    requiredObservationCodes: ["egfr"],
  },
);

export const DEMO_PATIENT_PLAN = PatientPlanSchema.parse({
  id: "plan-evelyn-post-discharge",
  episodeId: DEMO_EPISODE_ID,
  status: "draft",
  version: 1,
  verifiedMedicationEntryIds: DEMO_MEDICATION_ENTRIES.filter((entry) =>
    ["confirmed", "corrected"].includes(entry.confirmationStatus),
  ).map((entry) => entry.id),
  awaitingConfirmationEntryIds: DEMO_MEDICATION_ENTRIES.filter(
    (entry) => !["confirmed", "corrected"].includes(entry.confirmationStatus),
  ).map((entry) => entry.id),
  reviewItems: [],
  contactOwner: "Harbour Pharmacy medication review team",
  followUpDate: "2026-07-29",
  questionsToAsk: DEMO_CONCERNS.map((concern) => concern.suggestedQuestion),
  safetyStatement: REQUIRED_SAFETY_STATEMENT,
  approvedBy: null,
  approvedAt: null,
  lastUpdatedAt: DEMO_AS_OF,
});

const initialSourceAuditEvents = DEMO_SOURCES.map((source) =>
  createAuditEvent({
    episodeId: DEMO_EPISODE_ID,
    action: "source_imported",
    entityType: "source",
    entityId: source.id,
    actor: DEMO_SYSTEM_ACTOR,
    occurredAt: source.capturedAt,
    details: { sourceType: source.type, synthetic: "true" },
  }),
);

const initialConcernAuditEvents = DEMO_CONCERNS.map((concern) =>
  createAuditEvent({
    id: concern.auditEventIds[0],
    episodeId: DEMO_EPISODE_ID,
    action: "concern_created",
    entityType: "concern",
    entityId: concern.id,
    actor: DEMO_SYSTEM_ACTOR,
    occurredAt: DEMO_AS_OF,
    details: {
      evidenceIds: concern.evidenceIds.join(","),
      ruleId: concern.ruleId,
      ruleVersion: concern.ruleVersion,
    },
  }),
);

export const DEMO_INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  ...initialSourceAuditEvents,
  ...initialConcernAuditEvents,
];

export const DEMO_EPISODE = EpisodeStateSchema.parse({
  id: DEMO_EPISODE_ID,
  workflowState: "awaiting_confirmation",
  asOf: DEMO_AS_OF,
  patient: DEMO_PATIENT,
  medicationSources: DEMO_SOURCES,
  medicationEntries: DEMO_MEDICATION_ENTRIES,
  observations: DEMO_OBSERVATIONS,
  symptoms: DEMO_SYMPTOMS,
  evidenceRecords: DEMO_EVIDENCE_RECORDS,
  clinicalRules: DEMO_CLINICAL_RULES,
  concerns: DEMO_CONCERNS,
  timelineEvents: DEMO_TIMELINE_EVENTS,
  reviewActions: [],
  auditEvents: DEMO_INITIAL_AUDIT_EVENTS,
  patientPlan: DEMO_PATIENT_PLAN,
  synthetic: true,
  demoLabel: "Synthetic demonstration data",
});

export const DEMO_REVIEW_ACTIONS: ReviewAction[] = [
  createReviewAction(
    ReviewActionSchema.parse({
      id: "review-action-apixaban-ibuprofen",
      episodeId: DEMO_EPISODE_ID,
      concernId: "concern-evelyn-apixaban-ibuprofen",
      disposition: "accepted_action_required",
      reason:
        "The reported OTC exposure and new bruising warrant a documented follow-up.",
      owner: "Amina Shah, pharmacist",
      dueDate: "2026-07-26",
      followUpAction:
        "Contact the prescriber to review the reported ibuprofen exposure and document the agreed plan.",
      patientFacingMessage:
        "A pharmacist will review the reported ibuprofen use with your care team and contact you.",
      reviewerId: DEMO_PHARMACIST_ACTOR.id,
      reviewerName: DEMO_PHARMACIST_ACTOR.name,
      reviewedAt: "2026-07-25T12:00:00Z",
    }),
  ),
  createReviewAction(
    ReviewActionSchema.parse({
      id: "review-action-ckd-monitoring",
      episodeId: DEMO_EPISODE_ID,
      concernId: "concern-evelyn-ckd-monitoring",
      disposition: "monitor",
      reason:
        "Current kidney-function context is needed to complete the review.",
      owner: "Harbour Pharmacy medication review team",
      dueDate: "2026-07-29",
      followUpAction:
        "Request the current eGFR result from the care record or prescriber.",
      patientFacingMessage:
        "Your care team is checking for a current kidney-function result.",
      reviewerId: DEMO_PHARMACIST_ACTOR.id,
      reviewerName: DEMO_PHARMACIST_ACTOR.name,
      reviewedAt: "2026-07-25T12:03:00Z",
    }),
  ),
  createReviewAction(
    ReviewActionSchema.parse({
      id: "review-action-ginkgo-information",
      episodeId: DEMO_EPISODE_ID,
      concernId: "concern-evelyn-ginkgo-uncertainty",
      disposition: "more_information_required",
      reason:
        "The exact product, ingredient panel, formulation, and dose are not verified.",
      owner: "Daniel Carter",
      dueDate: "2026-07-29",
      followUpAction:
        "Bring the full ginkgo package or a clear ingredient-panel photograph to the pharmacist.",
      patientFacingMessage:
        "Please bring the full ginkgo package or a clear photograph of its ingredient panel to the review.",
      reviewerId: DEMO_PHARMACIST_ACTOR.id,
      reviewerName: DEMO_PHARMACIST_ACTOR.name,
      reviewedAt: "2026-07-25T12:05:00Z",
    }),
  ),
];

const reviewedConcerns = DEMO_CONCERNS.map((concern) => {
  const action = DEMO_REVIEW_ACTIONS.find(
    (candidate) => candidate.concernId === concern.id,
  );
  if (!action) {
    throw new Error(`Missing seeded review action for ${concern.id}`);
  }
  return applyReviewActionToConcern(concern, action);
});

const reviewedDraftPlan = DEMO_REVIEW_ACTIONS.reduce((plan, action) => {
  const concern = DEMO_CONCERNS.find(
    (candidate) => candidate.id === action.concernId,
  );
  if (!concern) {
    throw new Error(`Missing concern ${action.concernId}`);
  }
  return applyReviewActionToPatientPlan(plan, concern, action);
}, DEMO_PATIENT_PLAN);

const publishedPlanResult = publishPatientPlan(
  reviewedDraftPlan,
  DEMO_CONCERNS.map((concern) => concern.id),
  DEMO_PHARMACIST_ACTOR,
  "2026-07-25T12:10:00Z",
);

export const DEMO_APPROVED_PATIENT_PLAN = publishedPlanResult.plan;

const reviewAuditEvents = DEMO_REVIEW_ACTIONS.map((action) =>
  createReviewActionAuditEvent(action, DEMO_PHARMACIST_ACTOR),
);

export const DEMO_REVIEWED_EPISODE = EpisodeStateSchema.parse({
  ...DEMO_EPISODE,
  workflowState: "resolved",
  asOf: "2026-07-25T12:10:00Z",
  concerns: reviewedConcerns,
  reviewActions: DEMO_REVIEW_ACTIONS,
  auditEvents: [
    ...DEMO_INITIAL_AUDIT_EVENTS,
    ...reviewAuditEvents,
    publishedPlanResult.auditEvent,
  ],
  patientPlan: DEMO_APPROVED_PATIENT_PLAN,
});
