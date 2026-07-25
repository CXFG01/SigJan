import {
  DEMO_MEDICATION_ENTRIES,
  DEMO_SOURCES,
  DEMO_SYMPTOMS,
  DEMO_TIMELINE_EVENTS,
  MedicationEntrySchema,
  type MedicationEntry,
  type MedicationSource,
  type Symptom,
  type TimelineEvent,
} from "@/domain";

import {
  createSignalRxProvider,
  type SignalRxTextProvider,
} from "./provider";
import type { ExtractedMedicationCandidate } from "./schemas";

export type DemoIntakeSourceId =
  | "discharge_document"
  | "medicine_box"
  | "voice_note";

export type DemoIntakeExtraction = {
  ledgerSourceId: DemoIntakeSourceId;
  sources: MedicationSource[];
  entries: MedicationEntry[];
  symptoms: Symptom[];
  timelineEvents: TimelineEvent[];
};

type ExtractionSpec = {
  sourceId: string;
  sourceType:
    | "discharge_document"
    | "medicine_box_image"
    | "voice_transcript";
  content: string;
};

const sourceById = new Map(DEMO_SOURCES.map((source) => [source.id, source]));
const entryById = new Map(
  DEMO_MEDICATION_ENTRIES.map((entry) => [entry.id, entry]),
);

function requireSource(id: string): MedicationSource {
  const source = sourceById.get(id);
  if (!source) {
    throw new Error(`Missing seeded demo source ${id}`);
  }
  return structuredClone(source);
}

function requireEntry(id: string): MedicationEntry {
  const entry = entryById.get(id);
  if (!entry) {
    throw new Error(`Missing seeded demo medication ${id}`);
  }
  return structuredClone(entry);
}

function specsForSource(
  sourceId: DemoIntakeSourceId,
  contentOverride?: string,
): ExtractionSpec[] {
  if (sourceId === "discharge_document") {
    const source = requireSource("source-discharge-letter");
    return [
      {
        sourceId: source.id,
        sourceType: "discharge_document",
        content: contentOverride?.trim() || source.originalExcerpt,
      },
    ];
  }

  if (sourceId === "medicine_box") {
    const ginkgo = requireSource("source-ginkgo-box-photo");
    const cardizem = requireSource("source-cardizem-home-photo");
    return [
      {
        sourceId: ginkgo.id,
        sourceType: "medicine_box_image",
        content: `Ginkgo. ${ginkgo.originalExcerpt}`,
      },
      {
        sourceId: cardizem.id,
        sourceType: "medicine_box_image",
        content: `Diltiazem. ${cardizem.originalExcerpt}`,
      },
    ];
  }

  const source = requireSource("source-patient-voice-note");
  return [
    {
      sourceId: source.id,
      sourceType: "voice_transcript",
      content: contentOverride?.trim() || source.originalExcerpt,
    },
  ];
}

function fixtureEntryId(
  ledgerSourceId: DemoIntakeSourceId,
  actualSourceId: string,
  candidate: ExtractedMedicationCandidate,
): string | null {
  if (actualSourceId === "source-cardizem-home-photo") {
    return "med-cardizem-home-supply";
  }
  if (actualSourceId === "source-ginkgo-box-photo") {
    return "med-ginkgo";
  }

  const identity = (
    candidate.normalization.normalizedName ?? candidate.enteredName
  ).toLocaleLowerCase("en-GB");
  const mapping: Readonly<Record<string, string>> = {
    apixaban: "med-apixaban",
    diltiazem: "med-diltiazem",
    lisinopril: "med-lisinopril",
    spironolactone: "med-spironolactone",
    ibuprofen: "med-ibuprofen",
    "ginkgo complex": "med-ginkgo",
  };

  if (identity.includes("ginkgo")) {
    return "med-ginkgo";
  }
  if (ledgerSourceId === "voice_note" && identity.includes("ibuprofen")) {
    return "med-ibuprofen";
  }
  return mapping[identity] ?? null;
}

function provisionalEntry(
  fixture: MedicationEntry,
  source: MedicationSource,
  candidate: ExtractedMedicationCandidate,
): MedicationEntry {
  const confirmationStatus = [
    "missing_information",
    "possibly_stopped",
  ].includes(fixture.confirmationStatus)
    ? fixture.confirmationStatus
    : "needs_confirmation";

  return MedicationEntrySchema.parse({
    ...fixture,
    sourceId: source.id,
    sourceLabel: source.label,
    sourceExcerpt: candidate.sourceExcerpt,
    additionalSourceIds: [],
    strength: candidate.strength,
    unit: candidate.unit,
    dose: candidate.dose,
    frequency: candidate.frequency,
    confidence: candidate.confidence,
    confirmationStatus,
    provenance: fixture.provenance.map((record) => ({
      ...record,
      sourceId: source.id,
      confidence: candidate.confidence,
      confirmationStatus,
    })),
  });
}

export async function extractDemoIntakeSource(
  ledgerSourceId: DemoIntakeSourceId,
  contentOverride?: string,
  provider: SignalRxTextProvider = createSignalRxProvider(),
): Promise<DemoIntakeExtraction> {
  const specs = specsForSource(ledgerSourceId, contentOverride);
  const requestedAt = new Date().toISOString();
  const responses = await Promise.all(
    specs.map((spec, index) =>
      provider.extract({
        requestId: `request-${ledgerSourceId.replaceAll("_", "-")}-${index + 1}`,
        sourceId: spec.sourceId,
        sourceType: spec.sourceType,
        content: spec.content,
        requestedAt,
      }),
    ),
  );

  const sources = specs.map((spec) => requireSource(spec.sourceId));
  const sourceLookup = new Map(sources.map((source) => [source.id, source]));
  const entries = responses.flatMap((response, responseIndex) => {
    const source = sourceLookup.get(specs[responseIndex].sourceId);
    if (!source) {
      return [];
    }
    return response.candidates.flatMap((candidate) => {
      const id = fixtureEntryId(
        ledgerSourceId,
        source.id,
        candidate,
      );
      return id
        ? [provisionalEntry(requireEntry(id), source, candidate)]
        : [];
    });
  });
  const sourceIds = new Set(sources.map((source) => source.id));
  const entryIds = new Set(entries.map((entry) => entry.id));
  const voiceContent = specs
    .map((spec) => spec.content)
    .join(" ")
    .toLocaleLowerCase("en-GB");
  const symptoms =
    ledgerSourceId === "voice_note"
      ? structuredClone(
          DEMO_SYMPTOMS.filter((symptom) =>
            symptom.id === "symptom-new-bruising"
              ? /\bbruis(?:e|es|ed|ing)\b/u.test(voiceContent)
              : /\bdizz(?:y|iness)\b/u.test(voiceContent),
          ),
        )
      : [];
  const symptomIds = new Set(symptoms.map((symptom) => symptom.id));
  const timelineEvents = DEMO_TIMELINE_EVENTS.filter((event) => {
    if (!sourceIds.has(event.sourceId)) {
      return false;
    }
    if (
      event.relatedMedicationEntryIds.length > 0 &&
      !event.relatedMedicationEntryIds.some((id) => entryIds.has(id))
    ) {
      return false;
    }
    return (
      event.relatedSymptomId === null ||
      symptomIds.has(event.relatedSymptomId)
    );
  });

  return {
    ledgerSourceId,
    sources,
    entries,
    symptoms,
    timelineEvents: structuredClone(timelineEvents),
  };
}
