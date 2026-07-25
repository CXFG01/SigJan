import {
  INSUFFICIENT_EVIDENCE_STATEMENT,
  normalizeMedicationName,
} from "../domain";
import {
  ExplanationRequestSchema,
  ExtractionRequestSchema,
  ExtractionResponseSchema,
  GeneratedExplanationSchema,
  type ExplanationRequest,
  type ExtractionRequest,
  type ExtractionResponse,
  type GeneratedExplanation,
} from "./schemas";

export interface SignalRxTextProvider {
  extract(request: ExtractionRequest): Promise<ExtractionResponse>;
  explain(request: ExplanationRequest): Promise<GeneratedExplanation>;
}

function candidateId(value: string, index: number): string {
  const slug = value
    .toLocaleLowerCase("en-GB")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
  return `candidate-${slug}-${index + 1}`;
}

interface SeedCandidate {
  enteredName: string;
  strength: number | null;
  unit: string | null;
  dose: string | null;
  frequency: string | null;
  sourceExcerpt: string;
  confidence: number;
}

const seededCandidates: readonly SeedCandidate[] = [
  {
    enteredName: "Eliquis",
    strength: 5,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Twice daily",
    sourceExcerpt: "Apixaban 5 mg twice daily.",
    confidence: 0.98,
  },
  {
    enteredName: "Diltiazem",
    strength: null,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Once daily",
    sourceExcerpt: "Diltiazem — strength unclear (120 mg or 180 mg).",
    confidence: 0.61,
  },
  {
    enteredName: "Lisinopril",
    strength: 10,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Once daily",
    sourceExcerpt: "Lisinopril 10 mg once daily.",
    confidence: 0.99,
  },
  {
    enteredName: "Spironolactone",
    strength: 25,
    unit: "mg",
    dose: "1 tablet",
    frequency: "Once daily",
    sourceExcerpt: "Spironolactone 25 mg once daily.",
    confidence: 0.99,
  },
  {
    enteredName: "Ibuprofen",
    strength: 200,
    unit: "mg",
    dose: "2 tablets",
    frequency: "Intermittent; exact frequency uncertain",
    sourceExcerpt: "I sometimes take two ibuprofen tablets for my knee.",
    confidence: 0.94,
  },
  {
    enteredName: "Ginkgo Complex",
    strength: null,
    unit: null,
    dose: null,
    frequency: "Daily",
    sourceExcerpt:
      "I take a ginkgo supplement every morning; the label details are unclear.",
    confidence: 0.42,
  },
];

function candidatesForContent(
  request: ExtractionRequest,
): ExtractionResponse["candidates"] {
  const normalizedContent = request.content.toLocaleLowerCase("en-GB");
  const matched = seededCandidates.filter((candidate) => {
    const genericNeedle =
      candidate.enteredName === "Eliquis"
        ? "apixaban"
        : candidate.enteredName.split(" ")[0].toLocaleLowerCase("en-GB");
    return (
      normalizedContent.includes(
        candidate.enteredName.toLocaleLowerCase("en-GB"),
      ) || normalizedContent.includes(genericNeedle)
    );
  });

  return matched.map((candidate, index) => {
    const normalization = normalizeMedicationName(candidate.enteredName);
    const missingFields = [
      candidate.strength === null ? "strength" : null,
      candidate.dose === null ? "dose" : null,
      normalization.status !== "matched" ? "product identity" : null,
    ].filter((field): field is string => field !== null);
    return {
      id: candidateId(candidate.enteredName, index),
      enteredName: candidate.enteredName,
      normalization,
      strength: candidate.strength,
      unit: candidate.unit,
      dose: candidate.dose,
      frequency: candidate.frequency,
      route: normalization.route,
      formulation: normalization.formulation,
      category: normalization.category ?? "supplement",
      sourceId: request.sourceId,
      sourceExcerpt: candidate.sourceExcerpt,
      confidence: candidate.confidence,
      confirmationStatus:
        normalization.status !== "matched"
          ? "uncertain_match"
          : missingFields.length > 0
            ? "missing_information"
            : "needs_confirmation",
      clarificationQuestions: [
        "Please confirm that the product name matches the original source.",
        ...missingFields.map(
          (field) => `Please add or confirm the ${field}.`,
        ),
      ],
    };
  });
}

