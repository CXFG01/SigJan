import { describe, expect, it } from "vitest";

import {
  DEMO_CAREGIVER_ACTOR,
  DEMO_EPISODE,
  DEMO_MEDICATION_ENTRIES,
  DEMO_PATIENT_ACTOR,
  InvalidWorkflowTransitionError,
  correctMedicationEntry,
  correctMedicationFields,
  correctMedicationIdentity,
  recordCaregiverMedicationStatus,
  transitionEpisode,
} from "@/domain";
import {
  createSignalRxProvider,
  extractDemoIntakeSource,
} from "@/providers";

describe("capture, confirmation, and attribution", () => {
  it("keeps every extracted candidate provisional", async () => {
    const provider = createSignalRxProvider();
    const response = await provider.extract({
      requestId: "request-discharge-extraction",
      sourceId: "source-discharge-letter",
      sourceType: "discharge_document",
      content:
        "Apixaban 5 mg twice daily. Diltiazem strength unclear. Lisinopril 10 mg once daily. Spironolactone 25 mg once daily.",
      requestedAt: "2026-07-25T11:30:00Z",
    });

    expect(response.candidates.length).toBeGreaterThan(0);
    expect(
      response.candidates.every(
        (candidate) =>
          candidate.confirmationStatus !== ("confirmed" as string),
      ),
    ).toBe(true);
  });

  it("creates only source-specific provisional demo candidates", async () => {
    const discharge = await extractDemoIntakeSource(
      "discharge_document",
    );
    const boxes = await extractDemoIntakeSource("medicine_box");
    const voice = await extractDemoIntakeSource(
      "voice_note",
      "I sometimes take ibuprofen for my knee.",
    );

    expect(discharge.entries.map((entry) => entry.id)).toEqual([
      "med-apixaban",
      "med-diltiazem",
      "med-lisinopril",
      "med-spironolactone",
    ]);
    expect(boxes.entries.map((entry) => entry.id)).toEqual([
      "med-ginkgo",
      "med-cardizem-home-supply",
    ]);
    expect(voice.entries.map((entry) => entry.id)).toEqual([
      "med-ibuprofen",
    ]);
    expect(
      [...discharge.entries, ...boxes.entries, ...voice.entries].every(
        (entry) =>
          !["confirmed", "corrected"].includes(
            entry.confirmationStatus,
          ),
      ),
    ).toBe(true);
  });

  it("deduplicates provider aliases that map to one source medication", async () => {
    const baseProvider = createSignalRxProvider();
    const duplicateAliasProvider = {
      async extract(
        request: Parameters<typeof baseProvider.extract>[0],
      ) {
        const response = await baseProvider.extract(request);
        if (
          request.sourceId !== "source-cardizem-home-photo" ||
          response.candidates.length === 0
        ) {
          return response;
        }
        return {
          ...response,
          candidates: [
            ...response.candidates,
            {
              ...response.candidates[0],
              id: "candidate-cardizem-alias-duplicate",
              enteredName: "Cardizem CD",
            },
          ],
        };
      },
      explain: baseProvider.explain.bind(baseProvider),
    };

    const boxes = await extractDemoIntakeSource(
      "medicine_box",
      undefined,
      duplicateAliasProvider,
    );

    expect(boxes.entries.map((entry) => entry.id)).toEqual([
      "med-ginkgo",
      "med-cardizem-home-supply",
    ]);
  });

  it("lets a user correction supersede extraction while preserving provenance", () => {
    const diltiazem = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-diltiazem",
    )!;
    const corrected = correctMedicationEntry(
      diltiazem,
      "strength",
      120,
      DEMO_PATIENT_ACTOR,
      "2026-07-25T11:45:00Z",
    );
    const correction = corrected.provenance.at(-1)!;

    expect(corrected.strength).toBe(120);
    expect(corrected.confirmationStatus).toBe("corrected");
    expect(corrected.sourceExcerpt).toBe(diltiazem.sourceExcerpt);
    expect(corrected.provenance.length).toBe(diltiazem.provenance.length + 1);
    expect(correction).toMatchObject({
      field: "strength",
      originalValue: null,
      normalizedValue: 120,
      editorId: DEMO_PATIENT_ACTOR.id,
      supersedesProvenanceId:
        "provenance-diltiazem-strength-1",
    });
  });

  it("commits multi-field corrections atomically with field provenance", () => {
    const diltiazem = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-diltiazem",
    )!;
    const corrected = correctMedicationFields(
      diltiazem,
      {
        strength: 120,
        dose: "1 tablet each morning",
        reportedBy: "Evelyn Carter",
      },
      DEMO_PATIENT_ACTOR,
      "2026-07-25T11:45:00Z",
    );

    expect(corrected).toMatchObject({
      strength: 120,
      dose: "1 tablet each morning",
      reportedBy: "Evelyn Carter",
      confirmationStatus: "corrected",
    });
    expect(
      corrected.provenance.slice(-3).map((record) => record.field),
    ).toEqual(["strength", "dose", "reportedBy"]);
  });

  it("remaps a corrected product identity as one governed tuple", () => {
    const diltiazem = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-diltiazem",
    )!;
    const remapped = correctMedicationIdentity(
      diltiazem,
      "Eliquis",
      DEMO_PATIENT_ACTOR,
      "2026-07-25T11:46:00Z",
    );

    expect(remapped).toMatchObject({
      enteredName: "Eliquis",
      normalizedName: "Apixaban",
      conceptId: "concept-apixaban-tablet",
      ingredient: "apixaban",
      ingredientIds: ["ingredient-apixaban"],
      normalizationStatus: "matched",
      confirmationStatus: "corrected",
    });
    expect(
      remapped.provenance.slice(-3).map((record) => record.field),
    ).toEqual(["enteredName", "normalizedName", "ingredient"]);
  });

  it("clears stale clinical identity when a corrected name is unknown", () => {
    const diltiazem = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-diltiazem",
    )!;
    const remapped = correctMedicationIdentity(
      diltiazem,
      "Unlabelled blue tablet",
      DEMO_PATIENT_ACTOR,
      "2026-07-25T11:47:00Z",
    );

    expect(remapped).toMatchObject({
      normalizedName: null,
      conceptId: null,
      ingredient: null,
      ingredientIds: [],
      normalizationStatus: "unknown",
      confirmationStatus: "missing_information",
    });
  });

  it("blocks ready-for-review until unresolved extraction is corrected or acknowledged", () => {
    expect(() =>
      transitionEpisode(
        DEMO_EPISODE,
        "ready_for_review",
        DEMO_PATIENT_ACTOR,
        "2026-07-25T11:45:00Z",
      ),
    ).toThrow(InvalidWorkflowTransitionError);

    const correctedDiltiazem = correctMedicationEntry(
      DEMO_EPISODE.medicationEntries.find(
        (entry) => entry.id === "med-diltiazem",
      )!,
      "strength",
      120,
      DEMO_PATIENT_ACTOR,
      "2026-07-25T11:44:00Z",
    );
    const correctedEpisode = {
      ...structuredClone(DEMO_EPISODE),
      medicationEntries: DEMO_EPISODE.medicationEntries.map((entry) =>
        entry.id === correctedDiltiazem.id ? correctedDiltiazem : entry,
      ),
    };
    const result = transitionEpisode(
      correctedEpisode,
      "ready_for_review",
      DEMO_PATIENT_ACTOR,
      "2026-07-25T11:45:00Z",
    );

    expect(result.episode.workflowState).toBe("ready_for_review");
    expect(result.auditEvent.action).toBe("episode_transitioned");
  });

  it("attributes caregiver status changes and creates an audit event", () => {
    const lisinopril = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-lisinopril",
    )!;
    const result = recordCaregiverMedicationStatus(
      lisinopril,
      "taken",
      "Daniel Carter",
      "Daniel checked the morning medicines with Evelyn.",
      DEMO_CAREGIVER_ACTOR,
      "2026-07-25T08:30:00Z",
    );

    expect(result.entry.administrationStatus).toBe("taken");
    expect(result.entry.administeredBy).toBe("Daniel Carter");
    expect(result.entry.provenance).toHaveLength(
      lisinopril.provenance.length + 2,
    );
    expect(result.entry.provenance.at(-2)).toMatchObject({
      editorId: DEMO_CAREGIVER_ACTOR.id,
      editorRole: "caregiver",
      field: "administrationStatus",
    });
    expect(result.entry.provenance.at(-1)).toMatchObject({
      editorId: DEMO_CAREGIVER_ACTOR.id,
      editorRole: "caregiver",
      field: "administeredBy",
      originalValue: "Evelyn Carter",
      normalizedValue: "Daniel Carter",
      supersedesProvenanceId:
        "provenance-lisinopril-administered-by-1",
    });
    expect(result.auditEvent).toMatchObject({
      action: "caregiver_status_recorded",
      actor: DEMO_CAREGIVER_ACTOR,
      entityId: "med-lisinopril",
    });
    expect(Object.fromEntries(
      result.auditEvent.details.map(({ key, value }) => [key, value]),
    )).toMatchObject({
      administrationStatus: "taken",
      administeredBy: "Daniel Carter",
      previousAdministrationStatus: "taken",
      previousAdministeredBy: "Evelyn Carter",
    });
  });

  it("rejects a caregiver status update without an administrator", () => {
    const lisinopril = DEMO_MEDICATION_ENTRIES.find(
      (entry) => entry.id === "med-lisinopril",
    )!;

    expect(() =>
      recordCaregiverMedicationStatus(
        lisinopril,
        "unknown",
        "   ",
        "",
        DEMO_CAREGIVER_ACTOR,
        "2026-07-25T08:31:00Z",
      ),
    ).toThrow("Caregiver medication updates require an administrator");
  });
});
