import { createAuditEvent } from "./audit";
import { assertPermittedClinicalLanguage } from "./language";
import type { z } from "zod";
import {
  ConcernSchema,
  PatientPlanSchema,
  ReviewActionSchema,
  type Actor,
  type AuditEvent,
  type Concern,
  type PatientPlan,
  type ReviewAction,
} from "./schemas";

export type CreateReviewActionInput = z.input<typeof ReviewActionSchema>;
export type CreateNextReviewActionInput = Omit<
  CreateReviewActionInput,
  "id" | "revision" | "supersedesReviewActionId"
>;

const reviewStatusByDisposition: Readonly<
  Record<ReviewAction["disposition"], Concern["reviewStatus"]>
> = {
  accepted_action_required: "accepted",
  accepted_already_managed: "accepted",
  monitor: "monitoring",
  not_relevant_due_to_context: "dismissed",
  duplicate_or_data_error: "dismissed",
  more_information_required: "more_information_required",
  escalated: "escalated",
  patient_declined_action: "resolved",
};

export function createReviewAction(
  rawAction: CreateReviewActionInput,
): ReviewAction {
  const action = ReviewActionSchema.parse(rawAction);
  for (const text of [
    action.reason,
    action.followUpAction,
    action.patientFacingMessage,
  ]) {
    if (text) {
      assertPermittedClinicalLanguage(text);
    }
  }
  return action;
}

export function getLatestReviewAction(
  actions: readonly ReviewAction[],
  concernId: string,
): ReviewAction | undefined {
  return actions
    .filter((action) => action.concernId === concernId)
    .reduce<ReviewAction | undefined>(
      (latest, action) =>
        latest === undefined || action.revision > latest.revision
          ? action
          : latest,
      undefined,
    );
}

/**
 * Creates the next immutable snapshot for a concern review. The revision and
 * supersession link are derived from persisted history so callers cannot
 * accidentally replace or reuse a prior decision identifier.
 */
export function createNextReviewAction(
  existingActions: readonly ReviewAction[],
  rawAction: CreateNextReviewActionInput,
): ReviewAction {
  const parsedExisting = existingActions.map((action) =>
    createReviewAction(action),
  );
  const latest = getLatestReviewAction(parsedExisting, rawAction.concernId);
  const revision = (latest?.revision ?? 0) + 1;
  const id = `review-${rawAction.concernId}-v${revision}`;
  if (parsedExisting.some((action) => action.id === id)) {
    throw new Error(`Review action ${id} already exists`);
  }

  return createReviewAction({
    ...rawAction,
    id,
    revision,
    supersedesReviewActionId: latest?.id ?? null,
  });
}

export function appendReviewAction(
  existingActions: readonly ReviewAction[],
  rawAction: CreateReviewActionInput,
): ReviewAction[] {
  const actions = existingActions.map((action) => createReviewAction(action));
  const action = createReviewAction(rawAction);
  if (actions.some((candidate) => candidate.id === action.id)) {
    throw new Error(`Review action ${action.id} already exists`);
  }

  const latest = getLatestReviewAction(actions, action.concernId);
  const expectedRevision = (latest?.revision ?? 0) + 1;
  const expectedSupersededId = latest?.id ?? null;
  if (
    action.revision !== expectedRevision ||
    action.supersedesReviewActionId !== expectedSupersededId
  ) {
    throw new Error(
      `Review action ${action.id} must be revision ${expectedRevision} and supersede ${expectedSupersededId ?? "no prior action"}`,
    );
  }
  return [...actions, action];
}

/**
 * Records the complete immutable review snapshot in the audit ledger. The
 * audit id is anchored to the versioned review-action id, making the link
 * stable and collision-safe.
 */
export function createReviewActionAuditEvent(
  rawAction: CreateReviewActionInput,
  actor: Actor,
  existingAuditEvents: readonly AuditEvent[] = [],
): AuditEvent {
  const action = createReviewAction(rawAction);
  return createAuditEvent({
    id: `audit-${action.id}`,
    episodeId: action.episodeId,
    action: "review_disposition_recorded",
    entityType: "review_action",
    entityId: action.id,
    actor,
    occurredAt: action.reviewedAt,
    existingEvents: existingAuditEvents,
    details: {
      concernId: action.concernId,
      disposition: action.disposition,
      dueDate: action.dueDate ?? "",
      followUpAction: action.followUpAction ?? "",
      owner: action.owner ?? "",
      patientFacingMessage: action.patientFacingMessage ?? "",
      reason: action.reason ?? "",
      reviewRevision: String(action.revision),
      reviewedAt: action.reviewedAt,
      reviewerId: action.reviewerId,
      reviewerName: action.reviewerName,
      supersedesReviewActionId: action.supersedesReviewActionId ?? "",
    },
  });
}