export class DeterministicSignalRxProvider implements SignalRxTextProvider {
  async extract(rawRequest: ExtractionRequest): Promise<ExtractionResponse> {
    const request = ExtractionRequestSchema.parse(rawRequest);
    return ExtractionResponseSchema.parse({
      requestId: request.requestId,
      candidates: candidatesForContent(request),
      metadata: {
        provider: "deterministic_fixture",
        model: "signalrx-seeded-extractor",
        promptVersion: "extraction-fixture-1.0",
        generatedAt: request.requestedAt,
        usedFallback: false,
      },
    });
  }

  async explain(
    rawRequest: ExplanationRequest,
  ): Promise<GeneratedExplanation> {
    const request = ExplanationRequestSchema.parse(rawRequest);
    const concern = request.approvedConcern;
    const uncertaintyStatement =
      concern.category === "insufficient_evidence"
        ? INSUFFICIENT_EVIDENCE_STATEMENT
        : concern.missingInformation.length > 0
          ? `Context is incomplete: ${concern.missingInformation.join("; ")}.`
          : "This explanation is limited to the approved concern and evidence records.";

    return GeneratedExplanationSchema.parse({
      id: `explanation-${concern.id.replace(/^concern-/u, "")}`,
      sourceConcernId: concern.id,
      plainLanguageSummary: `${concern.title}. ${concern.whyItMayMatter}`,
      uncertaintyStatement,
      professionalQuestion: concern.suggestedQuestion,
      evidenceIds: concern.evidenceIds,
      metadata: {
        provider: "deterministic_fixture",
        model: "signalrx-seeded-explainer",
        promptVersion: concern.explanationVersion,
        generatedAt: request.requestedAt,
        usedFallback: false,
      },
    });
  }
}

export interface ExternalJsonGenerator {
  readonly model: string;
  generate(
    task: "extraction" | "explanation",
    validatedInput: ExtractionRequest | ExplanationRequest,
  ): Promise<unknown>;
}

export class ValidatedExternalSignalRxProvider
  implements SignalRxTextProvider
{
  constructor(
    private readonly generator: ExternalJsonGenerator,
    private readonly fallback: SignalRxTextProvider =
      new DeterministicSignalRxProvider(),
  ) {}

  async extract(rawRequest: ExtractionRequest): Promise<ExtractionResponse> {
    const request = ExtractionRequestSchema.parse(rawRequest);
    try {
      const result = ExtractionResponseSchema.parse(
        await this.generator.generate("extraction", request),
      );
      return ExtractionResponseSchema.parse({
        ...result,
        metadata: {
          ...result.metadata,
          provider: "external_validated",
          model: this.generator.model,
          usedFallback: false,
        },
      });
    } catch {
      const result = await this.fallback.extract(request);
      return ExtractionResponseSchema.parse({
        ...result,
        metadata: { ...result.metadata, usedFallback: true },
      });
    }
  }

  async explain(
    rawRequest: ExplanationRequest,
  ): Promise<GeneratedExplanation> {
    const request = ExplanationRequestSchema.parse(rawRequest);
    try {
      const result = GeneratedExplanationSchema.parse(
        await this.generator.generate("explanation", request),
      );
      if (
        result.sourceConcernId !== request.approvedConcern.id ||
        result.evidenceIds.some(
          (evidenceId) =>
            !request.approvedConcern.evidenceIds.includes(evidenceId),
        )
      ) {
        throw new Error("External explanation exceeded its approved concern");
      }
      return GeneratedExplanationSchema.parse({
        ...result,
        metadata: {
          ...result.metadata,
          provider: "external_validated",
          model: this.generator.model,
          usedFallback: false,
        },
      });
    } catch {
      const result = await this.fallback.explain(request);
      return GeneratedExplanationSchema.parse({
        ...result,
        metadata: { ...result.metadata, usedFallback: true },
      });
    }
  }
}

export function createSignalRxProvider(
  externalGenerator?: ExternalJsonGenerator,
): SignalRxTextProvider {
  return externalGenerator
    ? new ValidatedExternalSignalRxProvider(externalGenerator)
    : new DeterministicSignalRxProvider();
}
