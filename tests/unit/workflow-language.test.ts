import { describe, expect, it } from "vitest";

import {
  DEMO_PATIENT_ACTOR,
  DEMO_REVIEWED_EPISODE,
  INSUFFICIENT_EVIDENCE_STATEMENT,
  REQUIRED_SAFETY_STATEMENT,
  canTransitionWorkflow,
  findProhibitedPhrases,
  getAllowedWorkflowTransitions,
  reopenEpisodeAfterMedicationMutation,
} from "@/domain";
import { GeneratedExplanationSchema } from "@/providers";

describe("workflow and clinical-language guards", () => {
  it("allows only explicit workflow transitions", () => {
    expect(getAllowedWorkflowTransitions("draft")).toEqual([
      "awaiting_confirmation",
    ]);
    expect(canTransitionWorkflow("ready_for_review", "in_review")).toBe(true);
    expect(canTransitionWorkflow("draft", "resolved")).toBe(false);
    expect(canTransitionWorkflow("archived", "in_review")).toBe(false);
  });

  it("invalidates an approved plan and reopens review after a medication mutation", () => {
    const occurredAt = "2026-07-25T13:00:00Z";
    const reopened = reopenEpisodeAfterMedicationMutation(
      DEMO_REVIEWED_EPISODE,
      DEMO_PATIENT_ACTOR,
      occurredAt,
    );

    expect(reopened.workflowState).toBe("awaiting_confirmation");
    expect(reopened.patientPlan).toMatchObject({
      status: "draft",
      approvedBy: null,
      approvedAt: null,
      reviewItems: [],
      contactOwner: null,
      followUpDate: null,
      lastUpdatedAt: occurredAt,
    });
    expect(reopened.reviewActions).toEqual(
      DEMO_REVIEWED_EPISODE.reviewActions,
    );
    expect(
      reopened.concerns.every(
        (concern) =>
          concern.reviewStatus === "unreviewed" &&
          concern.reviewerDisposition === null &&
          concern.resolutionReason === null,
      ),
    ).toBe(true);
    expect(
      reopened.auditEvents.some(
        (event) => event.action === "patient_plan_invalidated",
      ),
    ).toBe(true);
    expect(
      reopened.auditEvents.some(
        (event) =>
          event.action === "episode_transitioned" &&
          event.details.some(
            (detail) =>
              detail.key === "from" && detail.value === "resolved",
          ) &&
          event.details.some(
            (detail) =>
              detail.key === "to" &&
              detail.value === "awaiting_confirmation",
          ),
      ),
    ).toBe(true);
  });

  it.each([
    ["This combination is safe to take.", "binary_safety_claim"],
    ["You should stop apixaban.", "autonomous_treatment_change"],
    ["Stop taking apixaban.", "autonomous_treatment_change"],
    ["Please reduce the dose.", "autonomous_treatment_change"],
    ["Change your medicine.", "autonomous_treatment_change"],
    [
      "Consider substituting this medication.",
      "autonomous_treatment_change",
    ],
    [
      "The medication should be stopped.",
      "autonomous_treatment_change",
    ],
    ["This drug caused the bruising.", "causal_diagnosis"],
    ["AI recommends reducing the dose.", "ai_recommendation"],
    ["This is a confirmed interaction.", "unqualified_confirmation"],
  ] as const)("detects prohibited wording: %s", (text, code) => {
    expect(findProhibitedPhrases(text).map((item) => item.code)).toContain(
      code,
    );
  });

  it("permits the required bounded insufficient-evidence wording", () => {
    expect(findProhibitedPhrases(INSUFFICIENT_EVIDENCE_STATEMENT)).toEqual([]);
    expect(findProhibitedPhrases(REQUIRED_SAFETY_STATEMENT)).toEqual([]);
  });

  it("rejects unexpected clinical fields in generated explanations", () => {
    const result = GeneratedExplanationSchema.safeParse({
      id: "explanation-test",
      sourceConcernId: "concern-test",
      plainLanguageSummary: "This item needs professional review.",
      uncertaintyStatement: "Context is incomplete.",
      professionalQuestion: "What information would complete the review?",
      evidenceIds: ["evidence-test"],
      metadata: {
        provider: "deterministic_fixture",
        model: "test-model",
        promptVersion: "test-prompt-1",
        generatedAt: "2026-07-25T12:00:00Z",
        usedFallback: false,
      },
      severity: "major",
    });

    expect(result.success).toBe(false);
  });

  it("rejects treatment instructions even inside a schema-shaped explanation", () => {
    const result = GeneratedExplanationSchema.safeParse({
      id: "explanation-test",
      sourceConcernId: "concern-test",
      plainLanguageSummary: "You should stop this medication.",
      uncertaintyStatement: "Context is incomplete.",
      professionalQuestion: "What information would complete the review?",
      evidenceIds: ["evidence-test"],
      metadata: {
        provider: "deterministic_fixture",
        model: "test-model",
        promptVersion: "test-prompt-1",
        generatedAt: "2026-07-25T12:00:00Z",
        usedFallback: false,
      },
    });

    expect(result.success).toBe(false);
  });
});
