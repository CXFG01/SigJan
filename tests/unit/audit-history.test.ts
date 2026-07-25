import { describe, expect, it } from "vitest";

import {
  DEMO_CAREGIVER_ACTOR,
  DEMO_EPISODE,
  DEMO_PATIENT_ACTOR,
  DEMO_PHARMACIST_ACTOR,
  DEMO_REVIEW_ACTIONS,
  EpisodeStateSchema,
  appendReviewAction,
  correctMedicationEntry,
  createAuditEvent,
  createNextReviewAction,
  createReviewActionAuditEvent,
  recordCaregiverMedicationStatus,
  type AuditEvent,
  type ReviewAction,
} from "@/domain";

const rapidTimestamp = "2026-07-25T13:00:00.123Z";

function detailRecord(event: AuditEvent): Record<string, string> {
  return Object.fromEntries(
    event.details.map(({ key, value }) => [key, value]),
  );
}

describe("append-only audit and review history", () => {
  it("allocates deterministic unique audit ids for events in the same millisecond", () => {
    const events: AuditEvent[] = [];
    const input = {
      episodeId: DEMO_EPISODE.id,
      action: "medication_corrected" as const,
      entityType: "medication_entry" as const,
      entityId: DEMO_EPISODE.medicationEntries[0].id,
      actor: DEMO_PATIENT_ACTOR,
      occurredAt: rapidTimestamp,
      details: { field: "dose" },
    };

    for (let index = 0; index < 3; index += 1) {
      events.push(createAuditEvent({ ...input, existingEvents: events }));
    }

    expect(events.map((event) => event.id)).toEqual([
      `audit-medication-corrected-${input.entityId}-20260725130000123`,
      `audit-medication-corrected-${input.entityId}-20260725130000123-2`,
      `audit-medication-corrected-${input.entityId}-20260725130000123-3`,
    ]);
    expect(new Set(events.map((event) => event.id)).size).toBe(3);
  });

  it("rejects duplicate audit ids at the episode boundary", () => {
    const duplicate = DEMO_EPISODE.auditEvents[0];
    const result = EpisodeStateSchema.safeParse({
      ...DEMO_EPISODE,
      auditEvents: [...DEMO_EPISODE.auditEvents, duplicate],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: `Duplicate audit event id: ${duplicate.id}`,
          }),
        ]),
      );
    }
  });

  it("keeps complete, versioned professional-review snapshots", () => {
    const seed = DEMO_REVIEW_ACTIONS[0];
    const seedInput = {
      episodeId: seed.episodeId,
      concernId: seed.concernId,
      disposition: seed.disposition,
      reason: seed.reason,
      owner: seed.owner,
      dueDate: seed.dueDate,
      followUpAction: seed.followUpAction,
      patientFacingMessage: seed.patientFacingMessage,
      reviewerId: seed.reviewerId,
      reviewerName: seed.reviewerName,
      reviewedAt: seed.reviewedAt,
    };
    let actions: ReviewAction[] = [];
    const audits: AuditEvent[] = [];

    for (const [index, disposition] of [
      "more_information_required",
      "monitor",
      "accepted_action_required",
    ].entries()) {
      const action = createNextReviewAction(actions, {
        ...seedInput,
        disposition:
          disposition as ReviewAction["disposition"],
        reason: `Review snapshot ${index + 1} remains bounded to the documented evidence.`,
        reviewedAt: rapidTimestamp,
      });
      actions = appendReviewAction(actions, action);
      audits.push(
        createReviewActionAuditEvent(
          action,
          DEMO_PHARMACIST_ACTOR,
          audits,
        ),
      );
    }

    expect(actions.map((action) => action.revision)).toEqual([1, 2, 3]);
    expect(actions.map((action) => action.id)).toEqual([
      `review-${seedInput.concernId}-v1`,
      `review-${seedInput.concernId}-v2`,
      `review-${seedInput.concernId}-v3`,
    ]);
    expect(
      actions.map((action) => action.supersedesReviewActionId),
    ).toEqual([null, actions[0].id, actions[1].id]);
    expect(new Set(audits.map((event) => event.id)).size).toBe(3);
    expect(audits.map((event) => detailRecord(event).reason)).toEqual(
      actions.map((action) => action.reason),
    );
    expect(audits.map((event) => detailRecord(event).reviewRevision)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(detailRecord(audits[2])).toMatchObject({
      concernId: actions[2].concernId,
      disposition: actions[2].disposition,
      followUpAction: actions[2].followUpAction,
      owner: actions[2].owner,
      patientFacingMessage: actions[2].patientFacingMessage,
      reviewerId: actions[2].reviewerId,
      reviewerName: actions[2].reviewerName,
      supersedesReviewActionId: actions[1].id,
    });
  });

  it("rejects duplicate or non-contiguous review revisions", () => {
    const original = DEMO_REVIEW_ACTIONS[0];
    expect(() => appendReviewAction([original], original)).toThrow(
      /already exists/iu,
    );

    const result = EpisodeStateSchema.safeParse({
      ...DEMO_EPISODE,
      reviewActions: [
        original,
        {
          ...original,
          id: `${original.id}-alternate`,
          supersedesReviewActionId: original.id,
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(({ message }) =>
          message.includes("contiguous and unique"),
        ),
      ).toBe(true);
    }
  });

  it("keeps rapid correction and caregiver-status audit ids unique", () => {
    let entry = structuredClone(DEMO_EPISODE.medicationEntries[0]);
    const correctionAudits: AuditEvent[] = [];
    for (const dose of ["one tablet", "two tablets", "one tablet"]) {
      entry = correctMedicationEntry(
        entry,
        "dose",
        dose,
        DEMO_PATIENT_ACTOR,
        rapidTimestamp,
      );
      correctionAudits.push(
        createAuditEvent({
          episodeId: DEMO_EPISODE.id,
          action: "medication_corrected",
          entityType: "medication_entry",
          entityId: entry.id,
          actor: DEMO_PATIENT_ACTOR,
          occurredAt: rapidTimestamp,
          existingEvents: correctionAudits,
          details: { field: "dose", value: dose },
        }),
      );
    }

    const caregiverAudits: AuditEvent[] = [];
    for (const status of ["taken", "unknown", "not_taken"] as const) {
      const result = recordCaregiverMedicationStatus(
        entry,
        status,
        DEMO_CAREGIVER_ACTOR.name,
        `Recorded as ${status}.`,
        DEMO_CAREGIVER_ACTOR,
        rapidTimestamp,
        caregiverAudits,
      );
      entry = result.entry;
      caregiverAudits.push(result.auditEvent);
    }

    expect(new Set(correctionAudits.map((event) => event.id)).size).toBe(3);
    expect(new Set(caregiverAudits.map((event) => event.id)).size).toBe(3);
    expect(caregiverAudits[2].id).toMatch(/-3$/u);
  });
});
