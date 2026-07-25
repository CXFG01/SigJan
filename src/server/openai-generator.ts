import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  INSUFFICIENT_EVIDENCE_STATEMENT,
  normalizeMedicationName,
} from "@/domain";
import type {
  ExplanationRequest,
  ExternalJsonGenerator,
  ExtractionRequest,
} from "@/providers";

const ExtractionDraftSchema = z.object({
  medications: z.array(
    z.object({
      enteredName: z.string().min(1),
      strength: z.number().positive().nullable(),
      unit: z.string().min(1).nullable(),
      dose: z.string().min(1).nullable(),
      frequency: z.string().min(1).nullable(),
      sourceExcerpt: z.string().min(1),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

const ExplanationDraftSchema = z.object({
  plainLanguageSummary: z.string().min(1),
  uncertaintyStatement: z.string().min(1),
  professionalQuestion: z.string().min(1),
});

function candidateId(value: string, index: number): string {
  const slug =
    value
      .toLocaleLowerCase("en-GB")
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-|-$/gu, "") || "unknown-product";
  return `candidate-${slug}-${index + 1}`;
}

function sourceExcerpt(
  content: string,
  proposedExcerpt: string,
  enteredName: string,
): string {
  const proposedIndex = content
    .toLocaleLowerCase("en-GB")
    .indexOf(proposedExcerpt.toLocaleLowerCase("en-GB"));
  if (proposedIndex >= 0) {
    return content.slice(proposedIndex, proposedIndex + proposedExcerpt.length);
  }

  const sentences = content
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const nameToken = enteredName
    .toLocaleLowerCase("en-GB")
    .split(/\s+/u)[0];
  const matchingSentence = sentences.find((sentence) =>
    sentence.toLocaleLowerCase("en-GB").includes(nameToken),
  );
  return matchingSentence ?? content.slice(0, 320);
}

export class OpenAIJsonGenerator implements ExternalJsonGenerator {
  readonly model: string;
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    this.model = process.env.OPENAI_MODEL ?? "gpt-5.6";
    this.client = new OpenAI({ apiKey });
  }

  async generate(
    task: "extraction" | "explanation",
    validatedInput: ExtractionRequest | ExplanationRequest,
  ): Promise<unknown> {
    return task === "extraction"
      ? this.extract(validatedInput as ExtractionRequest)
      : this.explain(validatedInput as ExplanationRequest);
  }

  private async extract(request: ExtractionRequest): Promise<unknown> {
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "low" },
      instructions: [
        "Extract medication or health-product mentions from the supplied source.",
        "Return only products explicitly present in the source.",
        "Do not infer a missing dose, strength, unit, frequency, or product identity.",
        "Use null for missing values.",
        "sourceExcerpt must be a short exact quotation from the supplied source.",
        "Confidence describes extraction confidence, not clinical safety.",
        "Never diagnose, rank risk, recommend treatment, or assert causality.",
      ].join(" "),
      input: JSON.stringify({
        sourceType: request.sourceType,
        content: request.content,
      }),
      text: {
        format: zodTextFormat(
          ExtractionDraftSchema,
          "signalrx_medication_extraction",
        ),
      },
    });
    const draft = response.output_parsed;
    if (!draft) {
      throw new Error("OpenAI returned no structured extraction");
    }

    return {
      requestId: request.requestId,
      candidates: draft.medications.map((candidate, index) => {
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
          sourceExcerpt: sourceExcerpt(
            request.content,
            candidate.sourceExcerpt,
            candidate.enteredName,
          ),
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
      }),
      metadata: {
        provider: "external_validated",
        model: this.model,
        promptVersion: "openai-extraction-1.0",
        generatedAt: request.requestedAt,
        usedFallback: false,
      },
    };
  }

  private async explain(request: ExplanationRequest): Promise<unknown> {
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "low" },
      instructions: [
        "Rewrite only the supplied, already-approved concern for the requested audience.",
        "Stay inside the supplied evidence excerpts and limitations.",
        "Do not add a diagnosis, severity, probability, causal claim, or treatment instruction.",
        "Use cautious language and direct the reader to an appropriate professional question.",
        "Do not introduce new concerns or evidence.",
      ].join(" "),
      input: JSON.stringify({
        audience: request.audience,
        concern: request.approvedConcern,
        evidence: request.approvedEvidence,
      }),
      text: {
        format: zodTextFormat(
          ExplanationDraftSchema,
          "signalrx_approved_explanation",
        ),
      },
    });
    const draft = response.output_parsed;
    if (!draft) {
      throw new Error("OpenAI returned no structured explanation");
    }

    return {
      id: `explanation-${request.approvedConcern.id.replace(/^concern-/u, "")}`,
      sourceConcernId: request.approvedConcern.id,
      plainLanguageSummary: draft.plainLanguageSummary,
      uncertaintyStatement:
        request.approvedConcern.category === "insufficient_evidence"
          ? INSUFFICIENT_EVIDENCE_STATEMENT
          : draft.uncertaintyStatement,
      professionalQuestion: draft.professionalQuestion,
      evidenceIds: request.approvedConcern.evidenceIds,
      metadata: {
        provider: "external_validated",
        model: this.model,
        promptVersion: request.approvedConcern.explanationVersion,
        generatedAt: request.requestedAt,
        usedFallback: false,
      },
    };
  }
}

