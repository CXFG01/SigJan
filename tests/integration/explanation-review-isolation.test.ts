import { describe, expect, it } from "vitest";

import {
  DEMO_CONCERNS,
  DEMO_EPISODE,
  DEMO_EVIDENCE_RECORDS,
  DEMO_PATIENT_PLAN,
  DEMO_PHARMACIST_ACTOR,
  DEMO_REVIEW_ACTIONS,
  PatientResultSchema,
  applyReviewActionToConcern,
  applyReviewActionToPatientPlan,
  buildPatientResult,
  publishPatientPlan,
} from "@/domain";
import {
  GeneratedExplanationSchema,
  attachGeneratedExplanation,
  buildExplanationRequest,
  createSignalRxProvider,
} from "@/providers";

describe("generated-text boundary and accountable review", () => {
  it("can explain only an approved concern without mutating clinical state", async () => {
    const concernBefore = structuredClone(DEMO_CONCERNS[0]);
    const request = buildExplanationRequest(
      concernBefore,
      DEMO_EVIDENCE_RECORDS,
      "patient",
      "2026-07-25T12:00:00Z",
    );
    const provider = createSignalRxProvider();
    const explanation = await provider.explain(request);
    const presentation = attachGeneratedExplanation(
      concernBefore,
      explanation,
    );

    expect(presentation.concernId).toBe(concernBefore.id);
    expect(presentation.explanation.evidenceIds).toEqual(
      concernBefore.evidenceIds,
    );
    expect(concernBefore).toEqual(DEMO_CONCERNS[0]);
    expect("potentialSeverity" in presentation.explanation).toBe(false);
    expect("concern" in presentation.explanation).toBe(false);
  });

  it("rejects a generated attempt to add a new concern or clinical severity", () => {
    const valid = {
      id: "explanation-boundary-test",
      sourceConcernId: DEMO_CONCERNS[0].id,
      plainLanguageSummary: "This item needs professional review.",
      uncertaintyStatement: "The explanation is limited to approved evidence.",
      professionalQuestion: DEMO_CONCERNS[0].suggestedQuestion,
      evidenceIds: DEMO_CONCERNS[0].evidenceIds,
      metadata: {
        provider: "deterministic_fixture",
        model: "test-model",
        promptVersion: "test-prompt-1",
        generatedAt: "2026-07-25T12:00:00Z",
        usedFallback: false,
      },
    } as const;

    expect(
      GeneratedExplanationSchema.safeParse({
        ...valid,
        potentialSeverity: "major",
        newConcern: { title: "Invented concern" },
      }).success,
    ).toBe(false);
  });

  it("falls back deterministically when external JSON violates the schema", async () => {
    const provider = createSignalRxProvider({
      model: "external-test-model",
      async generate() {
        return {
          concern: {
            title: "Invented clinical concern",
            severity: "major",
          },
        };
      },
    });
    const request = buildExplanationRequest(
      DEMO_CONCERNS[0],
      DEMO_EVIDENCE_RECORDS,
      "patient",
      "2026-07-25T12:00:00Z",
    );
    const explanation = await provider.explain(request);

    expect(explanation.sourceConcernId).toBe(DEMO_CONCERNS[0].id);
    expect(explanation.metadata.usedFallback).toBe(true);
    expect("concern" in explanation).toBe(false);
  });

  it("moves a professional disposition into the patient plan and audit trail", () => {
    const concern = DEMO_CONCERNS[0];
    const action = DEMO_REVIEW_ACTIONS[0];
    const updatedConcern = applyReviewActionToConcern(concern, action);
    const updatedPlan = applyReviewActionToPatientPlan(
      DEMO_PATIENT_PLAN,
      concern,
      action,
    );

    expect(updatedConcern.reviewStatus).toBe("accepted");
    expect(updatedPlan.reviewItems).toEqual([
      expect.objectContaining({
        concernId: concern.id,
        disposition: "accepted_action_required",
        owner: action.owner,
      }),
    ]);
    expect(updatedPlan.version).toBe(DEMO_PATIENT_PLAN.version + 1);
  });

  it("publishes only after every concern has a recorded professional disposition", () => {
    const planWithAllReviews = DEMO_REVIEW_ACTIONS.reduce((plan, action) => {
      const concern = DEMO_CONCERNS.find(
        (candidate) => candidate.id === action.concernId,
      )!;
      return applyReviewActionToPatientPlan(plan, concern, action);
    }, DEMO_PATIENT_PLAN);
    const result = publishPatientPlan(
      planWithAllReviews,
      DEMO_CONCERNS.map((concern) => concern.id),
      DEMO_PHARMACIST_ACTOR,
      "2026-07-25T12:10:00Z",
    );

    expect(result.plan.status).toBe("approved");
    expect(result.plan.approvedBy).toBe(DEMO_PHARMACIST_ACTOR.name);
    expect(result.auditEvent.action).toBe("patient_plan_published");
    expect(result.workflowOutcome).toBe("resolved");
    expect(() =>
      publishPatientPlan(
        DEMO_PATIENT_PLAN,
        DEMO_CONCERNS.map((concern) => concern.id),
        DEMO_PHARMACIST_ACTOR,
        "2026-07-25T12:10:00Z",
      ),
    ).toThrow(/unresolved review items/iu);
  });

  it("keeps a published episode escalated when any disposition is escalated", () => {
    const escalatedActions = DEMO_REVIEW_ACTIONS.map((action, index) =>
      index === 1
        ? {
            ...action,
            disposition: "escalated" as const,
            reason: "Specialist review is required before this item is closed.",
          }
        : action,
    );
    const planWithEscalation = escalatedActions.reduce((plan, action) => {
      const concern = DEMO_CONCERNS.find(
        (candidate) => candidate.id === action.concernId,
      )!;
      return applyReviewActionToPatientPlan(plan, concern, action);
    }, DEMO_PATIENT_PLAN);

    const result = publishPatientPlan(
      planWithEscalation,
      DEMO_CONCERNS.map((concern) => concern.id),
      DEMO_PHARMACIST_ACTOR,
      "2026-07-25T12:10:00Z",
    );

    expect(result.plan.status).toBe("approved");
    expect(
      result.plan.reviewItems.find(
        (item) => item.disposition === "escalated",
      ),
    ).toBeDefined();
    expect(result.workflowOutcome).toBe("escalated");
  });

  it("keeps research fields outside strict patient results", () => {
    const patientResult = buildPatientResult(DEMO_EPISODE);

    expect(PatientResultSchema.parse(patientResult)).toEqual(patientResult);
    expect(
      PatientResultSchema.safeParse({
        ...patientResult,
        researchData: {
          title: "Precomputed target hypothesis",
        },
      }).success,
    ).toBe(false);
    expect("researchData" in patientResult).toBe(false);
  });
});
