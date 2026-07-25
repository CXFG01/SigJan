import { createAuditEvent } from "./audit";
import {
  EpisodeStateSchema,
  WorkflowStateSchema,
  type Actor,
  type AuditEvent,
  type EpisodeState,
  type WorkflowState,
} from "./schemas";

const allowedTransitions: Readonly<
  Record<WorkflowState, readonly WorkflowState[]>
> = {
  draft: ["awaiting_confirmation"],
  awaiting_confirmation: ["ready_for_review"],
  ready_for_review: ["awaiting_confirmation", "in_review"],
  in_review: ["awaiting_confirmation", "resolved", "escalated"],
  resolved: ["awaiting_confirmation", "archived"],
  escalated: ["awaiting_confirmation", "in_review", "resolved", "archived"],
  archived: [],
};

export function getAllowedWorkflowTransitions(
  state: WorkflowState,
): readonly WorkflowState[] {
  return allowedTransitions[WorkflowStateSchema.parse(state)];
}

export function canTransitionWorkflow(
  from: WorkflowState,
  to: WorkflowState,
): boolean {
  return getAllowedWorkflowTransitions(from).includes(to);
}

export class InvalidWorkflowTransitionError extends Error {
  readonly from: WorkflowState;
  readonly to: WorkflowState;

  constructor(from: WorkflowState, to: WorkflowState, detail?: string) {
    super(
      `Invalid SignalRx workflow transition from ${from} to ${to}${
        detail ? `: ${detail}` : ""
      }`,
    );
    this.name = "InvalidWorkflowTransitionError";
    this.from = from;
    this.to = to;
  }
}

export interface EpisodeTransitionResult {
  episode: EpisodeState;
  auditEvent: AuditEvent;
}

export function transitionEpisode(
  rawEpisode: EpisodeState,
  to: WorkflowState,
  actor: Actor,
  occurredAt: string,
): EpisodeTransitionResult {
  const episode = EpisodeStateSchema.parse(rawEpisode);
  const nextState = WorkflowStateSchema.parse(to);
  if (!canTransitionWorkflow(episode.workflowState, nextState)) {
    throw new InvalidWorkflowTransitionError(
      episode.workflowState,
      nextState,
    );
  }

  if (nextState === "ready_for_review") {
    const unconfirmedEntries = episode.medicationEntries.filter(
      (entry) =>
        ![
          "confirmed",
          "corrected",
          "missing_information",
          "possibly_stopped",
        ].includes(entry.confirmationStatus),
    );
    if (unconfirmedEntries.length > 0) {
      throw new InvalidWorkflowTransitionError(
        episode.workflowState,
        nextState,
        `items still require confirmation: ${unconfirmedEntries
          .map((entry) => entry.id)
          .join(", ")}`,
      );
    }
  }

  const auditEvent = createAuditEvent({
    episodeId: episode.id,
    action: "episode_transitioned",
    entityType: "episode",
    entityId: episode.id,
    actor,
    occurredAt,
    existingEvents: episode.auditEvents,
    details: {
      from: episode.workflowState,
      to: nextState,
    },
  });
  const updatedEpisode = EpisodeStateSchema.parse({
    ...episode,
    workflowState: nextState,
    asOf: occurredAt,
    auditEvents: [...episode.auditEvents, auditEvent],
  });

  return { episode: updatedEpisode, auditEvent };
}

function hasReviewArtifacts(episode: EpisodeState): boolean {
  return (
    episode.patientPlan.status === "approved" ||
    episode.patientPlan.reviewItems.length > 0 ||
    episode.concerns.some(
      (concern) =>
        concern.reviewStatus !== "unreviewed" ||
        concern.reviewerDisposition !== null ||
        concern.resolutionReason !== null,
    ) ||
    ["in_review", "resolved", "escalated"].includes(episode.workflowState)
  );
}

/**
 * Reopens the governed review cycle after a clinically material medication
 * mutation. Historical audit events and immutable review-action revisions are
 * retained, while current approval and review projections are cleared so that
 * a prior decision cannot silently apply to the changed medication record.
 */
export function reopenEpisodeAfterMedicationMutation(
  rawEpisode: EpisodeState,
  actor: Actor,
  occurredAt: string,
): EpisodeState {
  const episode = EpisodeStateSchema.parse(rawEpisode);
  const reviewArtifactsPresent = hasReviewArtifacts(episode);
  const hasBlockingConfirmation = episode.medicationEntries.some((entry) =>
    ["needs_confirmation", "uncertain_match"].includes(
      entry.confirmationStatus,
    ),
  );

  if (!reviewArtifactsPresent && !hasBlockingConfirmation) {
    return episode;
  }
  if (episode.workflowState === "archived") {
    throw new InvalidWorkflowTransitionError(
      "archived",
      "awaiting_confirmation",
      "an archived episode cannot be reopened by a medication mutation",
    );
  }

  let updated = EpisodeStateSchema.parse({
    ...episode,
    concerns: episode.concerns.map((concern) => ({
      ...concern,
      reviewStatus: "unreviewed",
      reviewerDisposition: null,
      resolutionReason: null,
    })),
    patientPlan: {
      ...episode.patientPlan,
      status: "draft",
      version:
        episode.patientPlan.version + (reviewArtifactsPresent ? 1 : 0),
      reviewItems: [],
      contactOwner: null,
      followUpDate: null,
      approvedBy: null,
      approvedAt: null,
      lastUpdatedAt: occurredAt,
    },
  });

  if (reviewArtifactsPresent) {
    const invalidationAuditEvent = createAuditEvent({
      episodeId: episode.id,
      action: "patient_plan_invalidated",
      entityType: "patient_plan",
      entityId: episode.patientPlan.id,
      actor,
      occurredAt,
      existingEvents: updated.auditEvents,
      details: {
        reason: "medication_record_changed",
        previousPlanStatus: episode.patientPlan.status,
        previousWorkflowState: episode.workflowState,
        preservedReviewActionCount: String(episode.reviewActions.length),
      },
    });
    updated = EpisodeStateSchema.parse({
      ...updated,
      auditEvents: [...updated.auditEvents, invalidationAuditEvent],
    });
  }

  if (updated.workflowState !== "awaiting_confirmation") {
    updated = transitionEpisode(
      updated,
      "awaiting_confirmation",
      actor,
      occurredAt,
    ).episode;
  }

  return updated;
}