export function applyReviewActionToConcern(
  rawConcern: Concern,
  rawAction: ReviewAction,
): Concern {
  const concern = ConcernSchema.parse(rawConcern);
  const action = createReviewAction(rawAction);
  if (concern.id !== action.concernId || concern.episodeId !== action.episodeId) {
    throw new Error("Review action does not belong to this concern");
  }

  return ConcernSchema.parse({
    ...concern,
    reviewStatus: reviewStatusByDisposition[action.disposition],
    reviewerDisposition: action.disposition,
    resolutionReason: action.reason,
    auditEventIds: [...concern.auditEventIds, `audit-${action.id}`],
  });
}

function defaultPatientMessage(action: ReviewAction): string {
  switch (action.disposition) {
    case "accepted_action_required":
      return "Your pharmacist has recorded a follow-up action and will review this with you.";
    case "accepted_already_managed":
      return "Your pharmacist has confirmed that this item is already being managed.";
    case "monitor":
      return "Your care team has recorded this item for monitoring.";
    case "more_information_required":
      return "Your care team needs more information before completing this review.";
    case "escalated":
      return "This item has been escalated for professional review.";
    case "not_relevant_due_to_context":
    case "duplicate_or_data_error":
      return "Your pharmacist reviewed this item and recorded why it does not apply to the current plan.";
    case "patient_declined_action":
      return "Your decision and the professional discussion have been recorded.";
  }
}

export function applyReviewActionToPatientPlan(
  rawPlan: PatientPlan,
  rawConcern: Concern,
  rawAction: ReviewAction,
): PatientPlan {
  const plan = PatientPlanSchema.parse(rawPlan);
  const concern = ConcernSchema.parse(rawConcern);
  const action = createReviewAction(rawAction);
  if (
    plan.episodeId !== action.episodeId ||
    concern.id !== action.concernId ||
    concern.episodeId !== action.episodeId
  ) {
    throw new Error("Plan, concern, and review action must belong to one episode");
  }
  const patientFacingMessage =
    action.patientFacingMessage ?? defaultPatientMessage(action);
  assertPermittedClinicalLanguage(patientFacingMessage);

  const nextItem = {
    concernId: concern.id,
    disposition: action.disposition,
    whatCareTeamIsReviewing: concern.title,
    patientFacingMessage,
    owner: action.owner,
    followUpDate: action.dueDate,
  };
  const reviewItems = [
    ...plan.reviewItems.filter((item) => item.concernId !== concern.id),
    nextItem,
  ].sort((left, right) => left.concernId.localeCompare(right.concernId));

  return PatientPlanSchema.parse({
    ...plan,
    status: "draft",
    version: plan.version + 1,
    reviewItems,
    contactOwner: action.owner ?? plan.contactOwner,
    followUpDate: action.dueDate ?? plan.followUpDate,
    lastUpdatedAt: action.reviewedAt,
  });
}

export interface PublishPatientPlanResult {
  plan: PatientPlan;
  auditEvent: AuditEvent;
  workflowOutcome: "resolved" | "escalated";
}

export function publishPatientPlan(
  rawPlan: PatientPlan,
  expectedConcernIds: readonly string[],
  rawActor: Actor,
  occurredAt: string,
  existingAuditEvents: readonly AuditEvent[] = [],
): PublishPatientPlanResult {
  const plan = PatientPlanSchema.parse(rawPlan);
  const reviewedConcernIds = new Set(
    plan.reviewItems.map((item) => item.concernId),
  );
  const missingReviews = expectedConcernIds.filter(
    (concernId) => !reviewedConcernIds.has(concernId),
  );
  if (missingReviews.length > 0) {
    throw new Error(
      `Cannot publish a plan with unresolved review items: ${missingReviews.join(
        ", ",
      )}`,
    );
  }

  const approvedPlan = PatientPlanSchema.parse({
    ...plan,
    status: "approved",
    version: plan.version + 1,
    approvedBy: rawActor.name,
    approvedAt: occurredAt,
    lastUpdatedAt: occurredAt,
  });
  const auditEvent = createAuditEvent({
    episodeId: plan.episodeId,
    action: "patient_plan_published",
    entityType: "patient_plan",
    entityId: plan.id,
    actor: rawActor,
    occurredAt,
    existingEvents: existingAuditEvents,
    details: {
      planVersion: String(approvedPlan.version),
      reviewItemCount: String(approvedPlan.reviewItems.length),
    },
  });
  const workflowOutcome = approvedPlan.reviewItems.some(
    (item) => item.disposition === "escalated",
  )
    ? "escalated"
    : "resolved";

  return { plan: approvedPlan, auditEvent, workflowOutcome };
}
